import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { buscarClimaHistorico } from './_lib/climaOpenMeteo.js';
import { preencherClimaSeVazio } from './_lib/climaAuto.js';

// O clima (busca pontual + backfill) mora aqui, via ?recurso=, em vez de em
// arquivos próprios — a Vercel Hobby limita a 12 Serverless Functions por
// deploy, e clima só é usado a partir do formulário de eventos mesmo.
async function handleClimaLookup(req, res, supabase) {
  const { data } = req.query;
  if (!data) return res.status(400).json({ error: 'data é obrigatória' });

  const { data: existente } = await supabase.from('clima_historico').select('*').eq('data', data).maybeSingle();
  if (existente) return res.status(200).json(existente);

  try {
    const [registro] = await buscarClimaHistorico(data, data);
    if (!registro) return res.status(404).json({ error: 'Sem dados de clima pra essa data' });
    const { data: salvo, error } = await supabase.from('clima_historico').upsert(registro, { onConflict: 'data' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(salvo);
  } catch (err) {
    return res.status(502).json({ error: `Falha ao buscar clima: ${err.message}` });
  }
}

async function handleClimaBackfill(req, res, supabase) {
  const { ano } = req.body || {};
  if (!ano) return res.status(400).json({ error: 'ano é obrigatório' });

  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = `${ano}-01-01`;
  const fimCandidato = `${ano}-12-31`;
  const fim = fimCandidato > hoje ? hoje : fimCandidato;
  if (inicio > fim) return res.status(200).json({ ano, dias: 0 });

  try {
    const registros = await buscarClimaHistorico(inicio, fim);
    const { error } = await supabase.from('clima_historico').upsert(registros, { onConflict: 'data' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ano, dias: registros.length });
  } catch (err) {
    return res.status(502).json({ error: `Falha ao buscar clima: ${err.message}` });
  }
}

export default async function handler(req, res) {
  try {
    return await handlerInterno(req, res);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro inesperado' });
  }
}

async function handlerInterno(req, res) {
  if (!requireAuth(req, res)) return;
  const supabase = getSupabaseAdmin();
  const { recurso } = req.query;

  if (recurso === 'clima' && req.method === 'GET') return handleClimaLookup(req, res, supabase);
  if (recurso === 'clima-backfill' && req.method === 'POST') return handleClimaBackfill(req, res, supabase);

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('relatorio_eventos').select('*').order('data', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    let payload = req.body || {};
    payload = await preencherClimaSeVazio(supabase, payload.data, payload, null);
    const { data, error } = await supabase.from('relatorio_eventos').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    updates.updated_at = new Date().toISOString();

    // Preenche clima automaticamente se ainda não tiver (nem no que está sendo
    // enviado agora, nem no que já estava salvo) — cobre eventos criados por
    // qualquer um dos importadores colados, que nunca passam pelo formulário.
    const { data: existente } = await supabase
      .from('relatorio_eventos')
      .select('data, clima_fonte, clima_condicoes, clima_temperatura_max')
      .eq('id', id)
      .maybeSingle();
    const dataDoEvento = updates.data || existente?.data;
    const payload = await preencherClimaSeVazio(supabase, dataDoEvento, updates, existente);

    const { data, error } = await supabase.from('relatorio_eventos').update(payload).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    const { error } = await supabase.from('relatorio_eventos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

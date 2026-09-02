import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { buscarClimaHistorico } from './_lib/climaOpenMeteo.js';

// POST { ano } — busca o clima do ano inteiro (ou até hoje, se for o ano
// atual) numa chamada só à Open-Meteo e faz upsert em clima_historico.
// Feito um ano por vez (chamado várias vezes pelo front) pra não estourar o
// tempo de execução da function buscando muitos anos de uma vez.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { ano } = req.body || {};
  if (!ano) return res.status(400).json({ error: 'ano é obrigatório' });

  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = `${ano}-01-01`;
  const fimCandidato = `${ano}-12-31`;
  const fim = fimCandidato > hoje ? hoje : fimCandidato;
  if (inicio > fim) return res.status(200).json({ ano, dias: 0 });

  try {
    const registros = await buscarClimaHistorico(inicio, fim);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('clima_historico').upsert(registros, { onConflict: 'data' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ano, dias: registros.length });
  } catch (err) {
    return res.status(502).json({ error: `Falha ao buscar clima: ${err.message}` });
  }
}

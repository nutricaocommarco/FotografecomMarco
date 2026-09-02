import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { parseCsv } from './_lib/csvParser.js';
import { prepararLinhasCsv } from './_lib/comprasCsv.js';
import { hashCpf } from './_lib/hash.js';
import { calcularEstatisticasMes, calcularDistribuicaoFrequenciaAnual } from './_lib/comprasStats.js';

const PAGINA = 1000;

async function buscarLinhasDoAno(supabase, ano) {
  const linhas = [];
  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('compras_hash')
      .select('cpf_hash')
      .gte('mes_referencia', `${ano}-01-01`)
      .lte('mes_referencia', `${ano}-12-31`)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(error.message);
    linhas.push(...data);
    if (data.length < PAGINA) break;
    inicio += PAGINA;
  }
  return linhas;
}

// select() do Supabase tem um limite implícito por página — pagina até
// esgotar, pra funcionar mesmo quando o histórico crescer além de 1000 linhas.
async function buscarHashesAntesDe(supabase, mesReferencia) {
  const hashes = new Set();
  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('compras_hash')
      .select('cpf_hash')
      .lt('mes_referencia', mesReferencia)
      .not('cpf_hash', 'is', null)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(error.message);
    data.forEach((r) => hashes.add(r.cpf_hash));
    if (data.length < PAGINA) break;
    inicio += PAGINA;
  }
  return hashes;
}

async function handleImportar(req, res, supabase) {
  const { csvText, arquivoNome } = req.body || {};
  if (!csvText) return res.status(400).json({ error: 'csvText é obrigatório' });

  let linhasBrutas;
  try {
    linhasBrutas = prepararLinhasCsv(parseCsv(csvText));
  } catch (err) {
    return res.status(400).json({ error: `Falha ao ler o CSV: ${err.message}` });
  }
  if (linhasBrutas.length === 0) return res.status(400).json({ error: 'Nenhuma linha válida encontrada no CSV' });

  let linhas;
  try {
    linhas = linhasBrutas.map((l) => ({
      cpf_hash: l.cpf ? hashCpf(l.cpf) : null,
      mes_referencia: l.mes_referencia,
      data_pagamento: l.data_pagamento,
      valor_bruto: l.valor_bruto,
      meio_pagamento: l.meio_pagamento,
      codigo_servico: l.codigo_servico,
    }));
  } catch (err) {
    return res.status(500).json({ error: `Falha ao gerar hash dos CPFs: ${err.message}` });
  }

  const meses = [...new Set(linhas.map((l) => l.mes_referencia))].sort();
  const porMes = {};

  for (const mes of meses) {
    const linhasDoMes = linhas.filter((l) => l.mes_referencia === mes);

    const { error: erroDelete } = await supabase.from('compras_hash').delete().eq('mes_referencia', mes);
    if (erroDelete) return res.status(500).json({ error: erroDelete.message });

    const { error: erroInsert } = await supabase.from('compras_hash').insert(linhasDoMes);
    if (erroInsert) return res.status(500).json({ error: erroInsert.message });

    const hashesVistosAntes = await buscarHashesAntesDe(supabase, mes);
    const stats = calcularEstatisticasMes(linhasDoMes, hashesVistosAntes);

    const { error: erroUpsert } = await supabase.from('importacoes_compradores').upsert(
      { mes_referencia: mes, ...stats, ultimo_arquivo: arquivoNome || null, atualizado_em: new Date().toISOString() },
      { onConflict: 'mes_referencia' },
    );
    if (erroUpsert) return res.status(500).json({ error: erroUpsert.message });

    porMes[mes] = stats;
  }

  return res.status(200).json({ meses_afetados: meses, linhas_processadas: linhas.length, por_mes: porMes });
}

// Um erro inesperado (config faltando, etc.) crashava antes com uma página
// de erro crua da Vercel em vez de um JSON legível — esse try/catch garante
// que o front sempre recebe um erro que dá pra mostrar pro usuário.
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

  if (req.method === 'POST') return handleImportar(req, res, supabase);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const { mes, ano } = req.query;

  if (ano) {
    const linhas = await buscarLinhasDoAno(supabase, ano);
    return res.status(200).json({ ano, distribuicao_frequencia: calcularDistribuicaoFrequenciaAnual(linhas) });
  }

  if (mes) {
    const { data, error } = await supabase.from('importacoes_compradores').select('*').eq('mes_referencia', `${mes}-01`).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || null);
  }

  const { data, error } = await supabase
    .from('importacoes_compradores')
    .select('*')
    .order('mes_referencia', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

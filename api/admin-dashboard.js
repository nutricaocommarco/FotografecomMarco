import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { calcularPrevisao } from './_lib/previsao.js';

function linhaVaziaDoMes(mes) {
  return {
    mes,
    fotosEnviadas: 0,
    fotosVendidas: 0,
    receitaBaixa: 0,
    receitaMedia: 0,
    receitaAlta: 0,
    receitaPremium: 0,
    receitaTotal: 0,
    rostosReconhecidos: 0,
  };
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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const supabase = getSupabaseAdmin();

  const { data: eventos, error: erroEventos } = await supabase.from('relatorio_eventos').select('*').order('data');
  if (erroEventos) return res.status(500).json({ error: erroEventos.message });

  const { data: compradores, error: erroCompradores } = await supabase
    .from('importacoes_compradores')
    .select('mes_referencia, valor_bruto_total, ticket_medio, taxa_recompra_mes')
    .order('mes_referencia');
  if (erroCompradores) return res.status(500).json({ error: erroCompradores.message });

  const porMesMap = new Map();
  for (const ev of eventos) {
    const mes = ev.data.slice(0, 7);
    if (!porMesMap.has(mes)) porMesMap.set(mes, linhaVaziaDoMes(mes));
    const r = porMesMap.get(mes);
    r.fotosEnviadas += ev.fotos_enviadas || 0;
    r.fotosVendidas += ev.fotos_vendidas_total || 0;
    r.receitaBaixa += ev.vendas_baixa_valor || 0;
    r.receitaMedia += ev.vendas_media_valor || 0;
    r.receitaAlta += ev.vendas_alta_valor || 0;
    r.receitaPremium += ev.vendas_premium_valor || 0;
    r.receitaTotal += ev.valor_total_vendido || 0;
    r.rostosReconhecidos += ev.rostos_reconhecidos || 0;
  }

  const porMes = [...porMesMap.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((r) => ({ ...r, taxaConversao: r.fotosEnviadas ? (r.fotosVendidas / r.fotosEnviadas) * 100 : null }));

  const climaXReceita = eventos
    .filter((ev) => ev.valor_total_vendido != null && ev.clima_precipitacao_mm != null)
    .map((ev) => ({
      data: ev.data,
      precipitacaoMm: ev.clima_precipitacao_mm,
      ventoKmhMax: ev.clima_vento_kmh_max,
      valorTotalVendido: ev.valor_total_vendido,
    }));

  const compradoresPorMes = compradores.map((c) => ({
    mes: c.mes_referencia.slice(0, 7),
    valorBrutoTotal: c.valor_bruto_total,
    ticketMedio: c.ticket_medio,
    taxaRecompraMes: c.taxa_recompra_mes,
  }));

  // A previsão usa o mesmo `eventos` já buscado acima — calculada aqui em vez
  // de numa function própria (a Vercel Hobby limita a 12 Serverless Functions
  // por deploy), e o front ganha de brinde: uma chamada em vez de duas.
  const previsao = calcularPrevisao(
    eventos.map((e) => ({ data: e.data, valor_total_vendido: e.valor_total_vendido, clima_precipitacao_mm: e.clima_precipitacao_mm })),
  );

  return res.status(200).json({ porMes, climaXReceita, compradoresPorMes, previsao });
}

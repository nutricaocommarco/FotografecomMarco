import { buscarClimaHistorico } from './climaOpenMeteo.js';

// Se o payload de um evento não define clima explicitamente, e o evento
// ainda não tem clima salvo (climaExistente, só relevante em updates), busca
// no cache (clima_historico) ou na Open-Meteo e devolve os campos de clima
// prontos pra entrar no insert/update. Nunca sobrescreve clima já preenchido
// (manual ou automático) — best-effort: qualquer falha aqui não pode
// bloquear a escrita do evento em si.
export async function preencherClimaSeVazio(supabase, dataEvento, payload, climaExistente) {
  const payloadTemClima =
    (Array.isArray(payload.clima_condicoes) && payload.clima_condicoes.length > 0) ||
    payload.clima_temperatura_max != null ||
    payload.clima_precipitacao_mm != null;
  if (payloadTemClima || !dataEvento) return payload;

  if (climaExistente) {
    const jaTemClima =
      climaExistente.clima_fonte ||
      (Array.isArray(climaExistente.clima_condicoes) && climaExistente.clima_condicoes.length > 0) ||
      climaExistente.clima_temperatura_max != null;
    if (jaTemClima) return payload;
  }

  try {
    const { data: cache } = await supabase.from('clima_historico').select('*').eq('data', dataEvento).maybeSingle();
    let registro = cache;
    if (!registro) {
      const [buscado] = await buscarClimaHistorico(dataEvento, dataEvento);
      if (buscado) {
        await supabase.from('clima_historico').upsert(buscado, { onConflict: 'data' });
        registro = buscado;
      }
    }
    if (!registro) return payload;

    return {
      ...payload,
      clima_condicoes: registro.condicoes || [],
      clima_temperatura_max: registro.temperatura_max ?? null,
      clima_temperatura_min: registro.temperatura_min ?? null,
      clima_precipitacao_mm: registro.precipitacao_mm ?? null,
      clima_vento_kmh_max: registro.vento_kmh_max ?? null,
      clima_fonte: 'auto',
    };
  } catch {
    return payload;
  }
}

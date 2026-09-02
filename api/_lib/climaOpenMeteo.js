// Mirante Ponta da Prainha — mesmas coordenadas usadas no schema LocalBusiness da Home.
const LAT = -23.0400447;
const LON = -43.5007404;

// Tabela de códigos WMO (retornados pela Open-Meteo) mapeada pras nossas tags
// de clima (chuva/sol/vento/neblina). "Vento" não tem código WMO próprio —
// é inferido à parte, pela velocidade máxima do vento no dia.
function condicoesDoWeathercode(weathercode, ventoKmhMax, precipitacaoMm) {
  const condicoes = new Set();

  if ([45, 48].includes(weathercode)) condicoes.add('neblina');
  if (weathercode >= 51 || precipitacaoMm > 0.5) condicoes.add('chuva');
  if (weathercode <= 3 && !condicoes.has('chuva')) condicoes.add('sol');
  if (ventoKmhMax >= 30) condicoes.add('vento');

  return [...condicoes];
}

function linhaParaRegistro(datas, i, dados) {
  const weathercode = dados.weathercode?.[i] ?? null;
  const ventoKmhMax = dados.windspeed_10m_max?.[i] ?? null;
  const precipitacaoMm = dados.precipitation_sum?.[i] ?? null;
  return {
    data: datas[i],
    temperatura_max: dados.temperature_2m_max?.[i] ?? null,
    temperatura_min: dados.temperature_2m_min?.[i] ?? null,
    precipitacao_mm: precipitacaoMm,
    vento_kmh_max: ventoKmhMax,
    weathercode,
    condicoes: condicoesDoWeathercode(weathercode, ventoKmhMax ?? 0, precipitacaoMm ?? 0),
  };
}

// Busca o clima histórico (gratuito, sem chave) num intervalo de datas [inicio, fim]
// (formato 'YYYY-MM-DD'). Devolve um registro por dia, pronto pra upsert em clima_historico.
export async function buscarClimaHistorico(inicio, fim) {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    start_date: inicio,
    end_date: fim,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode',
    timezone: 'America/Sao_Paulo',
  });
  const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
  const json = await res.json();
  const datas = json.daily?.time || [];

  return datas.map((_, i) => linhaParaRegistro(datas, i, json.daily));
}

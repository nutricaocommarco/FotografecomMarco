// Mirante Ponta da Prainha — mesmas coordenadas usadas no schema LocalBusiness da Home.
const LAT = -23.0400447;
const LON = -43.5007404;

// Fotografia é sempre de manhã (nascer do sol até o treino esvaziar) — usa só
// essa janela em vez do dia inteiro, senão uma chuva de tarde contaminaria um
// dia que amanheceu limpo.
const HORA_INICIO_MANHA = 5;
const HORA_FIM_MANHA = 10;

// Tabela de códigos WMO (retornados pela Open-Meteo) mapeada pras nossas tags
// de clima (chuva/sol/vento/neblina). "Vento" não tem código WMO próprio —
// é inferido à parte, pela velocidade máxima do vento no período.
function condicoesDoWeathercode(weathercode, ventoKmhMax, precipitacaoMm) {
  const condicoes = new Set();

  if ([45, 48].includes(weathercode)) condicoes.add('neblina');
  if (weathercode >= 51 || precipitacaoMm > 0.5) condicoes.add('chuva');
  if (weathercode <= 3 && !condicoes.has('chuva')) condicoes.add('sol');
  if (ventoKmhMax >= 30) condicoes.add('vento');

  return [...condicoes];
}

// Quanto maior, mais "grave"/impactante — usado pra escolher 1 weathercode
// representativo entre as várias horas da manhã (prioriza chuva sobre sol).
function gravidadeDoCodigo(code) {
  if (code >= 95) return 5; // trovoada
  if (code >= 61) return 4; // chuva
  if (code >= 51) return 3; // garoa
  if (code === 45 || code === 48) return 2; // neblina
  return 1; // limpo/nublado
}

// Agrega as horas de `hourly` que caem dentro da janela da manhã de uma data
// específica (o array `horas` já vem em horário local, por causa do
// `timezone` na request). null se não sobrar nenhuma hora nessa janela.
function agregarManha(horas, hourly, dataAlvo) {
  const indices = [];
  for (let i = 0; i < horas.length; i++) {
    if (!horas[i].startsWith(dataAlvo)) continue;
    const hora = Number(horas[i].slice(11, 13));
    if (hora >= HORA_INICIO_MANHA && hora <= HORA_FIM_MANHA) indices.push(i);
  }
  if (indices.length === 0) return null;

  const temps = indices.map((i) => hourly.temperature_2m?.[i]).filter((v) => v != null);
  const precs = indices.map((i) => hourly.precipitation?.[i]).filter((v) => v != null);
  const ventos = indices.map((i) => hourly.windspeed_10m?.[i]).filter((v) => v != null);
  const codigos = indices.map((i) => hourly.weathercode?.[i]).filter((v) => v != null);

  const temperatura_max = temps.length ? Math.max(...temps) : null;
  const temperatura_min = temps.length ? Math.min(...temps) : null;
  const precipitacao_mm = precs.length ? Number(precs.reduce((a, b) => a + b, 0).toFixed(1)) : null;
  const vento_kmh_max = ventos.length ? Math.max(...ventos) : null;
  const weathercode = codigos.length
    ? codigos.reduce((pior, c) => (gravidadeDoCodigo(c) > gravidadeDoCodigo(pior) ? c : pior), codigos[0])
    : null;

  return {
    data: dataAlvo,
    temperatura_max,
    temperatura_min,
    precipitacao_mm,
    vento_kmh_max,
    weathercode,
    condicoes: condicoesDoWeathercode(weathercode, vento_kmh_max ?? 0, precipitacao_mm ?? 0),
  };
}

// Busca o clima histórico (gratuito, sem chave) num intervalo de datas
// [inicio, fim] (formato 'YYYY-MM-DD'), agregado só na janela da manhã
// (5h-10h, horário de Brasília). Devolve um registro por dia, pronto pra
// upsert em clima_historico.
export async function buscarClimaHistorico(inicio, fim) {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    start_date: inicio,
    end_date: fim,
    hourly: 'temperature_2m,precipitation,windspeed_10m,weathercode',
    timezone: 'America/Sao_Paulo',
  });
  const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);
  const json = await res.json();
  const horas = json.hourly?.time || [];

  const datasUnicas = [...new Set(horas.map((h) => h.slice(0, 10)))].sort();
  return datasUnicas.map((d) => agregarManha(horas, json.hourly, d)).filter(Boolean);
}

const MIN_MESES_FECHADOS = 3;
const MIN_MESES_COM_CLIMA_PRO_AJUSTE = 6;

function diasNoMes(anoMes) {
  const [ano, mes] = anoMes.split('-').map(Number);
  return new Date(ano, mes, 0).getDate();
}

// Agrupa os eventos por mês-calendário já totalmente encerrado (mês do
// evento < mês atual). "Fechado" aqui é só sobre o mês em si, não sobre a
// janela de venda de 6 meses — os valores já maduros de meses antigos são o
// que usamos como referência de qualquer forma.
function agruparMesesFechados(eventos, mesAtualStr) {
  const porMes = new Map();
  for (const ev of eventos) {
    const mes = ev.data.slice(0, 7);
    if (mes >= mesAtualStr) continue;
    if (!porMes.has(mes)) porMes.set(mes, []);
    porMes.get(mes).push(ev);
  }
  return porMes;
}

// % acumulado da receita do mês, por dia-do-mês (índice 1..diasNoMes).
function curvaAcumulada(eventosDoMes, dias) {
  const porDia = new Array(dias + 1).fill(0);
  let total = 0;
  for (const ev of eventosDoMes) {
    const dia = Number(ev.data.slice(8, 10));
    const valor = ev.valor_total_vendido || 0;
    porDia[dia] += valor;
    total += valor;
  }
  const curva = new Array(dias + 1).fill(0);
  let acumulado = 0;
  for (let d = 1; d <= dias; d++) {
    acumulado += porDia[d];
    curva[d] = total > 0 ? (acumulado / total) * 100 : 0;
  }
  return { curva, total };
}

// Reduz o peso de um mês histórico cuja precipitação média nos dias de
// evento ficou bem acima da média geral (mês climaticamente atípico não deve
// distorcer a curva média) — nunca aumenta peso de mês com clima melhor.
function fatorClima(eventosDoMes, mediaGeralPrecipitacao) {
  if (mediaGeralPrecipitacao == null || mediaGeralPrecipitacao <= 0) return 1;
  const comClima = eventosDoMes.filter((e) => e.clima_precipitacao_mm != null);
  if (comClima.length === 0) return 1;
  const mediaMes = comClima.reduce((s, e) => s + e.clima_precipitacao_mm, 0) / comClima.length;
  if (mediaMes <= mediaGeralPrecipitacao) return 1;
  const razao = mediaMes / mediaGeralPrecipitacao;
  return Math.max(0.3, 1 / razao);
}

// Previsão de receita do mês em andamento a partir do histórico de meses
// fechados. Recebe `eventos` (relatorio_eventos) e devolve { confiavel: false }
// se não houver histórico suficiente, ou os três cenários (mínimo/médio/máximo)
// junto com as curvas de referência usadas.
export function calcularPrevisao(eventos, hoje = new Date()) {
  const mesAtualStr = hoje.toISOString().slice(0, 10).slice(0, 7);
  const fechados = agruparMesesFechados(eventos, mesAtualStr);

  if (fechados.size < MIN_MESES_FECHADOS) {
    return { confiavel: false, meses_fechados: fechados.size };
  }

  const mesesComClima = [...fechados.values()].filter((evs) => evs.some((e) => e.clima_precipitacao_mm != null)).length;
  const ajusteClimaAtivo = mesesComClima >= MIN_MESES_COM_CLIMA_PRO_AJUSTE;

  let mediaGeralPrecipitacao = null;
  if (ajusteClimaAtivo) {
    const todasComClima = [...fechados.values()].flat().filter((e) => e.clima_precipitacao_mm != null);
    mediaGeralPrecipitacao = todasComClima.reduce((s, e) => s + e.clima_precipitacao_mm, 0) / todasComClima.length;
  }

  const mesAlvoNum = Number(mesAtualStr.slice(5, 7));
  const diasMesAlvo = diasNoMes(`${mesAtualStr}-01`);

  const curvas = [];
  for (const [mes, evs] of fechados) {
    const dias = diasNoMes(`${mes}-01`);
    const { curva, total } = curvaAcumulada(evs, dias);
    if (total <= 0) continue;
    const mesNum = Number(mes.slice(5, 7));
    let peso = mesNum === mesAlvoNum ? 3 : 1;
    if (ajusteClimaAtivo) peso *= fatorClima(evs, mediaGeralPrecipitacao);
    curvas.push({ mes, curva, peso, dias });
  }

  if (curvas.length < MIN_MESES_FECHADOS) {
    return { confiavel: false, meses_fechados: fechados.size };
  }

  const curvaMin = new Array(diasMesAlvo + 1).fill(null);
  const curvaMax = new Array(diasMesAlvo + 1).fill(null);
  const somaPeso = new Array(diasMesAlvo + 1).fill(0);
  const somaPonderada = new Array(diasMesAlvo + 1).fill(0);

  for (let d = 1; d <= diasMesAlvo; d++) {
    for (const { curva, peso, dias } of curvas) {
      const pct = curva[Math.min(d, dias)];
      if (curvaMin[d] == null || pct < curvaMin[d]) curvaMin[d] = pct;
      if (curvaMax[d] == null || pct > curvaMax[d]) curvaMax[d] = pct;
      somaPonderada[d] += pct * peso;
      somaPeso[d] += peso;
    }
  }
  const curvaMedia = somaPonderada.map((s, d) => (d === 0 ? 0 : s / (somaPeso[d] || 1)));

  const eventosMesAtual = eventos.filter((e) => e.data.slice(0, 7) === mesAtualStr);
  const diaHoje = hoje.getDate();
  const receitaRegistrada = eventosMesAtual
    .filter((e) => Number(e.data.slice(8, 10)) <= diaHoje)
    .reduce((s, e) => s + (e.valor_total_vendido || 0), 0);

  // % baixo demais deixa a divisão instável (uma venda de R$20 "viraria"
  // R$4000 de projeção) — melhor não projetar do que projetar um número absurdo.
  function projetar(pct) {
    if (!pct || pct < 1) return null;
    return receitaRegistrada / (pct / 100);
  }

  const idxHoje = Math.min(diaHoje, diasMesAlvo);

  return {
    confiavel: true,
    meses_fechados: fechados.size,
    ajuste_clima_ativo: ajusteClimaAtivo,
    dia_hoje: diaHoje,
    receita_registrada: receitaRegistrada,
    previsao: {
      minimo: projetar(curvaMax[idxHoje]),
      medio: projetar(curvaMedia[idxHoje]),
      maximo: projetar(curvaMin[idxHoje]),
    },
    curvas: { dias: diasMesAlvo, min: curvaMin, media: curvaMedia, max: curvaMax },
  };
}

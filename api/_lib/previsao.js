const MIN_MESES_FECHADOS = 3;
const MIN_MESES_COM_CLIMA_PRO_AJUSTE = 6;

// Feriados nacionais de data fixa (não inclui os móveis — Carnaval, Sexta
// Santa, Corpus Christi — pra não precisar calcular Páscoa; são minoria e o
// principal normalizador aqui já é fim de semana).
const FERIADOS_FIXOS = [
  [1, 1], [4, 21], [5, 1], [9, 7], [10, 12], [11, 2], [11, 15], [11, 20], [12, 25],
];

function diasNoMes(anoMes) {
  const [ano, mes] = anoMes.split('-').map(Number);
  return new Date(ano, mes, 0).getDate();
}

// Conta sábados, domingos e feriados fixos num mês — proxy de "dias
// prováveis de trabalho", já que a receita só vem de fim de semana/feriado.
function contarDiasUteis(anoMes) {
  const [ano, mes] = anoMes.split('-').map(Number);
  const dias = diasNoMes(anoMes);
  let count = 0;
  for (let d = 1; d <= dias; d++) {
    const data = new Date(ano, mes - 1, d);
    const diaSemana = data.getDay();
    const ehFeriado = FERIADOS_FIXOS.some(([m, dd]) => m === mes && dd === d);
    if (diaSemana === 0 || diaSemana === 6 || ehFeriado) count++;
  }
  return count;
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

function media(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

// Previsão de receita do mês em andamento a partir do histórico de meses
// fechados. Recebe `eventos` (relatorio_eventos) e devolve { confiavel: false }
// se não houver histórico suficiente, ou os três cenários (mínimo/médio/máximo).
//
// Combina duas fontes, ponderadas pelo quanto do mês já "deveria" ter
// acontecido em termos de receita (curva média no dia de hoje):
// 1) "Escala": receita já registrada / % típico acumulado até hoje — fica
//    mais confiável conforme o mês avança e mais dado real existe.
// 2) "Linha de base": receita histórica por dia-de-fim-de-semana-ou-feriado
//    (normaliza meses com 4 vs. 5 fins de semana) × dias desse tipo no mês
//    alvo — funciona mesmo no dia 1, com receita registrada zerada, porque
//    não depende de nada ter acontecido ainda no mês atual.
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
  const diasUteisAlvo = contarDiasUteis(mesAtualStr);

  const curvas = [];
  const receitasPorDiaUtil = [];
  for (const [mes, evs] of fechados) {
    const dias = diasNoMes(`${mes}-01`);
    const { curva, total } = curvaAcumulada(evs, dias);
    if (total <= 0) continue;
    const mesNum = Number(mes.slice(5, 7));
    let peso = mesNum === mesAlvoNum ? 3 : 1;
    if (ajusteClimaAtivo) peso *= fatorClima(evs, mediaGeralPrecipitacao);
    curvas.push({ mes, curva, peso, dias });

    const diasUteisMes = contarDiasUteis(mes);
    if (diasUteisMes > 0) receitasPorDiaUtil.push({ valor: total / diasUteisMes, peso });
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

  // Linha de base por dia-útil (fim de semana/feriado): mín/média
  // ponderada/máx entre os meses fechados, escalados pros dias desse tipo
  // que o mês alvo tem.
  const somaPesoRPD = receitasPorDiaUtil.reduce((s, r) => s + r.peso, 0);
  const mediaRPD = somaPesoRPD > 0 ? receitasPorDiaUtil.reduce((s, r) => s + r.valor * r.peso, 0) / somaPesoRPD : 0;
  const minRPD = Math.min(...receitasPorDiaUtil.map((r) => r.valor));
  const maxRPD = Math.max(...receitasPorDiaUtil.map((r) => r.valor));

  const baseline = {
    minimo: minRPD * diasUteisAlvo,
    medio: mediaRPD * diasUteisAlvo,
    maximo: maxRPD * diasUteisAlvo,
  };

  const eventosMesAtual = eventos.filter((e) => e.data.slice(0, 7) === mesAtualStr);
  const diaHoje = hoje.getDate();
  const receitaRegistrada = eventosMesAtual
    .filter((e) => Number(e.data.slice(8, 10)) <= diaHoje)
    .reduce((s, e) => s + (e.valor_total_vendido || 0), 0);

  const idxHoje = Math.min(diaHoje, diasMesAlvo);

  // % baixo demais deixa a divisão por escala instável (uma venda de R$20
  // "viraria" R$4000 de projeção) — abaixo de 1% a gente confia só na linha
  // de base (peso de escala 0 nesse ponto).
  function projetarEscala(pct) {
    if (!pct || pct < 1) return null;
    return receitaRegistrada / (pct / 100);
  }

  const pesoEscala = Math.min(1, Math.max(0, curvaMedia[idxHoje] / 100));

  function combinar(pct, baselineX) {
    const escala = projetarEscala(pct);
    if (escala == null) return baselineX;
    return pesoEscala * escala + (1 - pesoEscala) * baselineX;
  }

  return {
    confiavel: true,
    meses_fechados: fechados.size,
    ajuste_clima_ativo: ajusteClimaAtivo,
    dia_hoje: diaHoje,
    dias_uteis_mes_alvo: diasUteisAlvo,
    receita_registrada: receitaRegistrada,
    previsao: {
      minimo: combinar(curvaMax[idxHoje], baseline.minimo),
      medio: combinar(curvaMedia[idxHoje], baseline.medio),
      maximo: combinar(curvaMin[idxHoje], baseline.maximo),
    },
    curvas: { dias: diasMesAlvo, min: curvaMin, media: curvaMedia, max: curvaMax },
  };
}

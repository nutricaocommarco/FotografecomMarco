// Calcula o snapshot de um mês a partir das linhas (já com cpf_hash) daquele
// mês + o conjunto de hashes já vistos em meses anteriores (pra separar
// comprador novo de recorrente).
export function calcularEstatisticasMes(linhasDoMes, hashesVistosAntes) {
  const totalTransacoes = linhasDoMes.length;
  const valorBrutoTotal = linhasDoMes.reduce((s, l) => s + l.valor_bruto, 0);
  const linhasSemCpfValido = linhasDoMes.filter((l) => !l.cpf_hash).length;

  const contagemPorHash = new Map();
  for (const l of linhasDoMes) {
    if (!l.cpf_hash) continue;
    contagemPorHash.set(l.cpf_hash, (contagemPorHash.get(l.cpf_hash) || 0) + 1);
  }

  const totalCompradoresUnicos = contagemPorHash.size;
  const compradoresComMaisDeUmaCompra = [...contagemPorHash.values()].filter((n) => n > 1).length;
  const compradoresNovos = [...contagemPorHash.keys()].filter((h) => !hashesVistosAntes.has(h)).length;

  const distribuicaoPagamento = {};
  for (const l of linhasDoMes) {
    distribuicaoPagamento[l.meio_pagamento] = (distribuicaoPagamento[l.meio_pagamento] || 0) + 1;
  }

  const distribuicaoFrequencia = {};
  for (const n of contagemPorHash.values()) {
    distribuicaoFrequencia[n] = (distribuicaoFrequencia[n] || 0) + 1;
  }

  return {
    total_transacoes: totalTransacoes,
    total_compradores_unicos: totalCompradoresUnicos,
    valor_bruto_total: valorBrutoTotal,
    ticket_medio: totalTransacoes ? valorBrutoTotal / totalTransacoes : 0,
    taxa_recompra_mes: totalCompradoresUnicos ? (compradoresComMaisDeUmaCompra / totalCompradoresUnicos) * 100 : 0,
    compradores_novos: compradoresNovos,
    compradores_recorrentes: totalCompradoresUnicos - compradoresNovos,
    distribuicao_pagamento: distribuicaoPagamento,
    distribuicao_frequencia: distribuicaoFrequencia,
    linhas_sem_cpf_valido: linhasSemCpfValido,
  };
}

// Mesma lógica de histograma de frequência, mas olhando todas as compras do
// hash ao longo de um ano inteiro (não só dentro de um mês).
export function calcularDistribuicaoFrequenciaAnual(linhasDoAno) {
  const contagemPorHash = new Map();
  for (const l of linhasDoAno) {
    if (!l.cpf_hash) continue;
    contagemPorHash.set(l.cpf_hash, (contagemPorHash.get(l.cpf_hash) || 0) + 1);
  }

  const distribuicao = {};
  for (const n of contagemPorHash.values()) {
    distribuicao[n] = (distribuicao[n] || 0) + 1;
  }
  return distribuicao;
}

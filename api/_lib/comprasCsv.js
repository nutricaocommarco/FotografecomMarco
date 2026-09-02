// Normaliza "Pagarme Credito" / "Pagarme Pix" / "Pagarme Boleto" etc. pro
// rótulo usado nas estatísticas (Pix/Crédito/Boleto/Débito/Outro).
export function normalizarMeioPagamento(bruto) {
  const semPrefixo = (bruto || '').replace(/pagarme/i, '').trim().toLowerCase();
  if (semPrefixo.includes('pix')) return 'Pix';
  if (semPrefixo.includes('credito') || semPrefixo.includes('crédito')) return 'Crédito';
  if (semPrefixo.includes('debito') || semPrefixo.includes('débito')) return 'Débito';
  if (semPrefixo.includes('boleto')) return 'Boleto';
  return bruto?.trim() ? bruto.trim() : 'Outro';
}

// "05514071740" -> "05514071740" (só dígitos, mantém zero à esquerda);
// null se não tiver exatamente 11 dígitos depois de limpar.
export function normalizarCpf(bruto) {
  const digitos = (bruto || '').replace(/\D/g, '');
  return digitos.length === 11 ? digitos : null;
}

// "19.9" -> 19.9. O CSV da Pagar.me já vem com ponto decimal.
export function normalizarValor(bruto) {
  const n = parseFloat(bruto);
  return Number.isFinite(n) ? n : null;
}

// "2026-08-01 15:58:35" -> { dataPagamento: Date, mesReferencia: '2026-08-01' }
export function normalizarDataPagamento(bruto) {
  const d = new Date(bruto.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return { dataPagamento: d.toISOString(), mesReferencia: `${ano}-${mes}-01` };
}

// Transforma as linhas já parseadas do CSV (formato Pagar.me) em linhas prontas
// pra compras_hash, agrupadas por mês. Não faz hash aqui (fica em hash.js,
// que precisa do salt do ambiente) — só normaliza e valida cada linha.
// Linhas sem CPF válido entram no resultado com `cpf: null` — contam nos
// totais de transações/valor do mês, mas ficam de fora das métricas por
// comprador (hash) porque não têm como ser atribuídas a ninguém.
export function prepararLinhasCsv(linhasCsv) {
  const linhas = [];

  for (const linha of linhasCsv) {
    const valor = normalizarValor(linha['Valor Bruto']);
    const dataInfo = normalizarDataPagamento(linha['Data de Pagamento']);
    if (valor == null || !dataInfo) continue; // linha sem os dados mínimos, ignora

    linhas.push({
      cpf: normalizarCpf(linha['CPF']),
      valor_bruto: valor,
      data_pagamento: dataInfo.dataPagamento,
      mes_referencia: dataInfo.mesReferencia,
      meio_pagamento: normalizarMeioPagamento(linha['Meio de Pagamento']),
      codigo_servico: linha['Código do serviço prestado'] || null,
    });
  }

  return linhas;
}

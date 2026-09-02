const MESES_PT = {
  JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, MAIO: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12,
};

// Faz o parsing do relatório de "fotos publicadas" que o Foco Radical exporta
// por evento, ex:
//
// TREINO PRAINHA 01-AGO-2026 @fotografecommarco
// 01 AGO 2026TreinoRio De Janeiro / RJ
// 2.147
// Disponível até 01/02/2027
//
// (às vezes com uma segunda linha numérica, menor, entre o total e o
// "Disponível até" — interpretada como fotos já vendidas daquele evento)
export function parseRelatorioFotosPublicadas(texto) {
  if (!texto?.trim()) return [];

  const blocos = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const eventos = [];
  for (const bloco of blocos) {
    const dataMatch = bloco.match(/(\d{2})[\s-](JAN|FEV|MAR|ABR|MAIO?|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[\s-](\d{4})/i);
    if (!dataMatch) continue;

    const dia = dataMatch[1].padStart(2, '0');
    const mes = String(MESES_PT[dataMatch[2].toUpperCase()]).padStart(2, '0');
    const ano = dataMatch[3];
    const data = `${ano}-${mes}-${dia}`;

    const numeros = bloco
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[\d.]+$/.test(l));

    const fotosEnviadas = numeros[0] ? parseInt(numeros[0].replace(/\./g, ''), 10) : null;
    const fotosVendidas = numeros[1] ? parseInt(numeros[1].replace(/\./g, ''), 10) : null;

    eventos.push({ data, fotos_enviadas: fotosEnviadas, fotos_vendidas_total: fotosVendidas });
  }

  // O relatório vem com os eventos mais recentes primeiro, em blocos que se
  // repetem por mês — normaliza pra ordem cronológica crescente.
  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}

const CATEGORIAS_VENDAS = [
  { chave: 'premium', prefixo: 'premium' },
  { chave: 'alta', prefixo: 'alta' },
  { chave: 'media', prefixo: 'média' },
  { chave: 'baixa', prefixo: 'baixa' },
  { chave: 'video', prefixo: 'vídeo' },
];

function parseValorReal(str) {
  const limpo = (str || '').replace(/R\$\s*/i, '').trim();
  const semMilhar = limpo.replace(/\./g, '');
  const n = parseFloat(semMilhar.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// Faz o parsing do relatório de vendas por categoria do Foco Radical, ex:
//
// 277384 - Treino NA PRAINHA 30-AGO-2026 @fotografecommarco
// Premium 4500 Pixels	23	R$ 453,72	R$ 0,00	Sim
// Alta 3450 Pixels	9	R$ 152,10	R$ 0,00	Não
// Baixa 1500 Pixels	9	R$ 125,10	R$ 0,00	Não
// Média 2700 Pixels	7	R$ 101,02	R$ 0,00	Sim
//
// (colunas: Tipo de Imagem, Total de Fotos, Valor Bruto, Desconto de pacote,
// Cupom utilizado? — separadas por tab)
export function parseRelatorioVendasPorCategoria(texto) {
  if (!texto?.trim()) return [];

  const blocos = texto
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const eventos = [];
  for (const bloco of blocos) {
    const linhas = bloco.split('\n').map((l) => l.trim());
    const dataMatch = linhas[0]?.match(/(\d{2})[\s-](JAN|FEV|MAR|ABR|MAIO?|JUN|JUL|AGO|SET|OUT|NOV|DEZ)[\s-](\d{4})/i);
    if (!dataMatch) continue;

    const dia = dataMatch[1].padStart(2, '0');
    const mes = String(MESES_PT[dataMatch[2].toUpperCase()]).padStart(2, '0');
    const ano = dataMatch[3];
    const data = `${ano}-${mes}-${dia}`;

    // Guarda toda linha reconhecível (qtd + valor), mesmo que a categoria não
    // seja uma das conhecidas — assim um tipo de produto novo (ex: um pacote
    // diferente que o Foco Radical passe a oferecer) nunca some do total,
    // só fica de fora da quebra por categoria até eu adicionar um mapeamento pra ele.
    const linhasReconhecidas = [];
    for (const linha of linhas.slice(1)) {
      const partes = linha.split(/\t+/).length > 1 ? linha.split(/\t+/) : linha.split(/ {2,}/);
      if (partes.length < 3) continue;
      const [nomeCategoria, qtdStr, valorStr] = partes;
      linhasReconhecidas.push({ nomeCategoria, qtd: parseInt(qtdStr, 10) || 0, valor: parseValorReal(valorStr) });
    }
    if (linhasReconhecidas.length === 0) continue;

    const vendas = {};
    for (const l of linhasReconhecidas) {
      const categoria = CATEGORIAS_VENDAS.find((c) => l.nomeCategoria.toLowerCase().startsWith(c.prefixo));
      if (categoria) vendas[categoria.chave] = { qtd: l.qtd, valor: l.valor };
    }

    const fotosVendidasTotal = linhasReconhecidas.reduce((s, l) => s + l.qtd, 0);
    const valorTotalVendido = linhasReconhecidas.reduce((s, l) => s + l.valor, 0);

    eventos.push({ data, vendas, fotos_vendidas_total: fotosVendidasTotal, valor_total_vendido: valorTotalVendido });
  }

  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}

// Faz o parsing do relatório-resumo por evento do Foco Radical (uma linha por
// evento, valor já LÍQUIDO — descontadas taxas da plataforma/maquininha,
// cupons etc.), ex:
//
// 277384 - Treino NA PRAINHA 30-AGO-2026 @fotografecommarco	30/08/2026	R$ 737,30	R$ 737,30	48
//
// (colunas: título, data, valor bruto?, valor líquido, fotos vendidas —
// separadas por tab; usamos a data da 2ª coluna, que já vem em DD/MM/AAAA)
//
// Relatórios mais antigos (2024) às vezes têm DUAS linhas pra mesma data —
// "Reconhecimento Facial" e "Galerias" separados, ou dois eventos no mesmo
// dia em locais diferentes — nesses casos soma tudo na mesma data, já que
// relatorio_eventos guarda um total por dia, não por evento individual.
export function parseRelatorioResumoEventos(texto) {
  if (!texto?.trim()) return [];

  const porData = new Map();
  for (const linhaBruta of texto.split('\n')) {
    const linha = linhaBruta.trim();
    if (!linha) continue;

    const partes = linha.split(/\t+/).length > 1 ? linha.split(/\t+/) : linha.split(/ {2,}/);
    if (partes.length < 4) continue;

    const dataMatch = partes[1]?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dataMatch) continue;
    const [, dia, mes, ano] = dataMatch;
    const data = `${ano}-${mes}-${dia}`;

    const valorLiquido = parseValorReal(partes[partes.length - 2]);
    const fotosVendidas = parseInt(partes[partes.length - 1], 10);
    if (!Number.isFinite(valorLiquido) || !Number.isFinite(fotosVendidas)) continue;

    const atual = porData.get(data) || { data, valor_total_vendido: 0, fotos_vendidas_total: 0 };
    atual.valor_total_vendido += valorLiquido;
    atual.fotos_vendidas_total += fotosVendidas;
    porData.set(data, atual);
  }

  return [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));
}

// Faz o parsing da página "Informações do evento" do Foco Radical (colada em
// bloco, um evento após o outro), ex:
//
// TREINO NA PRAINHA 30-AGO-2026 @fotografecommarco
// ...
// Lançamento do evento: 30/08/2026 18:00
// Upload de Fotos
// Fotos processadas: 1915
// Rostos identificados: 2289
//
// (não depende de linhas em branco entre blocos — cada evento novo começa
// numa linha de título contendo "@fotografecommarco")
export function parseRelatorioInformacoesEvento(texto) {
  if (!texto?.trim()) return [];

  const blocos = [];
  let atual = [];
  for (const linha of texto.split('\n')) {
    if (linha.includes('@fotografecommarco')) {
      if (atual.length) blocos.push(atual.join('\n'));
      atual = [linha];
    } else {
      atual.push(linha);
    }
  }
  if (atual.length) blocos.push(atual.join('\n'));

  const eventos = [];
  for (const bloco of blocos) {
    const dataMatch = bloco.match(/Lançamento do evento:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
    if (!dataMatch) continue;
    const [, dia, mes, ano] = dataMatch;
    const data = `${ano}-${mes}-${dia}`;

    const fotosMatch = bloco.match(/Fotos processadas:\s*([\d.]+)/i);
    const rostosMatch = bloco.match(/Rostos identificados:\s*([\d.]+)/i);

    eventos.push({
      data,
      fotos_enviadas: fotosMatch ? parseInt(fotosMatch[1].replace(/\./g, ''), 10) : null,
      rostos_reconhecidos: rostosMatch ? parseInt(rostosMatch[1].replace(/\./g, ''), 10) : null,
    });
  }

  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}

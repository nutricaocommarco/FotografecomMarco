// Parser de CSV simples que respeita campos entre aspas (inclusive vírgulas
// e quebras de linha dentro das aspas, e aspas duplicadas "" como escape) —
// o relatório da Pagar.me tem um campo ("Código do serviço prestado") com
// vírgulas dentro do próprio texto, então split(',') não serve.
export function parseCsv(texto) {
  const linhas = [];
  let campo = '';
  let linhaAtual = [];
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeAspas = true;
    } else if (c === ',') {
      linhaAtual.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linhaAtual.push(campo);
      campo = '';
      if (linhaAtual.some((v) => v !== '')) linhas.push(linhaAtual);
      linhaAtual = [];
    } else {
      campo += c;
    }
  }

  if (campo !== '' || linhaAtual.length > 0) {
    linhaAtual.push(campo);
    if (linhaAtual.some((v) => v !== '')) linhas.push(linhaAtual);
  }

  if (linhas.length === 0) return [];

  const cabecalho = linhas[0].map((h) => h.trim());
  return linhas.slice(1).map((linha) => {
    const obj = {};
    cabecalho.forEach((h, idx) => {
      obj[h] = (linha[idx] ?? '').trim();
    });
    return obj;
  });
}

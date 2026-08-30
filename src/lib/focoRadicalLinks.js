const LOJA = '1439';
const CIDADE = 'rio-de-janeiro';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// dataEvento: 'YYYY-MM-DD', local: ex. "treino-prainha"
export function buildEventSlug(dataEvento, local = 'treino-prainha') {
  const [ano, mes, dia] = dataEvento.split('-');
  const aaaammdd = `${ano}${mes}${dia}`;
  const mesAbrev = MESES[parseInt(mes, 10) - 1];
  const localSlug = slugify(local);
  return `${aaaammdd}-${localSlug}-${dia}-${mesAbrev}-${ano}-fotografecommarco-${CIDADE}-${LOJA}`;
}

export function buildLinkPrincipal(dataEvento, local = 'treino-prainha') {
  const slug = buildEventSlug(dataEvento, local);
  return `https://maj.focoradical.com.br/evento/${slug}?loja=${LOJA}`;
}

export function buildLinkGaleria(dataEvento, local = 'treino-prainha', codigoGaleria) {
  const slug = buildEventSlug(dataEvento, local);
  return `https://maj.focoradical.com.br/evento/${slug}/resultado-de-busca?pesquisa_por=galeria&galeria=${codigoGaleria}`;
}

// Faz o parsing do bloco colado do Excel, no formato:
// Nome: Rockrider
// Código: rockrider
// Nº de fotos: 0
// (repetido várias vezes)
export function parseGaleriasColadas(texto) {
  if (!texto?.trim()) return [];

  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const galerias = [];
  let atual = {};

  for (const linha of linhas) {
    const nomeMatch = linha.match(/^Nome:\s*(.+)$/i);
    const codigoMatch = linha.match(/^C[oó]digo:\s*(.+)$/i);
    const fotosMatch = linha.match(/^N[ºo°]?\s*de\s*fotos:\s*(\d+)/i);

    if (nomeMatch) {
      // Uma nova ocorrência de "Nome:" fecha o grupo anterior, se completo
      if (atual.nome && atual.codigo !== undefined) {
        galerias.push(atual);
      }
      atual = { nome: nomeMatch[1].trim() };
    } else if (codigoMatch) {
      atual.codigo = codigoMatch[1].trim();
    } else if (fotosMatch) {
      atual.numFotos = parseInt(fotosMatch[1], 10);
    }
  }

  if (atual.nome && atual.codigo !== undefined) {
    galerias.push(atual);
  }

  return galerias;
}

// Gera os links prontos a partir das galerias já parseadas + dados do evento.
export function gerarLinksGalerias(galerias, dataEvento, local = 'treino-prainha') {
  return galerias.map((g) => ({
    nome: g.nome,
    codigo: g.codigo,
    numFotos: g.numFotos ?? null,
    link: buildLinkGaleria(dataEvento, local, g.codigo),
  }));
}

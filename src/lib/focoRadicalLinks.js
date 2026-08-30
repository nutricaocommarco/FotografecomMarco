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
  const base = `https://maj.focoradical.com.br/evento/${slug}/resultado-de-busca`;

  // "Todas as Fotos" não é uma galeria como as outras: não usa o parâmetro &galeria=.
  if (codigoGaleria?.toLowerCase() === 'todas') {
    return `${base}?pesquisa_por=todas`;
  }

  return `${base}?pesquisa_por=galeria&galeria=${codigoGaleria}`;
}

// A Foco Radical mantém as fotos no ar por 6 meses a partir do evento.
// new Date() já lida sozinho com a virada de mês (ex: 29-ago + 6 meses = 29-fev,
// que não existe em ano não bissexto, e vira automaticamente 01-mar).
export function calcularDataSaidaDoAr(dataEvento) {
  if (!dataEvento) return '';
  const [ano, mes, dia] = dataEvento.split('-').map(Number);
  const d = new Date(ano, mes - 1 + 6, dia);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Formato do PC:
// Nome: Rockrider
// Código: rockrider
// Nº de fotos: 0
// (repetido várias vezes)
function parseFormatoRotulado(linhas) {
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

// Formato do celular: trincas de linhas soltas, sem rótulo:
// Corrida
// corrida
// 0
// (repetido várias vezes)
function parseFormatoTrincas(linhas) {
  if (linhas.length === 0 || linhas.length % 3 !== 0) return [];

  const galerias = [];
  for (let i = 0; i < linhas.length; i += 3) {
    const [nome, codigo, numFotosStr] = [linhas[i], linhas[i + 1], linhas[i + 2]];
    if (!/^\d+$/.test(numFotosStr)) return []; // não bate o padrão esperado, desiste desse formato
    galerias.push({ nome, codigo, numFotos: parseInt(numFotosStr, 10) });
  }
  return galerias;
}

// Faz o parsing do bloco colado do Excel/app, tentando os dois formatos conhecidos
// (o do PC, com rótulos "Nome:"/"Código:", e o do celular, em trincas de linhas soltas).
export function parseGaleriasColadas(texto) {
  if (!texto?.trim()) return [];

  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const rotulado = parseFormatoRotulado(linhas);
  if (rotulado.length > 0) return rotulado;

  return parseFormatoTrincas(linhas);
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

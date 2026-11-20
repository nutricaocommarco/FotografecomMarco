const LOJA = '1439';
const CIDADE = 'rio-de-janeiro';

// Categorias que sempre aparecem como botão solto no card de cobertura; as
// demais galerias vão pro menu "Bikes", a não ser que tenham a marca `solta`
// (marcada no admin — pra galerias avulsas, tipo grupos de treino).
// 'majtrotezindecria' ficou da primeira galeria avulsa, antes da marca existir.
export const CODIGOS_CATEGORIA = [
  'ni',
  'nao-identificados',
  'corrida',
  'caminhada',
  'corrida-caminhada',
  'motos',
  'carros',
  'carro',
  'pet',
  'surf',
  'todas',
  'majtrotezindecria',
];

export function ehCategoriaFixa(codigo) {
  return CODIGOS_CATEGORIA.includes(codigo?.toLowerCase());
}

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

// O endereço do evento na Foco Radical é montado a partir do NOME que o Marco
// digita lá: o padrão é "TREINO PRAINHA DD-MMM-AAAA @fotografecommarco", que
// vira "-fotografecommarco-" no slug. Em 18/10/2026 o nome foi digitado sem o
// "@fotografecommarco", então só esse evento não tem essa parte — se acontecer
// de novo, basta incluir a data aqui (o evento dá 404 se o slug não bater).
const EVENTOS_SEM_MARCA_NO_NOME = ['2026-10-18'];

// O ?loja= do link principal tanto faz (maj e 1439 funcionam nos dois tipos de
// evento). Eventos novos usam maj, que é o que a Foco passou a gerar.
const LOJA_MAJ_A_PARTIR_DE = '2026-10-13';

// dataEvento: 'YYYY-MM-DD', local: ex. "treino-prainha"
export function buildEventSlug(dataEvento, local = 'treino-prainha') {
  const [ano, mes, dia] = dataEvento.split('-');
  const aaaammdd = `${ano}${mes}${dia}`;
  const mesAbrev = MESES[parseInt(mes, 10) - 1];
  const localSlug = slugify(local);
  const marca = EVENTOS_SEM_MARCA_NO_NOME.includes(dataEvento) ? '' : 'fotografecommarco-';
  return `${aaaammdd}-${localSlug}-${dia}-${mesAbrev}-${ano}-${marca}${CIDADE}-${LOJA}`;
}

export function buildLinkPrincipal(dataEvento, local = 'treino-prainha') {
  const slug = buildEventSlug(dataEvento, local);
  const loja = dataEvento >= LOJA_MAJ_A_PARTIR_DE ? 'maj' : LOJA;
  return `https://maj.focoradical.com.br/evento/${slug}?loja=${loja}`;
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

// Formato da interface nova da Foco (nov/2026): nome e código na mesma linha,
// separados por tab (ou 2+ espaços, caso o tab vire espaço ao colar), e a
// contagem na linha seguinte:
// Corrida<TAB>corrida
// 957
// (repetido várias vezes)
function parseFormatoParesComTab(linhas) {
  if (linhas.length === 0 || linhas.length % 2 !== 0) return [];

  const galerias = [];
  for (let i = 0; i < linhas.length; i += 2) {
    const partes = linhas[i].split(/\t+|\s{2,}/).map((p) => p.trim()).filter(Boolean);
    const numFotosStr = linhas[i + 1];
    if (partes.length !== 2 || !/^\d+$/.test(numFotosStr)) return []; // não bate o padrão, desiste desse formato
    galerias.push({ nome: partes[0], codigo: partes[1], numFotos: parseInt(numFotosStr, 10) });
  }
  return galerias;
}

// Faz o parsing do bloco colado do Excel/app, tentando os formatos conhecidos
// (o do PC, com rótulos "Nome:"/"Código:", o do celular, em trincas de linhas
// soltas, e o da interface nova, em pares "nome<TAB>código" + contagem).
export function parseGaleriasColadas(texto) {
  if (!texto?.trim()) return [];

  const linhas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const rotulado = parseFormatoRotulado(linhas);
  if (rotulado.length > 0) return rotulado;

  const trincas = parseFormatoTrincas(linhas);
  if (trincas.length > 0) return trincas;

  return parseFormatoParesComTab(linhas);
}

// Gera os links prontos a partir das galerias já parseadas + dados do evento.
export function gerarLinksGalerias(galerias, dataEvento, local = 'treino-prainha') {
  return galerias.map((g) => ({
    nome: g.nome,
    codigo: g.codigo,
    numFotos: g.numFotos ?? null,
    link: buildLinkGaleria(dataEvento, local, g.codigo),
    ...(g.solta ? { solta: true } : {}),
  }));
}

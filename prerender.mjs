import fs from 'fs';
import path from 'path';

const { posts } = await import('./src/data/posts.js');
const { postsContent } = await import('./src/data/postsContent.js');

const SITE = 'https://www.fotografecommarco.com';
const FALLBACK_IMAGE = 'https://raw.githubusercontent.com/nutricaocommarco/FotografecomMarco/main/public/marca-dagua.png';

// Usa o otimizador de imagens do WordPress.com pras fotos que ainda estão lá hospedadas.
function ogImageFrom(url) {
  if (!url) return FALLBACK_IMAGE;
  const clean = url.replace(/^https?:\/\//i, '');
  return `https://i0.wp.com/${clean}?w=1200&strip=all&quality=85`;
}

const rotasEstaticas = [
  { path: '', title: 'Fotografe com Marco | Fotografia Esportiva no Rio de Janeiro', desc: 'Cobertura fotográfica de treinos e eventos esportivos no Rio de Janeiro. Encontre e compre suas fotos de bike, corrida e muito mais.', image: FALLBACK_IMAGE },
  { path: 'sobre', title: 'Sobre | Fotografe com Marco', desc: 'Conheça a história de Marco Aurélio, fotógrafo esportivo no Rio de Janeiro.', image: FALLBACK_IMAGE },
  { path: 'coberturas', title: 'Coberturas | Fotografe com Marco', desc: 'Acesse as coberturas fotográficas e escolha sua foto. Você será redirecionado à Foco Radical, onde vendemos as imagens.', image: FALLBACK_IMAGE },
  { path: 'blog', title: 'Blog | Fotografe com Marco', desc: 'Dicas de fotografia e de ciclismo pra quem treina e pra quem fotografa.', image: FALLBACK_IMAGE },
  { path: 'contato', title: 'Contato | Fotografe com Marco', desc: 'Fale com o Marco: dúvidas sobre fotos, coberturas ou parcerias.', image: FALLBACK_IMAGE },
];

const rotasDoBlog = posts.map((post) => {
  const content = postsContent[post.slug] || {};
  return {
    path: post.slug,
    title: `${post.title} | Fotografe com Marco`,
    desc: content.metaDescription || post.title,
    image: ogImageFrom(content.coverImage),
    date: post.date,
    isBlog: true,
  };
});

const routes = [...rotasEstaticas, ...rotasDoBlog];
const distPath = path.resolve('dist');
const baseTemplate = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

console.log('Gerando tags de SEO por rota...');

routes.forEach((route) => {
  const safePath = route.path;
  const urlAbsoluta = safePath ? `${SITE}/${safePath}` : `${SITE}/`;

  const targetFile = safePath ? path.join(distPath, `${safePath}.html`) : path.join(distPath, 'index.html');
  const fileContent = fs.existsSync(targetFile) ? fs.readFileSync(targetFile, 'utf-8') : baseTemplate;

  const schema = {
    '@context': 'https://schema.org',
    '@type': route.isBlog ? 'BlogPosting' : 'WebPage',
    headline: route.title,
    image: route.image,
    author: {
      '@type': 'Person',
      name: 'Marco Aurélio Neves Júnior',
      jobTitle: 'Fotógrafo Esportivo',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Fotografe com Marco',
      logo: { '@type': 'ImageObject', url: FALLBACK_IMAGE },
    },
    description: route.desc,
    ...(route.date && { datePublished: `${route.date}T08:00:00-03:00` }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
      ...(route.isBlog ? [{ '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` }] : []),
      { '@type': 'ListItem', position: route.isBlog ? 3 : 2, name: route.title, item: urlAbsoluta },
    ],
  };

  const cleanHtml = fileContent
    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta(?=[^>]*name=['"]description['"])[^>]*>/gi, '')
    .replace(/<meta(?=[^>]*property=['"]og:[^'"]+['"])[^>]*>/gi, '')
    .replace(/<link(?=[^>]*rel=['"]canonical['"])[^>]*>/gi, '')
    .replace(/<meta(?=[^>]*name=['"]twitter:[^'"]+['"])[^>]*>/gi, '');

  const tags = `
    <title>${route.title}</title>
    <meta name="description" content="${route.desc}" />
    <link rel="canonical" href="${urlAbsoluta}" />

    <meta property="og:type" content="${route.isBlog ? 'article' : 'website'}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.desc}" />
    <meta property="og:image" content="${route.image}" />
    <meta property="og:url" content="${urlAbsoluta}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${route.title}" />
    <meta name="twitter:description" content="${route.desc}" />
    <meta name="twitter:image" content="${route.image}" />

    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  `;

  const html = cleanHtml.replace('</head>', `${tags}</head>`);

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, html);
  console.log(`  [${safePath || '/'}] OK`);
});

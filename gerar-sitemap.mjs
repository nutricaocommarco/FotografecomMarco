import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = 'https://www.fotografecommarco.com';

const { posts } = await import('./src/data/posts.js');

const rotasEstaticas = ['/', '/sobre', '/coberturas', '/blog', '/contato', '/nascer-do-sol-na-prainha'];

const urls = [
  ...rotasEstaticas.map((rota) => ({ loc: `${SITE}${rota}`, changefreq: rota === '/coberturas' ? 'daily' : 'monthly' })),
  ...posts.map((p) => ({ loc: `${SITE}/${p.slug}`, changefreq: 'yearly', lastmod: p.date })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, 'dist', 'sitemap.xml'), xml.trim());
console.log(`sitemap.xml gerado com ${urls.length} URLs.`);

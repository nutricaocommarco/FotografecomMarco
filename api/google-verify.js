// Serve o arquivo de verificação do Google Search Console.
// Fica fora da pasta public/ e é servido por rewrite pra não sofrer o redirect
// automático de "URLs limpas" (que tira o .html de qualquer arquivo estático).
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send('google-site-verification: google983e810c74ca5e42.html');
}

import { createSessionCookie, clearSessionCookie, isAuthenticated } from './_lib/auth.js';

// Login/logout/sessão num arquivo só — o plano Hobby da Vercel tem um limite
// de 12 Serverless Functions por deploy, e esse projeto já estava perto do
// limite antes do sistema de relatórios; três endpoints minúsculos e sempre
// usados juntos não precisam ser três functions separadas.
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAuthenticated(req) });
  }

  if (req.method === 'POST') {
    const { password } = req.body || {};
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) return res.status(500).json({ error: 'Senha de admin não configurada no servidor' });
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Senha incorreta' });

    res.setHeader('Set-Cookie', createSessionCookie());
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

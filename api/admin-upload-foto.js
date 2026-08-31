import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

const BUCKET = 'coberturas-fotos';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { fileBase64, fileName, contentType } = req.body || {};
  if (!fileBase64 || !fileName) return res.status(400).json({ error: 'Arquivo ausente' });

  const supabase = getSupabaseAdmin();
  const ext = fileName.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(fileBase64, 'base64');

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || 'image/jpeg',
    upsert: false,
    // Nome do arquivo é único (timestamp + aleatório), então pode cachear "pra sempre"
    // sem risco de servir conteúdo desatualizado.
    cacheControl: '31536000',
  });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return res.status(200).json({ url: data.publicUrl, path });
}

import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

const BUCKET = 'coberturas-fotos';

function pathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null; // não é uma foto hospedada no nosso bucket (ex: URL externa antiga)
  return url.slice(idx + marker.length);
}

async function apagarFotoDoStorage(supabase, fotoCapaUrl) {
  const path = pathFromPublicUrl(fotoCapaUrl);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// Toda cobertura cuja "data_saida_do_ar" já passou tem a foto removida do Storage
// (a cobertura em si continua no banco pro histórico do admin, só a imagem some).
async function limparFotosExpiradas(supabase) {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: expiradas } = await supabase
    .from('coberturas')
    .select('id, foto_capa')
    .lt('data_saida_do_ar', hoje)
    .not('foto_capa', 'is', null);

  for (const cobertura of expiradas || []) {
    await apagarFotoDoStorage(supabase, cobertura.foto_capa);
    await supabase.from('coberturas').update({ foto_capa: null }).eq('id', cobertura.id);
  }
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    await limparFotosExpiradas(supabase);
    const { data, error } = await supabase.from('coberturas').select('*').order('data_evento', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { data, error } = await supabase.from('coberturas').insert(body).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });

    if (updates.foto_capa !== undefined) {
      const { data: atual } = await supabase.from('coberturas').select('foto_capa').eq('id', id).single();
      if (atual?.foto_capa && atual.foto_capa !== updates.foto_capa) {
        await apagarFotoDoStorage(supabase, atual.foto_capa);
      }
    }

    const { data, error } = await supabase.from('coberturas').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });

    const { data: atual } = await supabase.from('coberturas').select('foto_capa').eq('id', id).single();
    if (atual?.foto_capa) await apagarFotoDoStorage(supabase, atual.foto_capa);

    const { error } = await supabase.from('coberturas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

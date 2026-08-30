import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

// Gerencia os avisos "Em Breve" e permite consultar/arquivar os e-mails cadastrados em cada um.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data: avisos, error } = await supabase.from('avisos_em_breve').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });

    const { data: inscricoes } = await supabase.from('inscricoes_em_breve').select('*');
    const comInscricoes = avisos.map((a) => ({
      ...a,
      inscricoes: (inscricoes || []).filter((i) => i.aviso_id === a.id),
    }));

    return res.status(200).json(comInscricoes);
  }

  if (req.method === 'POST') {
    const { data, error } = await supabase.from('avisos_em_breve').insert(req.body || {}).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, marcarPublicado, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });

    if (marcarPublicado) {
      // Ao publicar: desativa o aviso e arquiva (apaga) a lista de e-mails daquele evento.
      await supabase.from('inscricoes_em_breve').delete().eq('aviso_id', id);
      updates.ativo = false;
    }

    const { data, error } = await supabase.from('avisos_em_breve').update(updates).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id é obrigatório' });
    await supabase.from('inscricoes_em_breve').delete().eq('aviso_id', id);
    const { error } = await supabase.from('avisos_em_breve').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { buscarClimaHistorico } from './_lib/climaOpenMeteo.js';

// GET ?data=YYYY-MM-DD — olha o cache em clima_historico, senão busca na
// Open-Meteo, salva e devolve. Usado pro formulário de evento autopreencher
// o clima quando o campo não foi definido manualmente.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const { data } = req.query;
  if (!data) return res.status(400).json({ error: 'data é obrigatória' });

  const supabase = getSupabaseAdmin();

  const { data: existente } = await supabase.from('clima_historico').select('*').eq('data', data).maybeSingle();
  if (existente) return res.status(200).json(existente);

  try {
    const [registro] = await buscarClimaHistorico(data, data);
    if (!registro) return res.status(404).json({ error: 'Sem dados de clima pra essa data' });

    const { data: salvo, error } = await supabase
      .from('clima_historico')
      .upsert(registro, { onConflict: 'data' })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(salvo);
  } catch (err) {
    return res.status(502).json({ error: `Falha ao buscar clima: ${err.message}` });
  }
}

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';

// Só faz uma consulta bem leve pra manter o banco do Supabase "acordado"
// (no plano grátis ele hiberna depois de um tempo sem uso e demora pra reagir
// na primeira consulta seguinte). Chamado por um cron externo a cada poucos minutos.
export default async function handler(req, res) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('coberturas').select('id').limit(1);
    return res.status(200).json({ ok: true, ts: Date.now() });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
}

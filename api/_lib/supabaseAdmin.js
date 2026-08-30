import { createClient } from '@supabase/supabase-js';

// Usa a service_role key — só roda no servidor (Vercel Function), nunca no navegador.
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase (service role) não configurado');
  return createClient(url, serviceKey);
}

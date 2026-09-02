import { requireAuth } from './_lib/auth.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { calcularDistribuicaoFrequenciaAnual } from './_lib/comprasStats.js';

const PAGINA = 1000;

async function buscarLinhasDoAno(supabase, ano) {
  const linhas = [];
  let inicio = 0;
  while (true) {
    const { data, error } = await supabase
      .from('compras_hash')
      .select('cpf_hash')
      .gte('mes_referencia', `${ano}-01-01`)
      .lte('mes_referencia', `${ano}-12-31`)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw new Error(error.message);
    linhas.push(...data);
    if (data.length < PAGINA) break;
    inicio += PAGINA;
  }
  return linhas;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });

  const supabase = getSupabaseAdmin();
  const { mes, ano } = req.query;

  if (ano) {
    try {
      const linhas = await buscarLinhasDoAno(supabase, ano);
      return res.status(200).json({ ano, distribuicao_frequencia: calcularDistribuicaoFrequenciaAnual(linhas) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (mes) {
    const { data, error } = await supabase.from('importacoes_compradores').select('*').eq('mes_referencia', `${mes}-01`).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || null);
  }

  const { data, error } = await supabase
    .from('importacoes_compradores')
    .select('*')
    .order('mes_referencia', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
}

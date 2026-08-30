import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import CoberturaCard from '../components/CoberturaCard';
import EmBreveBox from '../components/EmBreveBox';
import ProgressBar from '../components/ProgressBar';

export default function Coberturas() {
  const [coberturas, setCoberturas] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (!supabaseConfigured) {
        setLoading(false);
        return;
      }

      const hoje = new Date().toISOString().slice(0, 10);

      const [coberturasRes, avisoRes, metaRes] = await Promise.all([
        supabase
          .from('coberturas')
          .select('*')
          .lte('data_evento', hoje)
          .or(`data_saida_do_ar.is.null,data_saida_do_ar.gte.${hoje}`)
          .order('data_evento', { ascending: false }),
        supabase.from('avisos_em_breve').select('*').eq('ativo', true).order('created_at', { ascending: false }).limit(1),
        supabase.from('metas_progresso').select('*').eq('ativo', true).order('created_at', { ascending: false }).limit(1),
      ]);

      if (cancelado) return;

      if (!coberturasRes.error) setCoberturas(coberturasRes.data || []);
      if (!avisoRes.error) setAviso(avisoRes.data?.[0] || null);
      if (!metaRes.error) setMeta(metaRes.data?.[0] || null);
      setLoading(false);
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Coberturas | Fotografe com Marco</title>
        <meta
          name="description"
          content="Acesse as coberturas fotográficas e escolha sua foto. Você será redirecionado à Foco Radical, onde vendemos as imagens."
        />
      </Helmet>

      <section className="py-24 container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic mb-4">Coberturas</h1>
        <div className="w-20 h-2 bg-red-700 rounded-full mb-6"></div>
        <p className="text-slate-600 font-medium max-w-2xl mb-2">
          Acesse as coberturas fotográficas e escolha sua foto! Você será redirecionado ao site da Foco Radical, onde
          vendemos nossas imagens.
        </p>
        <p className="text-slate-500 text-sm mb-12">
          Não achou sua foto?{' '}
          <a href="/contato" className="text-red-700 underline">
            Fale comigo
          </a>{' '}
          que te ajudo.
        </p>

        {meta && (
          <ProgressBar titulo={meta.titulo} descricao={meta.descricao} percentual={meta.percentual} prazo={meta.prazo} link={meta.link} linkLabel={meta.link_label} />
        )}

        {aviso && <EmBreveBox aviso={aviso} />}

        {!supabaseConfigured && (
          <p className="text-slate-400 italic text-sm mb-8">
            (Coberturas serão carregadas assim que o Supabase estiver configurado.)
          </p>
        )}

        {loading ? (
          <p className="text-slate-400">Carregando coberturas...</p>
        ) : coberturas.length === 0 ? (
          <p className="text-slate-400">Nenhuma cobertura ativa no momento. Volte em breve!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {coberturas.map((c) => (
              <CoberturaCard key={c.id} cobertura={c} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

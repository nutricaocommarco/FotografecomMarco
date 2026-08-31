import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import { Archive } from 'lucide-react';
import CoberturaCard from '../components/CoberturaCard';
import EmBreveBox from '../components/EmBreveBox';
import ProgressBar from '../components/ProgressBar';

const VALIDADE_CARD_FOTOS_ANTIGAS = '2026-12-30';
const TAMANHO_PAGINA = 9;

function SkeletonBloco({ altura }) {
  return (
    <div
      className="w-full max-w-2xl mx-auto my-10 bg-slate-100 rounded-[2rem] animate-pulse"
      style={{ height: altura }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-100 rounded-full w-3/4 mx-auto animate-pulse" />
        <div className="h-4 bg-slate-100 rounded-full w-1/2 mx-auto animate-pulse" />
        <div className="h-9 bg-slate-100 rounded-full w-2/3 mx-auto animate-pulse" />
      </div>
    </div>
  );
}

function CardFotosAntigas() {
  const hoje = new Date().toISOString().slice(0, 10);
  if (hoje > VALIDADE_CARD_FOTOS_ANTIGAS) return null;

  return (
    <a
      href="https://fotografecommarco.wordpress.com/coberturas/"
      target="_blank"
      rel="noreferrer"
      className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center p-8 aspect-[4/3] sm:aspect-auto"
    >
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <Archive className="text-red-700" size={28} />
      </div>
      <h2 className="text-lg font-black text-slate-900 uppercase italic mb-2">Fotos mais antigas</h2>
      <p className="text-sm text-slate-600">Procure suas fotos de coberturas anteriores no nosso site antigo.</p>
    </a>
  );
}

// Monta a consulta de uma página de coberturas ativas (mais recentes primeiro).
function consultaCoberturas(pagina) {
  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = pagina * TAMANHO_PAGINA;
  return supabase
    .from('coberturas')
    .select('*')
    .lte('data_evento', hoje)
    .or(`data_saida_do_ar.is.null,data_saida_do_ar.gte.${hoje}`)
    .order('data_evento', { ascending: false })
    .range(inicio, inicio + TAMANHO_PAGINA - 1);
}

export default function Coberturas() {
  const [coberturas, setCoberturas] = useState([]);
  const [loadingCoberturas, setLoadingCoberturas] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const [aviso, setAviso] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const [filtroData, setFiltroData] = useState('');
  const [resultadoFiltro, setResultadoFiltro] = useState(null); // null = sem filtro ativo
  const [buscandoData, setBuscandoData] = useState(false);

  // Coberturas busca sozinha, sem esperar a barra de progresso/aviso — é a
  // parte mais importante da página (e a mais pesada, com fotos), então não
  // faz sentido atrasar ela por causa de coisas menores. E vem paginada: com
  // eventos ficando ativos por 6 meses, a lista pode crescer bastante, então
  // só carrega a primeira leva de cara (igual feed do Instagram).
  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (!supabaseConfigured) {
        setLoadingCoberturas(false);
        return;
      }
      const { data, error } = await consultaCoberturas(0);

      if (cancelado) return;
      if (!error) {
        setCoberturas(data || []);
        setTemMais((data?.length || 0) === TAMANHO_PAGINA);
      }
      setLoadingCoberturas(false);
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleBuscarData(e) {
    e.preventDefault();
    if (!filtroData || !supabaseConfigured) return;
    setBuscandoData(true);
    const { data, error } = await supabase.from('coberturas').select('*').eq('data_evento', filtroData).order('created_at', { ascending: false });
    setResultadoFiltro(error ? [] : data || []);
    setBuscandoData(false);
  }

  function limparFiltroData() {
    setFiltroData('');
    setResultadoFiltro(null);
  }

  async function handleCarregarMais() {
    setCarregandoMais(true);
    const proximaPagina = pagina + 1;
    const { data, error } = await consultaCoberturas(proximaPagina);
    if (!error) {
      setCoberturas((atual) => [...atual, ...(data || [])]);
      setPagina(proximaPagina);
      setTemMais((data?.length || 0) === TAMANHO_PAGINA);
    }
    setCarregandoMais(false);
  }

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      if (!supabaseConfigured) {
        setLoadingExtra(false);
        return;
      }
      const [avisoRes, metaRes] = await Promise.all([
        supabase.from('avisos_em_breve').select('*').eq('ativo', true).order('created_at', { ascending: false }).limit(1),
        supabase.from('metas_progresso').select('*').eq('ativo', true).order('created_at', { ascending: false }).limit(1),
      ]);

      if (cancelado) return;
      if (!avisoRes.error) setAviso(avisoRes.data?.[0] || null);
      if (!metaRes.error) setMeta(metaRes.data?.[0] || null);
      setLoadingExtra(false);
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

        {loadingExtra ? (
          <SkeletonBloco altura={350} />
        ) : (
          <>
            {meta && (
              <ProgressBar titulo={meta.titulo} descricao={meta.descricao} percentual={meta.percentual} prazo={meta.prazo} link={meta.link} linkLabel={meta.link_label} />
            )}
            {aviso && <EmBreveBox aviso={aviso} />}
          </>
        )}

        <form onSubmit={handleBuscarData} className="flex items-center gap-2 mb-12 text-sm">
          <label htmlFor="busca-data" className="text-slate-400">
            Buscar por data:
          </label>
          <input
            id="busca-data"
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-sm"
          />
          <button type="submit" className="text-slate-500 underline hover:text-red-700">
            buscar
          </button>
          {resultadoFiltro !== null && (
            <button type="button" onClick={limparFiltroData} className="text-slate-400 underline hover:text-red-700">
              limpar
            </button>
          )}
        </form>

        {!supabaseConfigured && (
          <p className="text-slate-400 italic text-sm mb-8">
            (Coberturas serão carregadas assim que o Supabase estiver configurado.)
          </p>
        )}

        {buscandoData ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : resultadoFiltro !== null ? (
          resultadoFiltro.length === 0 ? (
            <p className="text-slate-400">Nenhuma cobertura encontrada nessa data.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {resultadoFiltro.map((c) => (
                <CoberturaCard key={c.id} cobertura={c} />
              ))}
            </div>
          )
        ) : loadingCoberturas ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: TAMANHO_PAGINA }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : coberturas.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <CardFotosAntigas />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {coberturas.map((c, i) => (
                <CoberturaCard key={c.id} cobertura={c} prioridade={i === 0} />
              ))}
              {!temMais && <CardFotosAntigas />}
            </div>

            {temMais && (
              <div className="text-center mt-12">
                <button
                  onClick={handleCarregarMais}
                  disabled={carregandoMais}
                  className="bg-white border border-red-200 text-red-700 px-8 py-3 rounded-full font-black uppercase text-sm hover:bg-red-50 transition-all disabled:opacity-60"
                >
                  {carregandoMais ? 'Carregando...' : 'Carregar mais coberturas'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

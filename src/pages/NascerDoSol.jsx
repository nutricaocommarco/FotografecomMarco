import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fotosNascerDoSol } from '../data/nascerDoSol';

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function formatarData(data) {
  if (!data) return null;
  const [ano, mes, dia] = data.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

export default function NascerDoSol() {
  const [indiceAberto, setIndiceAberto] = useState(null);

  const fotoAtual = indiceAberto !== null ? fotosNascerDoSol[indiceAberto] : null;

  function abrirAnterior() {
    setIndiceAberto((i) => (i > 0 ? i - 1 : fotosNascerDoSol.length - 1));
  }
  function abrirProxima() {
    setIndiceAberto((i) => (i < fotosNascerDoSol.length - 1 ? i + 1 : 0));
  }

  return (
    <>
      <Helmet>
        <title>Nascer do Sol na Prainha — Fotos Grátis para Baixar | Fotografe com Marco</title>
        <meta
          name="description"
          content="Acervo de fotos do nascer do sol na Prainha (Recreio dos Bandeirantes, RJ), registradas ao longo dos anos. Veja e baixe gratuitamente em boa resolução."
        />
      </Helmet>

      <section className="py-24 container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic mb-4">Nascer do Sol na Prainha</h1>
        <div className="w-20 h-2 bg-red-700 rounded-full mb-6"></div>
        <p className="text-slate-600 font-medium max-w-2xl mb-3">
          A Prainha, no Recreio dos Bandeirantes, tem um dos nascer do sol mais bonitos do Rio de Janeiro — e ao longo
          dos anos fotografando os treinos por lá, fui guardando os melhores registros do amanhecer. Reuni aqui o
          acervo, organizado por data. Todas as fotos estão disponíveis pra você ver e baixar gratuitamente, em boa
          resolução.
        </p>
        <p className="text-slate-500 text-sm mb-12">
          Procurando fotos do seu treino na Prainha?{' '}
          <a href="/coberturas" className="text-red-700 underline">
            Veja as Coberturas
          </a>
          .
        </p>

        <div className="bg-slate-50 rounded-[2rem] p-6 md:p-10 mb-16 grid md:grid-cols-2 gap-8 items-center">
          <img
            src="/prainha-historica-1972.jpg"
            alt="Foto histórica da Prainha em fevereiro de 1972, com a estrada ainda de barro"
            className="w-full rounded-2xl shadow-lg object-cover"
            loading="lazy"
          />
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-3">A Prainha ao Longo do Tempo</h2>
            <p className="text-slate-600 font-medium leading-relaxed mb-3">
              Essa é a Prainha em fevereiro de 1972 — quando a estrada de acesso ainda era de barro e a praia estava
              quase intocada. Um baita contraste com o point movimentado de hoje em dia, mas a beleza natural
              continua a mesma.
            </p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Foto: Halley R. Oliveira, fev/1972</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {fotosNascerDoSol.map((foto, i) => (
            <button
              key={foto.slug}
              type="button"
              onClick={() => setIndiceAberto(i)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 group"
            >
              <img
                src={`/nascer-do-sol/thumbs/${foto.slug}.jpg`}
                alt={foto.data ? `Nascer do sol na Prainha em ${formatarData(foto.data)}` : 'Nascer do sol na Prainha'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {foto.data && (
                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
                  {formatarData(foto.data)}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {fotoAtual &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setIndiceAberto(null)}>
            <button
              type="button"
              onClick={() => setIndiceAberto(null)}
              aria-label="Fechar"
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X size={32} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                abrirAnterior();
              }}
              aria-label="Foto anterior"
              className="absolute left-2 sm:left-6 text-white/70 hover:text-white p-2"
            >
              <ChevronLeft size={36} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                abrirProxima();
              }}
              aria-label="Próxima foto"
              className="absolute right-2 sm:right-6 text-white/70 hover:text-white p-2"
            >
              <ChevronRight size={36} />
            </button>

            <div className="max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={`/nascer-do-sol/full/${fotoAtual.slug}.jpg`}
                alt={fotoAtual.data ? `Nascer do sol na Prainha em ${formatarData(fotoAtual.data)}` : 'Nascer do sol na Prainha'}
                className="max-h-[75vh] w-auto rounded-2xl shadow-2xl object-contain"
              />
              <div className="flex items-center gap-4 mt-6">
                {fotoAtual.data && <span className="text-white/80 text-sm font-bold uppercase tracking-widest">{formatarData(fotoAtual.data)}</span>}
                <a
                  href={`/nascer-do-sol/full/${fotoAtual.slug}.jpg`}
                  download
                  className="inline-flex items-center gap-2 bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wide hover:bg-red-800 transition-all"
                >
                  <Download size={16} /> Baixar foto
                </a>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

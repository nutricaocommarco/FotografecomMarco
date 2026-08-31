import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Categorias conhecidas que ficam soltas; qualquer outro código é tratado como marca de bike
// e agrupado no menu "Bikes".
const CODIGOS_CATEGORIA = ['ni', 'nao-identificados', 'corrida', 'caminhada', 'corrida-caminhada', 'motos', 'carros', 'carro', 'pet', 'surf', 'todas'];

function formatarDataBadge(dataEvento) {
  if (!dataEvento) return null;
  const [ano, mes, dia] = dataEvento.split('-').map(Number);
  return { dia, mes: MESES_ABREV[mes - 1] };
}

function formatarDataExtenso(dataEvento) {
  if (!dataEvento) return '';
  const [ano, mes, dia] = dataEvento.split('-').map(Number);
  return `${dia} de ${MESES_ABREV[mes - 1]} de ${ano}`;
}

function PillLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-bold uppercase tracking-wide text-red-700 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-all"
    >
      {children}
    </a>
  );
}

export default function CoberturaCard({ cobertura, prioridade = false }) {
  const { nome, data_evento, foto_capa, link_principal, galerias, obs } = cobertura;
  const badge = formatarDataBadge(data_evento);
  const [bikesAbertas, setBikesAbertas] = useState(false);

  const categorias = (galerias || []).filter((g) => CODIGOS_CATEGORIA.includes(g.codigo?.toLowerCase()));
  const bikes = (galerias || [])
    .filter((g) => !CODIGOS_CATEGORIA.includes(g.codigo?.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
      <a href={link_principal} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-t-[2rem] bg-slate-100">
        {foto_capa && (
          <img
            src={foto_capa}
            alt={nome}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading={prioridade ? 'eager' : 'lazy'}
            fetchpriority={prioridade ? 'high' : 'auto'}
          />
        )}
        {badge && (
          <div className="absolute top-3 left-3 bg-white rounded-2xl shadow-lg px-3 py-1.5 text-center leading-none">
            <div className="text-xl font-black text-red-700">{badge.dia}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{badge.mes}</div>
          </div>
        )}
      </a>
      <div className="p-5 text-center">
        <h3 className="text-lg font-black text-slate-900 uppercase italic mb-1">{nome}</h3>
        <p className="text-sm font-black uppercase tracking-widest text-red-700 mb-3">{formatarDataExtenso(data_evento)}</p>
        {obs && <p className="text-sm text-slate-600 italic mb-3">{obs}</p>}

        <a
          href={link_principal}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wide hover:bg-red-800 transition-all mb-2"
        >
          Reconhecimento Facial
        </a>

        {categorias.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {categorias.map((g) => (
              <PillLink key={g.codigo} href={g.link}>
                {g.nome}
              </PillLink>
            ))}
          </div>
        )}

        {bikes.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setBikesAbertas(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-red-700 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-all mt-2"
            >
              Bikes
              <ChevronDown size={14} />
            </button>

            {bikesAbertas &&
              createPortal(
                <div
                  className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                  onClick={() => setBikesAbertas(false)}
                >
                  <div
                    className="bg-white rounded-[2rem] p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="font-black uppercase italic text-slate-900 text-lg">Bikes</h4>
                      <button
                        type="button"
                        onClick={() => setBikesAbertas(false)}
                        aria-label="Fechar"
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X size={22} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {bikes.map((g) => (
                        <PillLink key={g.codigo} href={g.link}>
                          {g.nome}
                        </PillLink>
                      ))}
                    </div>
                  </div>
                </div>,
                document.body,
              )}
          </>
        )}
      </div>
    </div>
  );
}

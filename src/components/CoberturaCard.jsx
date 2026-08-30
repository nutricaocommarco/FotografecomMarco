import React from 'react';

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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

export default function CoberturaCard({ cobertura }) {
  const { nome, data_evento, foto_capa, link_principal, galerias, obs } = cobertura;
  const badge = formatarDataBadge(data_evento);

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
      <a href={link_principal} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        {foto_capa && (
          <img src={foto_capa} alt={nome} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
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

        {galerias?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {galerias.map((g) => (
              <a
                key={g.codigo}
                href={g.link}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold uppercase tracking-wide text-red-700 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-all"
              >
                {g.nome}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

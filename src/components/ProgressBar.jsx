import React from 'react';

export default function ProgressBar({ titulo, percentual, prazo, link, linkLabel }) {
  if (percentual == null) return null;
  const pct = Math.max(0, Math.min(100, percentual));

  return (
    <div className="w-full max-w-3xl mx-auto my-10 p-6 md:p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-left">
      <p className="font-black text-slate-800 mb-1 leading-snug">{titulo}</p>
      {prazo && <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-4">Prazo: {prazo}</p>}
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-700 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-black text-slate-700">{pct}%</span>
        {link && (
          <a href={link} target="_blank" rel="noreferrer" className="text-sm font-bold text-red-700 hover:text-red-800 underline">
            {linkLabel || 'Saiba mais'}
          </a>
        )}
      </div>
    </div>
  );
}

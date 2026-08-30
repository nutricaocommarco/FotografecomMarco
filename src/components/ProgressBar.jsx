import React from 'react';

export default function ProgressBar({ titulo, percentual, prazo, link, linkLabel }) {
  if (percentual == null) return null;
  const pct = Math.max(0, Math.min(100, percentual));

  return (
    <div className="w-full max-w-2xl mx-auto my-10 p-8 md:p-10 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-center">
      {prazo && (
        <span className="inline-block bg-red-50 text-red-700 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          Prazo: {prazo}
        </span>
      )}
      <p className="font-black text-slate-800 text-lg leading-snug mb-6 max-w-xl mx-auto">{titulo}</p>

      <div className="text-5xl font-black text-red-700 mb-4">{pct}%</div>

      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-red-700 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-red-700 text-white px-6 py-3 rounded-full text-sm font-black uppercase tracking-wide hover:bg-red-800 transition-all"
        >
          {linkLabel || 'Saiba mais'}
        </a>
      )}
    </div>
  );
}

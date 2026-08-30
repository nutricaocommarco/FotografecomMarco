import React, { useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';

export default function EmBreveBox({ aviso }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error

  if (!aviso) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    try {
      if (supabaseConfigured) {
        const { error } = await supabase.from('inscricoes_em_breve').insert({
          aviso_id: aviso.id,
          email,
        });
        if (error) throw error;
      }
      await fetch('/api/em-breve-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, aviso_id: aviso.id, evento: aviso.evento }),
      }).catch(() => {});
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-10 p-6 md:p-8 bg-red-50 border border-red-200 rounded-[2rem] text-left">
      <p className="font-black text-red-800 uppercase text-sm tracking-wide mb-2">Em breve fotos no ar!</p>
      <p className="text-slate-800 font-bold mb-1">
        {aviso.evento} — previsão {aviso.previsao_horario}
      </p>
      {aviso.obs && <p className="text-slate-600 text-sm italic mb-4">{aviso.obs}</p>}
      {status === 'done' ? (
        <p className="text-green-700 font-bold text-sm">Prontinho! Você será avisado assim que as fotos entrarem no ar.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            type="email"
            required
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-red-800 transition-all disabled:opacity-60"
          >
            {status === 'sending' ? 'Enviando...' : 'Me avise'}
          </button>
        </form>
      )}
      {status === 'error' && <p className="text-red-600 text-sm mt-2">Não deu pra cadastrar agora, tenta de novo em instantes.</p>}
    </div>
  );
}

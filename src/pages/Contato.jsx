import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import LocationMap from '../components/LocationMap';

// Formspree: mesmo serviço já usado hoje pra receber as mensagens do site.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwlkpgwe';

export default function Contato() {
  const [status, setStatus] = useState('idle');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    const form = e.target;
    const data = new FormData(form);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('done');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <Helmet>
        <title>Contato | Fotografe com Marco</title>
        <meta name="description" content="Fale com o Marco: dúvidas sobre fotos, coberturas ou parcerias." />
      </Helmet>

      <section className="py-24 container mx-auto px-6 max-w-xl">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic mb-4">Contato</h1>
        <div className="w-20 h-2 bg-red-700 rounded-full mb-8"></div>
        <p className="text-slate-600 font-medium mb-10">Não achou sua foto ou tem alguma dúvida? Me manda uma mensagem.</p>

        {status === 'done' ? (
          <p className="text-green-700 font-bold text-lg">Mensagem enviada! Te respondo em breve.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="text"
              name="nome"
              required
              placeholder="Seu nome"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <input
              type="email"
              name="email"
              required
              placeholder="Seu e-mail"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <textarea
              name="mensagem"
              required
              rows={5}
              placeholder="Sua mensagem"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-red-700 text-white px-8 py-4 rounded-2xl font-black uppercase hover:bg-red-800 transition-all disabled:opacity-60 w-fit"
            >
              {status === 'sending' ? 'Enviando...' : 'Enviar'}
            </button>
            {status === 'error' && <p className="text-red-600 text-sm">Não deu pra enviar agora, tenta de novo em instantes.</p>}
          </form>
        )}

        <div className="mt-16">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
            Onde fotografo — Mirante Ponta da Prainha
          </h2>
          <LocationMap />
        </div>
      </section>
    </>
  );
}

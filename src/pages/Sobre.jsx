import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Sobre() {
  return (
    <>
      <Helmet>
        <title>Sobre | Fotografe com Marco</title>
        <meta name="description" content="Conheça a história de Marco Aurélio, fotógrafo esportivo no Rio de Janeiro." />
      </Helmet>

      <section className="py-24 container mx-auto px-6 max-w-3xl">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic mb-8">Sobre Mim</h1>
        <div className="w-20 h-2 bg-red-700 rounded-full mb-8"></div>
        <p className="text-lg text-slate-600 leading-relaxed font-medium mb-6">
          Sou o Marco, fotógrafo esportivo apaixonado por capturar o esforço e a alegria de quem treina na Prainha e em
          outros pontos do Rio de Janeiro. Toda semana estou lá com a câmera, registrando ciclistas, corredores e
          caminhantes em ação.
        </p>
        <p className="text-lg text-slate-600 leading-relaxed font-medium">
          As fotos são disponibilizadas na Foco Radical, onde você encontra a sua por reconhecimento facial ou navegando
          pelas galerias de cada treino.
        </p>
      </section>
    </>
  );
}

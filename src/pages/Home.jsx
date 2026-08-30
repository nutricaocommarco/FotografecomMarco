import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Camera, Image } from 'lucide-react';
import YouTubeLazy from '../components/YouTubeLazy';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Fotografe com Marco | Fotografia Esportiva no Rio de Janeiro</title>
        <meta
          name="description"
          content="Cobertura fotográfica de treinos e eventos esportivos no Rio de Janeiro. Encontre e compre suas fotos de bike, corrida e muito mais."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: 'Fotografe com Marco',
            image: 'https://raw.githubusercontent.com/marcoaurelioneves/fotografecommarco-site/main/public/logo.svg',
            '@id': 'https://www.fotografecommarco.com/',
            url: 'https://www.fotografecommarco.com/',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Rio de Janeiro',
              addressRegion: 'RJ',
              addressCountry: 'BR',
            },
            description: 'Fotógrafo esportivo especializado em coberturas de treinos de bike, corrida e caminhada no Rio de Janeiro.',
          })}
        </script>
      </Helmet>

      <header className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-b from-red-50 to-white text-center md:text-left">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 z-10">
              <span className="inline-block bg-white text-red-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 shadow-sm border border-red-200">
                Fotografia Esportiva • Rio de Janeiro
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-8 text-slate-900 italic uppercase leading-tight">
                FOTOGRAFE COM <span className="text-red-700">MARCO</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-xl font-medium leading-relaxed mx-auto md:mx-0">
                Encontre suas fotos aqui! Cobertura fotográfica de treinos e eventos esportivos, com galerias por reconhecimento facial e por categoria.
              </p>
              <Link
                to="/coberturas"
                className="bg-red-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-red-800 transition-all shadow-xl group mx-auto md:mx-0 w-fit"
              >
                Ver Coberturas <ChevronRight size={20} />
              </Link>
            </div>
            <div className="flex-1 relative mt-10 md:mt-0">
              <div className="w-full aspect-square max-w-sm mx-auto bg-white p-6 rounded-[2.5rem] rotate-2 shadow-2xl border border-slate-100 flex items-center justify-center">
                <img src="/logo.svg" alt="Fotografe com Marco" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-24 bg-white container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            to="/coberturas"
            className="p-8 bg-slate-50 rounded-[2.5rem] border border-red-50 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start"
          >
            <div className="w-14 h-14 bg-red-700 rounded-2xl flex items-center justify-center mb-5">
              <Image className="text-white" size={26} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Coberturas</h3>
            <p className="text-slate-600 font-medium">
              Ache sua foto por reconhecimento facial ou por galeria (bike, corrida, moto e mais).
            </p>
          </Link>

          <Link
            to="/sobre"
            className="p-8 bg-slate-50 rounded-[2.5rem] border border-red-50 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-start"
          >
            <div className="w-14 h-14 bg-red-700 rounded-2xl flex items-center justify-center mb-5">
              <Camera className="text-white" size={26} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2">Sobre Mim</h3>
            <p className="text-slate-600 font-medium">Conheça um pouco da minha história com a fotografia esportiva.</p>
          </Link>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-3xl font-black text-slate-900 uppercase italic mb-3">Conheça o Local</h2>
          <div className="w-16 h-1.5 bg-red-700 rounded-full mx-auto mb-8"></div>
          <div className="aspect-video rounded-[2rem] overflow-hidden shadow-xl">
            <YouTubeLazy videoId="sqgrJxPEqxw" title="Conheça o local das coberturas — Fotografe com Marco" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <div className="container mx-auto px-6">
          <p className="text-slate-500 font-bold uppercase text-sm tracking-widest">
            Também sou estudante de Nutrição — conheça o{' '}
            <a href="https://www.nutricaocommarco.com.br" target="_blank" rel="noreferrer" className="text-red-700 hover:text-red-800 underline">
              Nutrição com Marco
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

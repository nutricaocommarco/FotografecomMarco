import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getPostBySlug } from '../data/posts';
import { postsContent } from '../data/postsContent';
import MarkdownLite from '../components/MarkdownLite';
import LocationMap from '../components/LocationMap';

// new Date('2026-08-31') é interpretado como UTC meia-noite, o que faz a data
// aparecer um dia antes em fusos atrás do UTC (como o do Brasil). Construir a
// partir dos componentes numéricos usa o fuso local e evita esse problema.
function formatarDataLocal(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Post() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  const content = postsContent[slug];

  return (
    <>
      <Helmet>
        <title>{post.title} | Fotografe com Marco</title>
        <meta name="description" content={content?.metaDescription || post.title} />
      </Helmet>

      <article className="py-24 container mx-auto px-6 max-w-3xl">
        <Link to="/blog" className="text-sm font-bold text-red-700 uppercase tracking-widest">
          ← Blog
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic mt-4 mb-4">{post.title}</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          {formatarDataLocal(post.date)}
        </p>

        {content?.coverImage && (
          <img src={content.coverImage} alt={post.title} className="w-full rounded-[2rem] mb-10 object-cover" />
        )}

        {content?.bodyMarkdown ? (
          <MarkdownLite markdown={content.bodyMarkdown} />
        ) : (
          <p className="text-slate-500 italic">Conteúdo em migração — volta já.</p>
        )}

        {slug === 'fotografo-na-prainha' && (
          <div className="mt-4">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic mt-10 mb-4">Onde me encontrar na Prainha</h2>
            <p className="mb-6 font-medium">
              Costumo fotografar próximo ao <strong>Mirante Ponta da Prainha</strong>, no trecho conhecido como Treino
              Prainha. Veja a localização exata abaixo ou{' '}
              <a
                href="https://www.google.com/maps/place/Mirante+Ponta+da+Prainha/@-23.039076,-43.5010569,17.79z/data=!4m6!3m5!1s0x9be9002d26a49b:0x7d245498b21a320!8m2!3d-23.0400447!4d-43.5007404!16s%2Fg%2F11z127xnhf"
                target="_blank"
                rel="noreferrer"
                className="text-red-700 underline hover:text-red-800"
              >
                abra no Google Maps
              </a>
              .
            </p>
            <LocationMap />
          </div>
        )}
      </article>
    </>
  );
}

import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getPostBySlug } from '../data/posts';
import { postsContent } from '../data/postsContent';
import MarkdownLite from '../components/MarkdownLite';

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
          {new Date(post.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {content?.coverImage && (
          <img src={content.coverImage} alt={post.title} className="w-full rounded-[2rem] mb-10 object-cover" />
        )}

        {content?.bodyMarkdown ? (
          <MarkdownLite markdown={content.bodyMarkdown} />
        ) : (
          <p className="text-slate-500 italic">Conteúdo em migração — volta já.</p>
        )}
      </article>
    </>
  );
}

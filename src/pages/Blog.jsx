import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { posts } from '../data/posts';
import { postsContent } from '../data/postsContent';

export default function Blog() {
  const ordenados = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <Helmet>
        <title>Blog | Fotografe com Marco</title>
        <meta name="description" content="Dicas de fotografia e de ciclismo pra quem treina e pra quem fotografa." />
      </Helmet>

      <section className="py-24 container mx-auto px-6 max-w-5xl">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic mb-4">Blog</h1>
        <div className="w-20 h-2 bg-red-700 rounded-full mb-12"></div>

        <div className="grid md:grid-cols-2 gap-8">
          {ordenados.map((post) => {
            const content = postsContent[post.slug];
            return (
              <Link
                key={post.slug}
                to={`/${post.slug}`}
                className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
              >
                {content?.coverImage && (
                  <div className="aspect-video bg-slate-100 overflow-hidden">
                    <img src={content.coverImage} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-6">
                  <span className="text-xs font-black uppercase tracking-widest text-red-700">{post.category}</span>
                  <h2 className="text-lg font-black text-slate-900 mt-2 mb-2 leading-snug">{post.title}</h2>
                  {content?.metaDescription && <p className="text-sm text-slate-600 font-medium">{content.metaDescription}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

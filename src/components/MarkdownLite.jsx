import React from 'react';
import { Link } from 'react-router-dom';

// Converte **negrito** e [texto](link) dentro de uma linha em nós React.
// Links internos (começando com "/") navegam na mesma aba via React Router;
// links externos abrem em nova aba.
function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) return <strong key={i}>{boldMatch[1]}</strong>;

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, texto, href] = linkMatch;
      if (href.startsWith('/')) {
        return (
          <Link key={i} to={href} className="text-red-700 underline hover:text-red-800">
            {texto}
          </Link>
        );
      }
      return (
        <a key={i} href={href} target="_blank" rel="noreferrer" className="text-red-700 underline hover:text-red-800">
          {texto}
        </a>
      );
    }

    return part;
  });
}

// Renderizador leve pro corpo dos posts migrados (evita puxar uma lib de markdown
// inteira só pra parágrafo/lista/título/negrito/link simples).
export default function MarkdownLite({ markdown }) {
  if (!markdown) return null;

  const blocks = markdown.split(/\n\s*\n/);

  return (
    <div className="max-w-none text-slate-700 leading-relaxed">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];
          if (level <= 2) {
            return (
              <h2 key={i} className="text-2xl font-black text-slate-900 uppercase italic mt-10 mb-4">
                {text}
              </h2>
            );
          }
          return (
            <h3 key={i} className="text-xl font-black text-slate-900 mt-8 mb-3">
              {text}
            </h3>
          );
        }

        const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
          return <img key={i} src={imageMatch[2]} alt={imageMatch[1]} className="w-full rounded-[2rem] my-8 object-cover" loading="lazy" />;
        }

        if (trimmed.split('\n').every((line) => line.trim().startsWith('- '))) {
          const items = trimmed.split('\n').map((line) => line.replace(/^-\s+/, ''));
          return (
            <ul key={i} className="list-disc pl-6 mb-6 space-y-1">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="mb-6 font-medium">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

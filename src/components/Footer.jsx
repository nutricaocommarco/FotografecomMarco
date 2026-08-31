import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-20 text-center mt-auto">
      <div className="container mx-auto px-6 text-center">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
          <img src="/logo.svg" alt="Logo" className="w-12 h-12 object-contain group-hover:rotate-6 transition-transform" />
          <span className="text-xl font-black uppercase italic tracking-tighter text-white">Fotografe com Marco</span>
        </Link>

        <div className="flex justify-center gap-8 mb-16">
          <a
            href="https://instagram.com/fotografecommarco"
            target="_blank"
            rel="noreferrer"
            className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all duration-300 border border-white/10 text-white"
            aria-label="Acessar o perfil do Instagram de Fotografe com Marco"
          >
            <Instagram size={24} />
          </a>
          <a
            href="mailto:fotografe.com.marco.a@gmail.com"
            className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all duration-300 border border-white/10 text-white"
            aria-label="Enviar um e-mail de contato"
          >
            <Mail size={24} />
          </a>
        </div>

        <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">
          Conheça também o{' '}
          <a href="https://www.nutricaocommarco.com.br" target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300">
            Nutrição com Marco
          </a>
        </p>
        <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">© {new Date().getFullYear()} Fotografe com Marco • Rio de Janeiro</p>
      </div>
    </footer>
  );
}

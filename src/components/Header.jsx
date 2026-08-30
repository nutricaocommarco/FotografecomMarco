import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    setIsMenuOpen(false);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const links = [
    { to: '/', label: 'Início' },
    { to: '/sobre', label: 'Sobre' },
    { to: '/coberturas', label: 'Coberturas' },
    { to: '/blog', label: 'Blog' },
    { to: '/contato', label: 'Contato' },
  ];

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled || location.pathname !== '/' ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center relative">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.svg" alt="Logo Fotografe com Marco" className="w-11 h-11 group-hover:rotate-6 transition-transform object-contain" />
          <span className="text-xl font-black tracking-tight text-slate-900 uppercase ml-1">FOTOGRAFE COM <span className="text-red-700">MARCO</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`py-1 border-b-2 transition-all ${isActive(link.to) ? 'text-red-700 border-red-600' : 'text-slate-800 border-transparent hover:text-red-700'}`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://instagram.com/fotografecommarco"
            target="_blank"
            rel="noreferrer"
            className="bg-red-700 text-white px-6 py-2.5 rounded-full hover:bg-red-800 transition-all shadow-md italic"
          >
            Instagram
          </a>
        </div>

        <button
          className="md:hidden text-slate-800 p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-red-100 shadow-xl py-6 px-6 flex flex-col gap-5">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsMenuOpen(false)}
              className="text-lg font-black uppercase tracking-widest pb-2 border-b text-slate-800"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://instagram.com/fotografecommarco"
            target="_blank"
            rel="noreferrer"
            className="bg-red-700 text-white px-6 py-3 rounded-full text-center text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Instagram size={18} /> Instagram
          </a>
        </div>
      )}
    </nav>
  );
}

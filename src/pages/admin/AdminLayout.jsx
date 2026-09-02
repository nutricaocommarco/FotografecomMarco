import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import Login from './Login';

const LINKS = [
  { to: '/admin/coberturas', label: 'Coberturas' },
  { to: '/admin/em-breve', label: 'Em Breve' },
  { to: '/admin/progresso', label: 'Progresso' },
  { to: '/admin/relatorios', label: 'Relatórios' },
  { to: '/admin/compradores', label: 'Compradores' },
  { to: '/admin/dashboard', label: 'Dashboard' },
];

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(null); // null = checando
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    adminApi
      .session()
      .then((r) => setAuthenticated(r.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

  // Fecha o menu mobile sempre que a rota muda (ex: depois de clicar num link).
  useEffect(() => setMenuAberto(false), [location.pathname]);

  if (authenticated === null) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Carregando...</div>;
  }

  if (!authenticated) {
    return <Login onAuthenticated={() => setAuthenticated(true)} />;
  }

  async function handleLogout() {
    await adminApi.logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            className="sm:hidden text-white"
          >
            {menuAberto ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="hidden sm:flex items-center gap-6 text-sm font-bold uppercase tracking-widest">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-red-400">
                {l.label}
              </Link>
            ))}
          </div>

          <span className="sm:hidden font-black uppercase italic text-sm">Admin</span>

          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
          >
            Sair
          </button>
          <span className="sm:hidden w-[22px]" />
        </div>

        {menuAberto && (
          <div className="sm:hidden flex flex-col gap-4 mt-5 pb-1 text-sm font-bold uppercase tracking-widest">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-red-400">
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="text-left text-slate-400 hover:text-white">
              Sair
            </button>
          </div>
        )}
      </nav>
      <div className="p-6 md:p-10">
        <Outlet />
      </div>
    </div>
  );
}

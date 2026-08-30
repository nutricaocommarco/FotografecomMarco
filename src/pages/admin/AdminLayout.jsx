import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import Login from './Login';

export default function AdminLayout() {
  const [authenticated, setAuthenticated] = useState(null); // null = checando
  const navigate = useNavigate();

  useEffect(() => {
    adminApi
      .session()
      .then((r) => setAuthenticated(r.authenticated))
      .catch(() => setAuthenticated(false));
  }, []);

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
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest">
          <Link to="/admin/coberturas" className="hover:text-red-400">
            Coberturas
          </Link>
          <Link to="/admin/em-breve" className="hover:text-red-400">
            Em Breve
          </Link>
          <Link to="/admin/progresso" className="hover:text-red-400">
            Progresso
          </Link>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white">
          Sair
        </button>
      </nav>
      <div className="p-6 md:p-10">
        <Outlet />
      </div>
    </div>
  );
}

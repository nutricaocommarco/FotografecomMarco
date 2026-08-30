import React, { useState } from 'react';
import { adminApi } from '../../lib/adminApi';

export default function Login({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminApi.login(password);
      onAuthenticated();
    } catch (err) {
      setError('Senha incorreta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2rem] shadow-lg border border-slate-100 w-full max-w-sm">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic mb-6 text-center">Admin</h1>
        <input
          type="password"
          required
          autoFocus
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
        />
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase hover:bg-red-800 transition-all disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

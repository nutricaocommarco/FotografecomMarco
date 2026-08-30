import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';

const FORM_VAZIO = { evento: '', data_evento: '', previsao_horario: '', obs: '' };

export default function AdminEmBreve() {
  const [avisos, setAvisos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    adminApi.listAvisos().then(setAvisos).catch((e) => setErro(e.message));
  }

  useEffect(carregar, []);

  async function handleCriar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await adminApi.createAviso({ ...form, ativo: true });
      setForm(FORM_VAZIO);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handlePublicar(id) {
    await adminApi.updateAviso(id, { marcarPublicado: true });
    carregar();
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir este aviso e apagar a lista de e-mails dele?')) return;
    await adminApi.deleteAviso(id);
    carregar();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-black uppercase italic mb-8">Em Breve</h1>

      <form onSubmit={handleCriar} className="bg-white p-6 rounded-2xl border border-slate-200 mb-10 space-y-4">
        <input
          placeholder="Evento (ex: Dia 15/09 — Pedal X)"
          required
          value={form.evento}
          onChange={(e) => setForm({ ...form, evento: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            placeholder="Previsão (ex: 18h)"
            required
            value={form.previsao_horario}
            onChange={(e) => setForm({ ...form, previsao_horario: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
          <input
            type="date"
            value={form.data_evento}
            onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
        </div>
        <textarea
          placeholder="OBS (opcional)"
          value={form.obs}
          onChange={(e) => setForm({ ...form, obs: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
        />
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button type="submit" disabled={salvando} className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60">
          {salvando ? 'Criando...' : 'Ativar aviso'}
        </button>
        <p className="text-xs text-slate-400">Só pode existir um aviso ativo por vez na página de Coberturas.</p>
      </form>

      <div className="space-y-3">
        {avisos.map((a) => (
          <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">
                  {a.evento} {a.ativo ? <span className="text-green-600 text-xs uppercase ml-2">ativo</span> : <span className="text-slate-400 text-xs uppercase ml-2">publicado</span>}
                </p>
                <p className="text-xs text-slate-400">
                  Previsão {a.previsao_horario} · {a.inscricoes?.length || 0} e-mail(s) cadastrado(s)
                </p>
              </div>
              <div className="flex gap-3">
                {a.ativo && (
                  <button onClick={() => handlePublicar(a.id)} className="text-sm font-bold text-red-700">
                    Marcar publicado
                  </button>
                )}
                <button onClick={() => handleExcluir(a.id)} className="text-sm font-bold text-slate-400 hover:text-red-700">
                  Excluir
                </button>
              </div>
            </div>
            {a.inscricoes?.length > 0 && (
              <ul className="mt-3 text-sm text-slate-600 list-disc pl-5">
                {a.inscricoes.map((i) => (
                  <li key={i.id}>{i.email}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';

const FORM_VAZIO = { titulo: '', percentual: 0, prazo: '', link: '', link_label: '', ativo: true };

export default function AdminProgresso() {
  const [metas, setMetas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    adminApi.listMetas().then(setMetas).catch((e) => setErro(e.message));
  }

  useEffect(carregar, []);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      if (editandoId) {
        await adminApi.updateMeta(editandoId, form);
      } else {
        await adminApi.createMeta(form);
      }
      setForm(FORM_VAZIO);
      setEditandoId(null);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(m) {
    setEditandoId(m.id);
    setForm({ titulo: m.titulo, percentual: m.percentual, prazo: m.prazo || '', link: m.link || '', link_label: m.link_label || '', ativo: m.ativo });
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir esta meta?')) return;
    await adminApi.deleteMeta(id);
    carregar();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black uppercase italic mb-8">Barra de Progresso</h1>

      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-2xl border border-slate-200 mb-10 space-y-4">
        <textarea
          placeholder="Título (ex: Conquistei um sonho: a casa própria!)"
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
        />
        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Percentual: {form.percentual}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.percentual}
            onChange={(e) => setForm({ ...form, percentual: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            placeholder="Prazo (ex: DEZ/2035)"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Ativa na Coberturas
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            placeholder="Link (opcional)"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
          <input
            placeholder="Texto do link (ex: Lista de presentes)"
            value={form.link_label}
            onChange={(e) => setForm({ ...form, link_label: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
        </div>
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button type="submit" disabled={salvando} className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60">
          {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar meta'}
        </button>
      </form>

      <div className="space-y-3">
        {metas.map((m) => (
          <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">{m.titulo}</p>
              <p className="text-xs text-slate-400">
                {m.percentual}% {m.ativo ? <span className="text-green-600 uppercase ml-2">ativa</span> : <span className="uppercase ml-2">inativa</span>}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEditar(m)} className="text-sm font-bold text-red-700">
                Editar
              </button>
              <button onClick={() => handleExcluir(m.id)} className="text-sm font-bold text-slate-400 hover:text-red-700">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

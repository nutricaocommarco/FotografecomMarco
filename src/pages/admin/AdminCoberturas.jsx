import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { buildLinkPrincipal, parseGaleriasColadas, gerarLinksGalerias, calcularDataSaidaDoAr } from '../../lib/focoRadicalLinks';

const FORM_VAZIO = {
  nome: 'Treino Prainha',
  local: 'treino-prainha',
  data_evento: '',
  foto_capa: '',
  obs: '',
  data_saida_do_ar: '',
};

export default function AdminCoberturas() {
  const [coberturas, setCoberturas] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [textoGalerias, setTextoGalerias] = useState('');
  const [galeriasParseadas, setGaleriasParseadas] = useState([]);
  const [esconderZero, setEsconderZero] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [saidaEditadaManualmente, setSaidaEditadaManualmente] = useState(false);

  function handleDataEventoChange(novaData) {
    setForm((f) => ({
      ...f,
      data_evento: novaData,
      data_saida_do_ar: saidaEditadaManualmente ? f.data_saida_do_ar : calcularDataSaidaDoAr(novaData),
    }));
  }

  function arquivoParaBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Redimensiona pra no máximo 1600px de largura e recomprime em WebP (bem mais leve
  // que JPEG na mesma qualidade visual) — o site fica mais rápido pra carregar.
  function comprimirImagem(file, larguraMaxima = 1600, qualidade = 0.78) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const urlTemp = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(urlTemp);
        const escala = Math.min(1, larguraMaxima / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem'))), 'image/webp', qualidade);
      };
      img.onerror = reject;
      img.src = urlTemp;
    });
  }

  async function handleFotoSelecionada(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErro('Foto muito grande (máximo 15MB antes de comprimir).');
      return;
    }
    setEnviandoFoto(true);
    setErro('');
    try {
      const comprimida = await comprimirImagem(file);
      const fileBase64 = await arquivoParaBase64(comprimida);
      const { url } = await adminApi.uploadFoto(fileBase64, 'capa.webp', 'image/webp');
      setForm((f) => ({ ...f, foto_capa: url }));
    } catch (err) {
      setErro('Falha ao enviar foto: ' + err.message);
    } finally {
      setEnviandoFoto(false);
    }
  }

  function carregar() {
    adminApi.listCoberturas().then(setCoberturas).catch((e) => setErro(e.message));
  }

  useEffect(carregar, []);

  function handleParsear() {
    const galerias = parseGaleriasColadas(textoGalerias);
    setGaleriasParseadas(galerias);
  }

  function handleAdicionarTodasAsFotos() {
    setGaleriasParseadas((atual) => {
      if (atual.some((g) => g.codigo === 'todas')) return atual;
      return [...atual, { nome: 'Todas as Fotos', codigo: 'todas' }];
    });
  }

  const galeriasVisiveis = esconderZero ? galeriasParseadas.filter((g) => (g.numFotos ?? 1) > 0) : galeriasParseadas;

  async function handleSalvar(e) {
    e.preventDefault();
    if (!form.data_evento) {
      setErro('Preencha a data do evento.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const linkPrincipal = buildLinkPrincipal(form.data_evento, form.local);
      const galerias = gerarLinksGalerias(galeriasVisiveis, form.data_evento, form.local);

      const payload = {
        nome: form.nome,
        data_evento: form.data_evento,
        foto_capa: form.foto_capa || null,
        obs: form.obs || null,
        data_saida_do_ar: form.data_saida_do_ar || null,
        link_principal: linkPrincipal,
        galerias,
      };

      if (editandoId) {
        await adminApi.updateCobertura(editandoId, payload);
      } else {
        await adminApi.createCobertura(payload);
      }

      setForm(FORM_VAZIO);
      setTextoGalerias('');
      setGaleriasParseadas([]);
      setEditandoId(null);
      setSaidaEditadaManualmente(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(c) {
    setEditandoId(c.id);
    setSaidaEditadaManualmente(true); // respeita o valor já salvo, não recalcula por cima
    setForm({
      nome: c.nome,
      local: c.local || 'treino-prainha',
      data_evento: c.data_evento,
      foto_capa: c.foto_capa || '',
      obs: c.obs || '',
      data_saida_do_ar: c.data_saida_do_ar || '',
    });
    setGaleriasParseadas(c.galerias || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir esta cobertura?')) return;
    await adminApi.deleteCobertura(id);
    carregar();
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black uppercase italic mb-8">Coberturas</h1>

      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-2xl border border-slate-200 mb-10 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            placeholder="Nome/local do evento"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
          <input
            placeholder="Slug do local (ex: treino-prainha)"
            value={form.local}
            onChange={(e) => setForm({ ...form, local: e.target.value })}
            className="px-4 py-2.5 rounded-xl border border-slate-200"
          />
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Data do evento</label>
            <input
              type="date"
              value={form.data_evento}
              onChange={(e) => handleDataEventoChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Sai do ar em (automático: evento + 6 meses)</label>
            <input
              type="date"
              value={form.data_saida_do_ar}
              onChange={(e) => {
                setSaidaEditadaManualmente(true);
                setForm({ ...form, data_saida_do_ar: e.target.value });
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Foto de capa</label>
          <input type="file" accept="image/*" onChange={handleFotoSelecionada} className="block w-full text-sm mt-1" />
          {enviandoFoto && <p className="text-xs text-slate-400 mt-1">Enviando foto...</p>}
          {form.foto_capa && !enviandoFoto && (
            <img src={form.foto_capa} alt="Prévia" className="mt-2 h-24 rounded-lg object-cover" />
          )}
        </div>

        <textarea
          placeholder="OBS (opcional) — ex: fotos de chuva, sessão parcial..."
          value={form.obs}
          onChange={(e) => setForm({ ...form, obs: e.target.value })}
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
        />

        <div>
          <label className="text-xs font-bold uppercase text-slate-500">Cole aqui a lista de galerias do Excel</label>
          <textarea
            value={textoGalerias}
            onChange={(e) => setTextoGalerias(e.target.value)}
            rows={6}
            placeholder={'Nome: Rockrider\nCódigo: rockrider\nNº de fotos: 0\n...'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm"
          />
          <div className="flex items-center gap-3 mt-2">
            <button type="button" onClick={handleParsear} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">
              Gerar links
            </button>
            <button
              type="button"
              onClick={handleAdicionarTodasAsFotos}
              className="bg-white text-red-700 border border-red-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-50"
            >
              + Todas as Fotos
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={esconderZero} onChange={(e) => setEsconderZero(e.target.checked)} />
              Esconder galerias com 0 fotos
            </label>
          </div>
        </div>

        {galeriasParseadas.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-1 max-h-64 overflow-y-auto">
            {galeriasVisiveis.map((g) => (
              <div key={g.codigo} className="text-sm flex justify-between text-slate-700">
                <span>
                  {g.nome} {g.numFotos != null && <span className="text-slate-400">({g.numFotos} fotos)</span>}
                </span>
                <span className="text-slate-400 font-mono">{g.codigo}</span>
              </div>
            ))}
          </div>
        )}

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        <button
          type="submit"
          disabled={salvando || enviandoFoto}
          className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar cobertura'}
        </button>
      </form>

      <div className="space-y-3">
        {coberturas.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">
                {c.nome} — {c.data_evento}
              </p>
              <p className="text-xs text-slate-400">{c.galerias?.length || 0} galerias · sai do ar: {c.data_saida_do_ar || '—'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleEditar(c)} className="text-sm font-bold text-red-700">
                Editar
              </button>
              <button onClick={() => handleExcluir(c.id)} className="text-sm font-bold text-slate-400 hover:text-red-700">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

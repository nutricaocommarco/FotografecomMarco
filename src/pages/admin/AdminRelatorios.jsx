import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import {
  parseRelatorioFotosPublicadas,
  parseRelatorioVendasPorCategoria,
  parseRelatorioResumoEventos,
  parseRelatorioInformacoesEvento,
} from '../../lib/relatorioFotosParser';

const CONDICOES_CLIMA = ['chuva', 'sol', 'vento', 'neblina'];
const OPCOES_DIVULGACAO = [
  { valor: 'nenhuma', label: 'Nenhuma' },
  { valor: 'stories', label: 'Stories' },
  { valor: 'post', label: 'Post' },
  { valor: 'grupo_whatsapp', label: 'Grupo de WhatsApp' },
  { valor: 'outro', label: 'Outro' },
];

const FORM_VAZIO = {
  data: '',
  foi_fotografar: true,
  motivo_nao_foi: '',
  horario_chegada: '',
  horario_saida: '',
  clima_condicoes: [],
  clima_temperatura_max: '',
  clima_temperatura_min: '',
  clima_precipitacao_mm: '',
  clima_vento_kmh_max: '',
  rostos_reconhecidos: '',
  camera: '',
  preco_baixa: '',
  preco_media: '',
  preco_alta: '',
  preco_premium: '',
  fotos_enviadas: '',
  fotos_vendidas_total: '',
  vendas_baixa_qtd: '',
  vendas_baixa_valor: '',
  vendas_media_qtd: '',
  vendas_media_valor: '',
  vendas_alta_qtd: '',
  vendas_alta_valor: '',
  vendas_premium_qtd: '',
  vendas_premium_valor: '',
  vendas_video_qtd: '',
  vendas_video_valor: '',
  valor_total_vendido: '',
  divulgacao: [],
  divulgacao_obs: '',
  concorrencia: false,
  concorrencia_obs: '',
  observacoes: '',
};

const CAMPOS_NUMERICOS = [
  'clima_temperatura_max',
  'clima_temperatura_min',
  'clima_precipitacao_mm',
  'clima_vento_kmh_max',
  'rostos_reconhecidos',
  'preco_baixa',
  'preco_media',
  'preco_alta',
  'preco_premium',
  'fotos_enviadas',
  'fotos_vendidas_total',
  'vendas_baixa_qtd',
  'vendas_baixa_valor',
  'vendas_media_qtd',
  'vendas_media_valor',
  'vendas_alta_qtd',
  'vendas_alta_valor',
  'vendas_premium_qtd',
  'vendas_premium_valor',
  'vendas_video_qtd',
  'vendas_video_valor',
  'valor_total_vendido',
];

function SecaoTitulo({ children }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2 mb-1">{children}</h3>;
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 mt-1';

function CampoNumero({ label, value, onChange }) {
  return (
    <Campo label={label}>
      <input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </Campo>
  );
}

// há um dia de diferença ao formatar 'YYYY-MM-DD' com new Date(string) por causa
// do fuso (mesmo bug já corrigido em CoberturaCard/Post) — construir pelos
// componentes numéricos evita isso.
function formatarDataLocal(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatarDataHoraLocal(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Um "cole aqui um relatório do Foco Radical, parseia e importa" genérico —
// os quatro formatos de relatório (fotos publicadas, vendas por categoria,
// resumo por evento, informações do evento) seguem o mesmo fluxo: colar,
// parsear, conferir a prévia, importar (cria evento novo ou só atualiza os
// campos que esse relatório específico traz, sem mexer no resto).
function ImportadorColado({ titulo, descricao, placeholder, parseFn, mapearCampos, resumoLinha, eventos, onImportado }) {
  const [texto, setTexto] = useState('');
  const [parseados, setParseados] = useState([]);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState('');

  function handleParsear() {
    setParseados(parseFn(texto));
    setResultado('');
  }

  async function handleImportar() {
    setImportando(true);
    setResultado('');
    try {
      let criados = 0;
      let atualizados = 0;
      for (const ev of parseados) {
        const campos = mapearCampos(ev);
        const existente = eventos.find((e) => e.data === ev.data);
        if (existente) {
          await adminApi.updateEvento(existente.id, campos);
          atualizados++;
        } else {
          await adminApi.createEvento({ data: ev.data, foi_fotografar: true, ...campos });
          criados++;
        }
      }
      setResultado(`Pronto: ${criados} criado(s), ${atualizados} atualizado(s).`);
      setTexto('');
      setParseados([]);
      onImportado();
    } catch (err) {
      setResultado(`Erro na importação: ${err.message}`);
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 mb-1">{titulo}</h2>
      <p className="text-xs text-slate-400 mb-4">{descricao}</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm"
      />
      <button type="button" onClick={handleParsear} className="mt-3 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">
        Parsear
      </button>

      {parseados.length > 0 && (
        <div className="mt-4 border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto space-y-1">
          {parseados.map((ev) => (
            <div key={ev.data} className="text-sm flex justify-between text-slate-700">
              <span>{formatarDataLocal(ev.data)}</span>
              <span className="text-slate-400">
                {resumoLinha(ev)}
                {eventos.some((e) => e.data === ev.data) ? ' · atualiza existente' : ' · novo'}
              </span>
            </div>
          ))}
        </div>
      )}

      {parseados.length > 0 && (
        <button
          type="button"
          onClick={handleImportar}
          disabled={importando}
          className="mt-3 bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60"
        >
          {importando ? 'Importando...' : `Importar ${parseados.length} evento(s)`}
        </button>
      )}
      {resultado && <p className="text-sm text-slate-600 mt-3">{resultado}</p>}
    </div>
  );
}

export default function AdminRelatorios() {
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [climaTocadoManualmente, setClimaTocadoManualmente] = useState(false);
  const [buscandoClima, setBuscandoClima] = useState(false);
  const [statusBackfill, setStatusBackfill] = useState('');
  const [rodandoBackfill, setRodandoBackfill] = useState(false);

  function carregar() {
    adminApi.listEventos().then(setEventos).catch((e) => setErro(e.message));
  }

  useEffect(carregar, []);

  function alternarNaLista(campo, valor) {
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(valor) ? f[campo].filter((v) => v !== valor) : [...f[campo], valor],
    }));
  }

  function tocarClimaManualmente() {
    setClimaTocadoManualmente(true);
  }

  // Se o clima ainda não foi preenchido (nem manualmente, nem por uma busca
  // automática anterior), busca na Open-Meteo a partir da data do evento.
  // Falha silenciosamente (o campo continua editável na mão) — clima
  // automático é um "nice to have", não pode travar o preenchimento do resto.
  async function handleDataChange(novaData) {
    setForm((f) => ({ ...f, data: novaData }));
    if (climaTocadoManualmente || !novaData) return;
    const climaVazio =
      form.clima_condicoes.length === 0 &&
      !form.clima_temperatura_max &&
      !form.clima_temperatura_min &&
      !form.clima_precipitacao_mm &&
      !form.clima_vento_kmh_max;
    if (!climaVazio) return;

    setBuscandoClima(true);
    try {
      const c = await adminApi.buscarClima(novaData);
      setForm((f) =>
        climaTocadoManualmente
          ? f
          : {
              ...f,
              clima_condicoes: c.condicoes || [],
              clima_temperatura_max: c.temperatura_max ?? '',
              clima_temperatura_min: c.temperatura_min ?? '',
              clima_precipitacao_mm: c.precipitacao_mm ?? '',
              clima_vento_kmh_max: c.vento_kmh_max ?? '',
            },
      );
    } catch {
      // best-effort, sem aviso de erro pro usuário — o clima segue editável na mão
    } finally {
      setBuscandoClima(false);
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!form.data) {
      setErro('Preencha a data.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const payload = { ...form };
      CAMPOS_NUMERICOS.forEach((campo) => {
        payload[campo] = payload[campo] === '' ? null : Number(payload[campo]);
      });
      payload.motivo_nao_foi = payload.foi_fotografar ? null : payload.motivo_nao_foi || null;
      payload.horario_chegada = payload.horario_chegada || null;
      payload.horario_saida = payload.horario_saida || null;
      payload.camera = payload.camera || null;
      payload.divulgacao_obs = payload.divulgacao.includes('outro') ? payload.divulgacao_obs || null : null;
      payload.concorrencia_obs = payload.concorrencia ? payload.concorrencia_obs || null : null;
      payload.observacoes = payload.observacoes || null;
      const climaPreenchido = payload.clima_condicoes.length > 0 || CAMPOS_NUMERICOS.slice(0, 4).some((c) => payload[c] != null);
      payload.clima_fonte = !climaPreenchido ? null : climaTocadoManualmente ? 'manual' : 'auto';

      if (editandoId) {
        await adminApi.updateEvento(editandoId, payload);
      } else {
        await adminApi.createEvento(payload);
      }

      setForm(FORM_VAZIO);
      setEditandoId(null);
      setClimaTocadoManualmente(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function handleEditar(ev) {
    setEditandoId(ev.id);
    setClimaTocadoManualmente(true); // não refaz busca automática por cima de um evento já preenchido
    setForm({
      ...FORM_VAZIO,
      ...ev,
      motivo_nao_foi: ev.motivo_nao_foi || '',
      horario_chegada: ev.horario_chegada || '',
      horario_saida: ev.horario_saida || '',
      clima_condicoes: ev.clima_condicoes || [],
      divulgacao: ev.divulgacao || [],
      divulgacao_obs: ev.divulgacao_obs || '',
      concorrencia_obs: ev.concorrencia_obs || '',
      observacoes: ev.observacoes || '',
      camera: ev.camera || '',
      ...Object.fromEntries(CAMPOS_NUMERICOS.map((c) => [c, ev[c] ?? ''])),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir este relatório de evento?')) return;
    await adminApi.deleteEvento(id);
    carregar();
  }

  // Popula clima_historico com os últimos 6 anos (um ano por chamada, pra não
  // estourar o tempo de execução da function) — permite comparar dias que não
  // fui trabalhar com o clima real daquele dia, mesmo antes desse sistema existir.
  async function handleBackfillClima() {
    setRodandoBackfill(true);
    const anoAtual = new Date().getFullYear();
    try {
      for (let ano = anoAtual - 6; ano <= anoAtual; ano++) {
        setStatusBackfill(`Buscando ${ano}...`);
        const r = await adminApi.backfillClima(ano);
        setStatusBackfill(`${ano}: ${r.dias} dia(s) salvos`);
      }
      setStatusBackfill('Concluído.');
    } catch (err) {
      setStatusBackfill(`Erro: ${err.message}`);
    } finally {
      setRodandoBackfill(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <h1 className="text-2xl font-black uppercase italic">Relatório de Eventos</h1>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleBackfillClima}
            disabled={rodandoBackfill}
            title="Busca o clima histórico (Open-Meteo) dos últimos 6 anos e guarda em cache — não precisa rodar de novo, é só pra ter dado retroativo disponível."
            className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-700 disabled:opacity-60"
          >
            {rodandoBackfill ? 'Buscando clima histórico...' : 'Popular clima histórico'}
          </button>
          {statusBackfill && <span className="text-xs text-slate-400">{statusBackfill}</span>}
        </div>
      </div>

      <form onSubmit={handleSalvar} className="bg-white p-6 rounded-2xl border border-slate-200 mb-10 space-y-6">
        <SecaoTitulo>Básico</SecaoTitulo>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Data">
            <input type="date" value={form.data} onChange={(e) => handleDataChange(e.target.value)} className={inputClass} />
          </Campo>
          <Campo label="Câmera usada">
            <input value={form.camera} onChange={(e) => setForm({ ...form, camera: e.target.value })} className={inputClass} />
          </Campo>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.foi_fotografar}
            onChange={(e) => setForm({ ...form, foi_fotografar: e.target.checked })}
          />
          Fui fotografar
        </label>

        {form.foi_fotografar ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo label="Horário de chegada">
              <input
                type="time"
                value={form.horario_chegada}
                onChange={(e) => setForm({ ...form, horario_chegada: e.target.value })}
                className={inputClass}
              />
            </Campo>
            <Campo label="Horário de saída">
              <input
                type="time"
                value={form.horario_saida}
                onChange={(e) => setForm({ ...form, horario_saida: e.target.value })}
                className={inputClass}
              />
            </Campo>
          </div>
        ) : (
          <Campo label="Motivo de não ter ido">
            <input
              value={form.motivo_nao_foi}
              onChange={(e) => setForm({ ...form, motivo_nao_foi: e.target.value })}
              className={inputClass}
            />
          </Campo>
        )}

        <SecaoTitulo>
          Clima {buscandoClima && <span className="text-slate-400 normal-case font-normal">buscando automaticamente...</span>}
        </SecaoTitulo>
        <div className="flex flex-wrap gap-4">
          {CONDICOES_CLIMA.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm text-slate-700 capitalize">
              <input
                type="checkbox"
                checked={form.clima_condicoes.includes(c)}
                onChange={() => {
                  tocarClimaManualmente();
                  alternarNaLista('clima_condicoes', c);
                }}
              />
              {c}
            </label>
          ))}
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <CampoNumero
            label="Temp. máx (°C)"
            value={form.clima_temperatura_max}
            onChange={(v) => {
              tocarClimaManualmente();
              setForm({ ...form, clima_temperatura_max: v });
            }}
          />
          <CampoNumero
            label="Temp. mín (°C)"
            value={form.clima_temperatura_min}
            onChange={(v) => {
              tocarClimaManualmente();
              setForm({ ...form, clima_temperatura_min: v });
            }}
          />
          <CampoNumero
            label="Chuva (mm)"
            value={form.clima_precipitacao_mm}
            onChange={(v) => {
              tocarClimaManualmente();
              setForm({ ...form, clima_precipitacao_mm: v });
            }}
          />
          <CampoNumero
            label="Vento máx (km/h)"
            value={form.clima_vento_kmh_max}
            onChange={(v) => {
              tocarClimaManualmente();
              setForm({ ...form, clima_vento_kmh_max: v });
            }}
          />
        </div>

        <SecaoTitulo>Reconhecimento e preços</SecaoTitulo>
        <div className="grid sm:grid-cols-2 gap-4">
          <CampoNumero
            label="Rostos reconhecidos"
            value={form.rostos_reconhecidos}
            onChange={(v) => setForm({ ...form, rostos_reconhecidos: v })}
          />
          <CampoNumero label="Fotos enviadas" value={form.fotos_enviadas} onChange={(v) => setForm({ ...form, fotos_enviadas: v })} />
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <CampoNumero label="Preço Baixa" value={form.preco_baixa} onChange={(v) => setForm({ ...form, preco_baixa: v })} />
          <CampoNumero label="Preço Média" value={form.preco_media} onChange={(v) => setForm({ ...form, preco_media: v })} />
          <CampoNumero label="Preço Alta" value={form.preco_alta} onChange={(v) => setForm({ ...form, preco_alta: v })} />
          <CampoNumero label="Preço Premium" value={form.preco_premium} onChange={(v) => setForm({ ...form, preco_premium: v })} />
        </div>

        <SecaoTitulo>Vendas por categoria</SecaoTitulo>
        <div className="grid sm:grid-cols-4 gap-4">
          <CampoNumero label="Baixa — qtd" value={form.vendas_baixa_qtd} onChange={(v) => setForm({ ...form, vendas_baixa_qtd: v })} />
          <CampoNumero
            label="Baixa — valor"
            value={form.vendas_baixa_valor}
            onChange={(v) => setForm({ ...form, vendas_baixa_valor: v })}
          />
          <CampoNumero label="Média — qtd" value={form.vendas_media_qtd} onChange={(v) => setForm({ ...form, vendas_media_qtd: v })} />
          <CampoNumero
            label="Média — valor"
            value={form.vendas_media_valor}
            onChange={(v) => setForm({ ...form, vendas_media_valor: v })}
          />
          <CampoNumero label="Alta — qtd" value={form.vendas_alta_qtd} onChange={(v) => setForm({ ...form, vendas_alta_qtd: v })} />
          <CampoNumero label="Alta — valor" value={form.vendas_alta_valor} onChange={(v) => setForm({ ...form, vendas_alta_valor: v })} />
          <CampoNumero
            label="Premium — qtd"
            value={form.vendas_premium_qtd}
            onChange={(v) => setForm({ ...form, vendas_premium_qtd: v })}
          />
          <CampoNumero
            label="Premium — valor"
            value={form.vendas_premium_valor}
            onChange={(v) => setForm({ ...form, vendas_premium_valor: v })}
          />
          <CampoNumero label="Vídeo — qtd" value={form.vendas_video_qtd} onChange={(v) => setForm({ ...form, vendas_video_qtd: v })} />
          <CampoNumero
            label="Vídeo — valor"
            value={form.vendas_video_valor}
            onChange={(v) => setForm({ ...form, vendas_video_valor: v })}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <CampoNumero
            label="Fotos vendidas (total)"
            value={form.fotos_vendidas_total}
            onChange={(v) => setForm({ ...form, fotos_vendidas_total: v })}
          />
          <CampoNumero
            label="Valor total vendido"
            value={form.valor_total_vendido}
            onChange={(v) => setForm({ ...form, valor_total_vendido: v })}
          />
        </div>

        <SecaoTitulo>Divulgação e concorrência</SecaoTitulo>
        <div className="flex flex-wrap gap-4">
          {OPCOES_DIVULGACAO.map((op) => (
            <label key={op.valor} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.divulgacao.includes(op.valor)}
                onChange={() => alternarNaLista('divulgacao', op.valor)}
              />
              {op.label}
            </label>
          ))}
        </div>
        {form.divulgacao.includes('outro') && (
          <Campo label="Qual outra divulgação">
            <input
              value={form.divulgacao_obs}
              onChange={(e) => setForm({ ...form, divulgacao_obs: e.target.value })}
              className={inputClass}
            />
          </Campo>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.concorrencia} onChange={(e) => setForm({ ...form, concorrencia: e.target.checked })} />
          Apareceu concorrência
        </label>
        {form.concorrencia && (
          <Campo label="Observação sobre a concorrência">
            <input
              value={form.concorrencia_obs}
              onChange={(e) => setForm({ ...form, concorrencia_obs: e.target.value })}
              className={inputClass}
            />
          </Campo>
        )}

        <SecaoTitulo>Observações</SecaoTitulo>
        <textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200"
        />

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        <button type="submit" disabled={salvando} className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60">
          {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar relatório'}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={() => {
              setForm(FORM_VAZIO);
              setEditandoId(null);
              setClimaTocadoManualmente(false);
            }}
            className="ml-3 text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            Cancelar edição
          </button>
        )}
      </form>

      <ImportadorColado
        titulo="Importar relatório de fotos publicadas"
        descricao='Cole aqui o relatório do Foco Radical (título, data, total de fotos e, opcionalmente, fotos já vendidas). Eventos com data já existente só têm esses dois campos atualizados — o resto do que já foi preenchido não é mexido.'
        placeholder={'TREINO PRAINHA 01-AGO-2026 @fotografecommarco\n01 AGO 2026TreinoRio De Janeiro / RJ\n2.147\nDisponível até 01/02/2027\n...'}
        parseFn={parseRelatorioFotosPublicadas}
        mapearCampos={(ev) => ({ fotos_enviadas: ev.fotos_enviadas, fotos_vendidas_total: ev.fotos_vendidas_total })}
        resumoLinha={(ev) => `${ev.fotos_enviadas} enviadas${ev.fotos_vendidas_total != null ? ` · ${ev.fotos_vendidas_total} vendidas` : ''}`}
        eventos={eventos}
        onImportado={carregar}
      />

      <ImportadorColado
        titulo="Importar vendas por categoria"
        descricao="Cole aqui o relatório de vendas por categoria do Foco Radical (Premium/Alta/Média/Baixa/Vídeo, quantidade e valor). Preenche as vendas por categoria e os totais do evento, sem mexer no resto."
        placeholder={'277384 - Treino NA PRAINHA 30-AGO-2026 @fotografecommarco\nPremium 4500 Pixels\t23\tR$ 453,72\tR$ 0,00\tSim\n...'}
        parseFn={parseRelatorioVendasPorCategoria}
        mapearCampos={(ev) => ({
          vendas_baixa_qtd: ev.vendas.baixa?.qtd ?? null,
          vendas_baixa_valor: ev.vendas.baixa?.valor ?? null,
          vendas_media_qtd: ev.vendas.media?.qtd ?? null,
          vendas_media_valor: ev.vendas.media?.valor ?? null,
          vendas_alta_qtd: ev.vendas.alta?.qtd ?? null,
          vendas_alta_valor: ev.vendas.alta?.valor ?? null,
          vendas_premium_qtd: ev.vendas.premium?.qtd ?? null,
          vendas_premium_valor: ev.vendas.premium?.valor ?? null,
          vendas_video_qtd: ev.vendas.video?.qtd ?? null,
          vendas_video_valor: ev.vendas.video?.valor ?? null,
          fotos_vendidas_total: ev.fotos_vendidas_total,
          valor_total_vendido: ev.valor_total_vendido,
        })}
        resumoLinha={(ev) => `${ev.fotos_vendidas_total} vendidas · R$ ${ev.valor_total_vendido.toFixed(2)}`}
        eventos={eventos}
        onImportado={carregar}
      />

      <ImportadorColado
        titulo="Importar resumo por evento (valor líquido)"
        descricao="Cole aqui a lista-resumo do Foco Radical (uma linha por evento, já com o valor líquido recebido e o total de fotos vendidas). Sobrescreve valor total vendido e fotos vendidas — é a fonte mais confiável pra esses dois campos, já que o valor já vem descontado de taxas."
        placeholder={'277384 - Treino NA PRAINHA 30-AGO-2026 @fotografecommarco\t30/08/2026\tR$ 737,30\tR$ 737,30\t48\n...'}
        parseFn={parseRelatorioResumoEventos}
        mapearCampos={(ev) => ({ valor_total_vendido: ev.valor_total_vendido, fotos_vendidas_total: ev.fotos_vendidas_total })}
        resumoLinha={(ev) => `${ev.fotos_vendidas_total} vendidas · R$ ${ev.valor_total_vendido.toFixed(2)} líquido`}
        eventos={eventos}
        onImportado={carregar}
      />

      <ImportadorColado
        titulo="Importar informações do evento (rostos reconhecidos)"
        descricao='Cole aqui a página "Informações do evento" do Foco Radical (pode colar vários eventos seguidos). Preenche fotos enviadas e rostos reconhecidos, sem mexer no resto.'
        placeholder={'TREINO NA PRAINHA 30-AGO-2026 @fotografecommarco\n...\nLançamento do evento: 30/08/2026 18:00\nFotos processadas: 1915\nRostos identificados: 2289\n...'}
        parseFn={parseRelatorioInformacoesEvento}
        mapearCampos={(ev) => ({ fotos_enviadas: ev.fotos_enviadas, rostos_reconhecidos: ev.rostos_reconhecidos })}
        resumoLinha={(ev) => `${ev.fotos_enviadas ?? '—'} enviadas · ${ev.rostos_reconhecidos ?? '—'} rostos`}
        eventos={eventos}
        onImportado={carregar}
      />

      <div className="space-y-3">
        {eventos.map((ev) => {
          const editadoRecentemente = ev.updated_at && ev.created_at && ev.updated_at !== ev.created_at;
          return (
            <div key={ev.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  {formatarDataLocal(ev.data)}
                  {!ev.foi_fotografar && <span className="text-xs font-bold text-slate-400 normal-case">não foi</span>}
                  {editadoRecentemente && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                      Atualizado
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  R$ {ev.valor_total_vendido ?? 0} vendido · {ev.rostos_reconhecidos ?? '—'} rostos ·{' '}
                  {ev.updated_at ? `editado em ${formatarDataHoraLocal(ev.updated_at)}` : ''}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => handleEditar(ev)} className="text-sm font-bold text-red-700">
                  Editar
                </button>
                <button onClick={() => handleExcluir(ev.id)} className="text-sm font-bold text-slate-400 hover:text-red-700">
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

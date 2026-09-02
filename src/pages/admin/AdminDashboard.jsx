import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { adminApi } from '../../lib/adminApi';

const VERMELHO = '#b91c1c';
const CINZA = '#64748b';
const CORES_CATEGORIA = {
  receitaBaixa: '#cbd5e1',
  receitaMedia: '#94a3b8',
  receitaAlta: '#ef4444',
  receitaPremium: '#b91c1c',
  receitaVideo: '#0f172a',
};

function formatarMes(mesReferencia) {
  const [ano, mes] = mesReferencia.split('-');
  return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

function formatarReal(v) {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function CardVazio({ children }) {
  return <p className="text-sm text-slate-400 py-10 text-center">{children}</p>;
}

function PainelGrafico({ titulo, children, vazio }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{titulo}</h3>
      {vazio ? <CardVazio>Sem dados suficientes ainda.</CardVazio> : <div style={{ height: 240 }}>{children}</div>}
    </div>
  );
}

function distribuicaoParaArray(distribuicao) {
  return Object.entries(distribuicao || {})
    .map(([qtd, compradores]) => ({ qtd: Number(qtd), compradores }))
    .sort((a, b) => a.qtd - b.qtd);
}

function GraficoFrequencia({ titulo, distribuicao }) {
  const dados = distribuicaoParaArray(distribuicao);
  return (
    <PainelGrafico titulo={titulo} vazio={dados.length === 0}>
      <ResponsiveContainer>
        <BarChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="qtd" tick={{ fontSize: 12 }} label={{ value: 'Nº de compras', position: 'insideBottom', offset: -5, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="compradores" fill={VERMELHO} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </PainelGrafico>
  );
}

function formatarPct(v) {
  return v == null ? '—' : `${v.toFixed(1)}%`;
}

function freqParaTexto(distribuicao) {
  const entradas = Object.entries(distribuicao || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  return entradas.length ? entradas.map(([q, c]) => `${q}x: ${c}`).join(', ') : '—';
}

function agruparEventosPorAno(porMes) {
  const porAno = new Map();
  for (const m of porMes) {
    const ano = m.mes.slice(0, 4);
    if (!porAno.has(ano)) porAno.set(ano, { ano, fotosEnviadas: 0, fotosVendidas: 0, receitaTotal: 0, rostosReconhecidos: 0 });
    const r = porAno.get(ano);
    r.fotosEnviadas += m.fotosEnviadas || 0;
    r.fotosVendidas += m.fotosVendidas || 0;
    r.receitaTotal += m.receitaTotal || 0;
    r.rostosReconhecidos += m.rostosReconhecidos || 0;
  }
  return [...porAno.values()]
    .map((r) => ({ ...r, taxaConversao: r.fotosEnviadas ? (r.fotosVendidas / r.fotosEnviadas) * 100 : null }))
    .sort((a, b) => a.ano.localeCompare(b.ano));
}

function agruparCompradoresPorAno(compradoresPorMes) {
  const porAno = new Map();
  for (const m of compradoresPorMes) {
    const ano = m.mes.slice(0, 4);
    if (!porAno.has(ano)) porAno.set(ano, { ano, totalTransacoes: 0, valorBrutoTotal: 0, novos: 0, recorrentes: 0 });
    const r = porAno.get(ano);
    r.totalTransacoes += m.totalTransacoes || 0;
    r.valorBrutoTotal += m.valorBrutoTotal || 0;
    r.novos += m.compradoresNovos || 0;
    r.recorrentes += m.compradoresRecorrentes || 0;
  }
  return [...porAno.values()]
    .map((r) => ({
      ...r,
      ticketMedio: r.totalTransacoes ? r.valorBrutoTotal / r.totalTransacoes : null,
      pctRecorrentes: r.novos + r.recorrentes ? (r.recorrentes / (r.novos + r.recorrentes)) * 100 : null,
    }))
    .sort((a, b) => a.ano.localeCompare(b.ano));
}

// Relatório completo pra colar em outra conversa — mês a mês e ano a ano,
// eventos e compradores, previsão do mês em andamento e distribuição de
// frequência de compra por ano (não só o ano selecionado no dashboard).
function montarResumoCompleto({ porMes, compradoresPorMes, previsao, mesAtualStr, frequenciaPorAno }) {
  const linhas = [`# Fotografe com Marco — Resumo Completo`, `_Gerado em ${new Date().toLocaleDateString('pt-BR')}_`, ''];

  if (previsao) {
    linhas.push('## Previsão do mês em andamento');
    if (previsao.confiavel) {
      linhas.push(
        `- Receita registrada até hoje (dia ${previsao.dia_hoje} de ${previsao.dias_uteis_mes_alvo} dias de fim de semana/feriado no mês): ${formatarReal(previsao.receita_registrada)}`,
        `- Projeção do mês: mínimo ${formatarReal(previsao.previsao.minimo)} · médio ${formatarReal(previsao.previsao.medio)} · máximo ${formatarReal(previsao.previsao.maximo)}`,
        `- Baseado em ${previsao.meses_fechados} mês(es) fechado(s)${previsao.ajuste_clima_ativo ? ', com ajuste por clima' : ''}.`,
        '',
      );
    } else {
      linhas.push(`- Histórico insuficiente pra previsão confiável (${previsao.meses_fechados} mês(es) fechado(s), mínimo 3).`, '');
    }
  }

  linhas.push('## Eventos — mês a mês');
  linhas.push('| Mês | Fotos enviadas | Fotos vendidas | Conversão | Receita total | Baixa | Média | Alta | Premium | Vídeo | Rostos |');
  linhas.push('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const m of porMes) {
    linhas.push(
      `| ${formatarMes(`${m.mes}-01`)} | ${m.fotosEnviadas} | ${m.fotosVendidas} | ${formatarPct(m.taxaConversao)} | ${formatarReal(m.receitaTotal)} | ${formatarReal(m.receitaBaixa)} | ${formatarReal(m.receitaMedia)} | ${formatarReal(m.receitaAlta)} | ${formatarReal(m.receitaPremium)} | ${formatarReal(m.receitaVideo)} | ${m.rostosReconhecidos} |`,
    );
  }
  linhas.push('');

  const eventosPorAno = agruparEventosPorAno(porMes);
  linhas.push('## Eventos — ano a ano');
  linhas.push('| Ano | Fotos enviadas | Fotos vendidas | Conversão média | Receita total | Rostos reconhecidos |');
  linhas.push('|---|---|---|---|---|---|');
  for (const a of eventosPorAno) {
    linhas.push(
      `| ${a.ano} | ${a.fotosEnviadas} | ${a.fotosVendidas} | ${formatarPct(a.taxaConversao)} | ${formatarReal(a.receitaTotal)} | ${a.rostosReconhecidos} |`,
    );
  }
  linhas.push('');

  linhas.push('## Compradores — mês a mês');
  linhas.push('| Mês | Transações | Únicos | Valor bruto | Ticket médio | Recompra no mês | Novos | Recorrentes |');
  linhas.push('|---|---|---|---|---|---|---|---|');
  for (const m of compradoresPorMes) {
    linhas.push(
      `| ${formatarMes(`${m.mes}-01`)} | ${m.totalTransacoes ?? '—'} | ${m.totalCompradoresUnicos ?? '—'} | ${formatarReal(m.valorBrutoTotal)} | ${formatarReal(m.ticketMedio)} | ${formatarPct(m.taxaRecompraMes)} | ${m.compradoresNovos ?? '—'} | ${m.compradoresRecorrentes ?? '—'} |`,
    );
  }
  linhas.push('');

  const compradoresPorAno = agruparCompradoresPorAno(compradoresPorMes);
  linhas.push('## Compradores — ano a ano');
  linhas.push('| Ano | Transações | Valor bruto | Ticket médio | % recorrentes no ano | Novos | Recorrentes |');
  linhas.push('|---|---|---|---|---|---|---|');
  for (const a of compradoresPorAno) {
    linhas.push(
      `| ${a.ano} | ${a.totalTransacoes} | ${formatarReal(a.valorBrutoTotal)} | ${formatarReal(a.ticketMedio)} | ${formatarPct(a.pctRecorrentes)} | ${a.novos} | ${a.recorrentes} |`,
    );
  }
  linhas.push('');

  linhas.push('## Distribuição de frequência de compra — por ano');
  for (const [ano, dist] of Object.entries(frequenciaPorAno || {}).sort()) {
    linhas.push(`- ${ano}: ${freqParaTexto(dist)}`);
  }

  return linhas.join('\n');
}

export default function AdminDashboard() {
  const [dados, setDados] = useState(null);
  const [meses, setMeses] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [snapshotMes, setSnapshotMes] = useState(null);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [distribuicaoAno, setDistribuicaoAno] = useState(null);
  const [resumoTexto, setResumoTexto] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [gerandoResumo, setGerandoResumo] = useState(false);

  const mesAtualStr = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    adminApi.dashboard().then(setDados);
    adminApi.listCompradores().then((lista) => {
      setMeses(lista);
      if (lista.length > 0) setMesSelecionado((atual) => atual || lista[0].mes_referencia.slice(0, 7));
    });
  }, []);

  useEffect(() => {
    if (!mesSelecionado) return;
    adminApi.compradoresDoMes(mesSelecionado).then(setSnapshotMes);
  }, [mesSelecionado]);

  useEffect(() => {
    if (!ano) return;
    adminApi.compradoresDoAno(ano).then((r) => setDistribuicaoAno(r.distribuicao_frequencia));
  }, [ano]);

  // Busca a distribuição de frequência de TODOS os anos que aparecem nos
  // dados (não só o ano selecionado no filtro acima) pra entrar no resumo completo.
  async function handleGerarResumo() {
    setGerandoResumo(true);
    setCopiado(false);
    try {
      const anos = [...new Set(dados.compradoresPorMes.map((m) => m.mes.slice(0, 4)))].sort();
      const resultados = await Promise.all(anos.map((ano) => adminApi.compradoresDoAno(ano)));
      const frequenciaPorAno = Object.fromEntries(anos.map((ano, i) => [ano, resultados[i].distribuicao_frequencia]));

      setResumoTexto(
        montarResumoCompleto({
          porMes: dados.porMes,
          compradoresPorMes: dados.compradoresPorMes,
          previsao,
          mesAtualStr,
          frequenciaPorAno,
        }),
      );
    } finally {
      setGerandoResumo(false);
    }
  }

  async function handleCopiar() {
    await navigator.clipboard.writeText(resumoTexto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!dados) return <p className="text-slate-400">Carregando...</p>;
  const previsao = dados.previsao;

  return (
    <div className="max-w-6xl space-y-8">
      <h1 className="text-2xl font-black uppercase italic">Dashboard</h1>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Previsão do mês em andamento</h2>
        {!previsao ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : !previsao.confiavel ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Dados insuficientes pra uma previsão confiável ({previsao.meses_fechados} mês(es) fechado(s) até agora — precisa de pelo
            menos 3).
          </p>
        ) : (
          <div>
            <div className="grid sm:grid-cols-4 gap-4 text-sm mb-2">
              <div>
                <p className="text-xs uppercase text-slate-400">Receita registrada (até dia {previsao.dia_hoje})</p>
                <p className="text-lg font-black">{formatarReal(previsao.receita_registrada)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Mínimo projetado</p>
                <p className="text-lg font-black">{formatarReal(previsao.previsao.minimo)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Médio projetado</p>
                <p className="text-lg font-black text-red-700">{formatarReal(previsao.previsao.medio)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Máximo projetado</p>
                <p className="text-lg font-black">{formatarReal(previsao.previsao.maximo)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Baseado em {previsao.meses_fechados} mês(es) fechado(s){previsao.ajuste_clima_ativo ? ', com ajuste por clima' : ''}.
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PainelGrafico titulo="Taxa de conversão por mês (%)" vazio={dados.porMes.length === 0}>
          <ResponsiveContainer>
            <LineChart data={dados.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => `${v?.toFixed(1)}%`} />
              <Line type="monotone" dataKey="taxaConversao" stroke={VERMELHO} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Receita por categoria (mês)" vazio={dados.porMes.length === 0}>
          <ResponsiveContainer>
            <BarChart data={dados.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => formatarReal(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="receitaBaixa" name="Baixa" stackId="a" fill={CORES_CATEGORIA.receitaBaixa} />
              <Bar dataKey="receitaMedia" name="Média" stackId="a" fill={CORES_CATEGORIA.receitaMedia} />
              <Bar dataKey="receitaAlta" name="Alta" stackId="a" fill={CORES_CATEGORIA.receitaAlta} />
              <Bar dataKey="receitaPremium" name="Premium" stackId="a" fill={CORES_CATEGORIA.receitaPremium} />
              <Bar dataKey="receitaVideo" name="Vídeo" stackId="a" fill={CORES_CATEGORIA.receitaVideo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Receita total por mês" vazio={dados.porMes.length === 0}>
          <ResponsiveContainer>
            <BarChart data={dados.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => formatarReal(v)} />
              <Bar dataKey="receitaTotal" fill={VERMELHO} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Rostos reconhecidos por mês" vazio={dados.porMes.length === 0}>
          <ResponsiveContainer>
            <LineChart data={dados.porMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatarMes} />
              <Line type="monotone" dataKey="rostosReconhecidos" stroke={CINZA} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Valor bruto total (compradores)" vazio={dados.compradoresPorMes.length === 0}>
          <ResponsiveContainer>
            <LineChart data={dados.compradoresPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => formatarReal(v)} />
              <Line type="monotone" dataKey="valorBrutoTotal" stroke={VERMELHO} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Ticket médio" vazio={dados.compradoresPorMes.length === 0}>
          <ResponsiveContainer>
            <LineChart data={dados.compradoresPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => formatarReal(v)} />
              <Line type="monotone" dataKey="ticketMedio" stroke={CINZA} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="% de compradores recorrentes (no mês)" vazio={dados.compradoresPorMes.length === 0}>
          <ResponsiveContainer>
            <LineChart data={dados.compradoresPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={formatarMes} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip labelFormatter={formatarMes} formatter={(v) => `${v?.toFixed(1)}%`} />
              <Line type="monotone" dataKey="taxaRecompraMes" stroke={VERMELHO} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </PainelGrafico>

        <PainelGrafico titulo="Clima × receita (por evento)" vazio={dados.climaXReceita.length === 0}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="precipitacaoMm"
                name="Chuva"
                unit="mm"
                tick={{ fontSize: 12 }}
                label={{ value: 'Precipitação (mm)', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="valorTotalVendido"
                name="Receita"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `R$${v}`}
              />
              <Tooltip formatter={(v, name) => (name === 'Receita' ? formatarReal(v) : `${v}mm`)} />
              <Scatter data={dados.climaXReceita} fill={VERMELHO} />
            </ScatterChart>
          </ResponsiveContainer>
          {dados.climaXReceita.length > 0 && dados.climaXReceita.length < 10 && (
            <p className="text-xs text-slate-400 mt-2">Amostra ainda pequena ({dados.climaXReceita.length} eventos) — leia com cautela.</p>
          )}
        </PainelGrafico>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Distribuição de frequência de compra</h2>
        <div className="flex items-center gap-3">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            {meses.map((m) => (
              <option key={m.mes_referencia} value={m.mes_referencia.slice(0, 7)}>
                {formatarMes(m.mes_referencia)}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-20 px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <GraficoFrequencia titulo={`Mês: ${mesSelecionado ? formatarMes(`${mesSelecionado}-01`) : '—'}`} distribuicao={snapshotMes?.distribuicao_frequencia} />
        <GraficoFrequencia titulo={`Ano: ${ano}`} distribuicao={distribuicaoAno} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Resumo completo exportável</h2>
        <p className="text-xs text-slate-400 mb-4">
          Mês a mês e ano a ano — eventos, compradores, previsão e distribuição de frequência de compra por ano. Pronto pra colar em
          outra conversa.
        </p>
        <button
          type="button"
          onClick={handleGerarResumo}
          disabled={gerandoResumo}
          className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {gerandoResumo ? 'Gerando...' : 'Gerar resumo'}
        </button>
        {resumoTexto && (
          <div className="mt-4">
            <textarea readOnly value={resumoTexto} rows={24} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs" />
            <button
              type="button"
              onClick={handleCopiar}
              className="mt-2 bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

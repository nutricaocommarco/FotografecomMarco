import React, { useEffect, useMemo, useState } from 'react';
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
const CORES_CATEGORIA = { receitaBaixa: '#cbd5e1', receitaMedia: '#94a3b8', receitaAlta: '#ef4444', receitaPremium: '#b91c1c' };

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

function montarResumoMarkdown({ mesSelecionado, linhaEventos, snapshot, previsao, mesAtualStr }) {
  const linhas = [`# Resumo — ${formatarMes(`${mesSelecionado}-01`)}`, ''];

  if (linhaEventos) {
    linhas.push(
      '## Eventos',
      `- Fotos enviadas: ${linhaEventos.fotosEnviadas}`,
      `- Fotos vendidas: ${linhaEventos.fotosVendidas}`,
      `- Taxa de conversão: ${linhaEventos.taxaConversao != null ? linhaEventos.taxaConversao.toFixed(1) + '%' : '—'}`,
      `- Receita total: ${formatarReal(linhaEventos.receitaTotal)}`,
      `- Receita por categoria: Baixa ${formatarReal(linhaEventos.receitaBaixa)} · Média ${formatarReal(linhaEventos.receitaMedia)} · Alta ${formatarReal(linhaEventos.receitaAlta)} · Premium ${formatarReal(linhaEventos.receitaPremium)}`,
      `- Rostos reconhecidos: ${linhaEventos.rostosReconhecidos}`,
      '',
    );
  } else {
    linhas.push('## Eventos', '- Sem eventos registrados nesse mês.', '');
  }

  if (snapshot) {
    const freq = Object.entries(snapshot.distribuicao_frequencia || {})
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([q, c]) => `${q}x: ${c}`)
      .join(', ');
    linhas.push(
      '## Compradores',
      `- Transações: ${snapshot.total_transacoes}`,
      `- Compradores únicos: ${snapshot.total_compradores_unicos}`,
      `- Valor bruto total: ${formatarReal(snapshot.valor_bruto_total)}`,
      `- Ticket médio: ${formatarReal(snapshot.ticket_medio)}`,
      `- Taxa de recompra no mês: ${snapshot.taxa_recompra_mes.toFixed(1)}%`,
      `- Novos / recorrentes: ${snapshot.compradores_novos} / ${snapshot.compradores_recorrentes}`,
      `- Distribuição de frequência: ${freq || '—'}`,
      '',
    );
  } else {
    linhas.push('## Compradores', '- Nenhum CSV importado pra esse mês.', '');
  }

  if (mesSelecionado === mesAtualStr && previsao) {
    linhas.push('## Previsão (mês em andamento)');
    if (previsao.confiavel) {
      linhas.push(
        `- Receita registrada até hoje (dia ${previsao.dia_hoje}): ${formatarReal(previsao.receita_registrada)}`,
        `- Projeção do mês: mínimo ${formatarReal(previsao.previsao.minimo)} · médio ${formatarReal(previsao.previsao.medio)} · máximo ${formatarReal(previsao.previsao.maximo)}`,
        `- Baseado em ${previsao.meses_fechados} mês(es) fechado(s)${previsao.ajuste_clima_ativo ? ', com ajuste por clima' : ''}.`,
      );
    } else {
      linhas.push(`- Histórico insuficiente pra previsão confiável (${previsao.meses_fechados} mês(es) fechado(s), mínimo 3).`);
    }
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

  const linhaEventosDoMes = useMemo(
    () => dados?.porMes.find((m) => m.mes === mesSelecionado) || null,
    [dados, mesSelecionado],
  );

  function handleGerarResumo() {
    setResumoTexto(
      montarResumoMarkdown({ mesSelecionado, linhaEventos: linhaEventosDoMes, snapshot: snapshotMes, previsao, mesAtualStr }),
    );
    setCopiado(false);
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
              <Bar dataKey="receitaPremium" name="Premium" stackId="a" fill={CORES_CATEGORIA.receitaPremium} radius={[4, 4, 0, 0]} />
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

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Distribuição de frequência de compra</h2>
        <div className="flex items-center gap-3">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
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
            className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <GraficoFrequencia titulo={`Mês: ${mesSelecionado ? formatarMes(`${mesSelecionado}-01`) : '—'}`} distribuicao={snapshotMes?.distribuicao_frequencia} />
        <GraficoFrequencia titulo={`Ano: ${ano}`} distribuicao={distribuicaoAno} />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
          Resumo mensal exportável — {mesSelecionado ? formatarMes(`${mesSelecionado}-01`) : '—'}
        </h2>
        <button type="button" onClick={handleGerarResumo} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">
          Gerar resumo
        </button>
        {resumoTexto && (
          <div className="mt-4">
            <textarea readOnly value={resumoTexto} rows={12} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs" />
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

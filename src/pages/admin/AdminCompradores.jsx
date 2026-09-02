import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';

function formatarMes(mesReferencia) {
  const [ano, mes] = mesReferencia.split('-');
  return new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatarReal(v) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function TabelaFrequencia({ distribuicao }) {
  const entradas = Object.entries(distribuicao || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
  if (entradas.length === 0) return <p className="text-sm text-slate-400">Sem dados.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-400">
          <th className="pb-2">Compras no período</th>
          <th className="pb-2">Compradores</th>
        </tr>
      </thead>
      <tbody>
        {entradas.map(([qtd, compradores]) => (
          <tr key={qtd} className="border-t border-slate-100">
            <td className="py-1.5">{qtd}</td>
            <td className="py-1.5">{compradores}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminCompradores() {
  const [arquivo, setArquivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const [meses, setMeses] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [snapshotMes, setSnapshotMes] = useState(null);

  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [distribuicaoAno, setDistribuicaoAno] = useState(null);

  function carregarMeses() {
    adminApi.listCompradores().then((lista) => {
      setMeses(lista);
      if (lista.length > 0 && !mesSelecionado) setMesSelecionado(lista[0].mes_referencia.slice(0, 7));
    });
  }

  useEffect(carregarMeses, []);

  useEffect(() => {
    if (!mesSelecionado) return;
    adminApi.compradoresDoMes(mesSelecionado).then(setSnapshotMes);
  }, [mesSelecionado]);

  useEffect(() => {
    if (!ano) return;
    adminApi.compradoresDoAno(ano).then((r) => setDistribuicaoAno(r.distribuicao_frequencia));
  }, [ano]);

  async function handleImportar(e) {
    e.preventDefault();
    if (!arquivo) return;
    setImportando(true);
    setErro('');
    setResultado(null);
    try {
      const csvText = await arquivo.text();
      const r = await adminApi.importarCompradores(csvText, arquivo.name);
      setResultado(r);
      setArquivo(null);
      carregarMeses();
    } catch (err) {
      setErro(err.message);
    } finally {
      setImportando(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-2xl font-black uppercase italic mb-8">Compradores</h1>

        <form onSubmit={handleImportar} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Importar CSV de vendas (Pagar.me)</h2>
          <p className="text-xs text-slate-400">
            O CPF nunca é guardado — só um hash irreversível, pra identificar compradores recorrentes entre meses. O mês é detectado
            automaticamente pela data de cada linha; reimportar substitui os dados dos meses presentes no arquivo.
          </p>
          <input type="file" accept=".csv" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="block text-sm" />
          <button
            type="submit"
            disabled={!arquivo || importando}
            className="bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase disabled:opacity-60"
          >
            {importando ? 'Importando...' : 'Importar'}
          </button>
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          {resultado && (
            <div className="text-sm text-slate-600 border-t border-slate-100 pt-3">
              <p className="font-bold">{resultado.linhas_processadas} linha(s) processadas.</p>
              {resultado.meses_afetados.map((mes) => (
                <p key={mes}>
                  {formatarMes(mes)}: {resultado.por_mes[mes].total_transacoes} transações · {formatarReal(resultado.por_mes[mes].valor_bruto_total)}{' '}
                  · {resultado.por_mes[mes].linhas_sem_cpf_valido} sem CPF válido
                </p>
              ))}
            </div>
          )}
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Estatísticas do mês</h2>
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
        </div>

        {snapshotMes ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-400">Transações</p>
                <p className="text-lg font-black">{snapshotMes.total_transacoes}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Compradores únicos</p>
                <p className="text-lg font-black">{snapshotMes.total_compradores_unicos}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Valor bruto total</p>
                <p className="text-lg font-black">{formatarReal(snapshotMes.valor_bruto_total)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Ticket médio</p>
                <p className="text-lg font-black">{formatarReal(snapshotMes.ticket_medio)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Taxa de recompra no mês</p>
                <p className="text-lg font-black">{snapshotMes.taxa_recompra_mes.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Novos / recorrentes</p>
                <p className="text-lg font-black">
                  {snapshotMes.compradores_novos} / {snapshotMes.compradores_recorrentes}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400 mb-2">Meio de pagamento</p>
              <div className="flex gap-4 text-sm">
                {Object.entries(snapshotMes.distribuicao_pagamento || {}).map(([meio, qtd]) => (
                  <span key={meio}>
                    {meio}: <strong>{qtd}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-slate-400 mb-2">Distribuição de frequência de compra (mês)</p>
              <TabelaFrequencia distribuicao={snapshotMes.distribuicao_frequencia} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nenhum mês importado ainda.</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Distribuição de frequência (ano)</h2>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <TabelaFrequencia distribuicao={distribuicaoAno} />
        </div>
      </div>
    </div>
  );
}

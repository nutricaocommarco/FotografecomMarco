const BASE = 'https://www.fotografecommarco.com';
const SENHA = process.env.ADMIN_PW;

const texto = `277384 - Treino NA PRAINHA 30-AGO-2026 @fotografecommarco	30/08/2026	R$ 737,30	R$ 737,30	48
277010 - Treino PRAINHA 29-AGO-2026 @fotografecommarco	29/08/2026	R$ 637,10	R$ 637,10	41
274759 - Treino PRAINHA 23-AGO-2026 @fotografecommarco	23/08/2026	R$ 697,00	R$ 697,00	44
274363 - Treino PRAINHA 22-AGO-2026 @fotografecommarco	22/08/2026	R$ 337,36	R$ 337,36	24
272089 - Treino PRAINHA 16-AGO-2026 @fotografecommarco	16/08/2026	R$ 1.012,59	R$ 1.012,59	62
271636 - Treino PRAINHA 15-AGO-2026 @fotografecommarco	15/08/2026	R$ 660,83	R$ 660,83	42
269517 - Treino PRAINHA 09-AGO-2026 @fotografecommarco	09/08/2026	R$ 971,31	R$ 971,31	66
267023 - Treino PRAINHA 02-AGO-2026 @fotografecommarco	02/08/2026	R$ 864,61	R$ 864,61	56
266594 - Treino PRAINHA 01-AGO-2026 @fotografecommarco	01/08/2026	R$ 501,94	R$ 501,94	31
264339 - Treino PRAINHA 26-JUL-2026 @fotografecommarco	26/07/2026	R$ 1.072,49	R$ 1.072,49	69
263887 - Treino PRAINHA 25-JUL-2026 - TREINO PRAINHA @fotografecommarco	25/07/2026	R$ 429,64	R$ 429,64	27
261944 - Treino PRAINHA 19-JUL-2026 @fotografecommarco	19/07/2026	R$ 1.027,61	R$ 1.027,61	69
261565 - Treino PRAINHA 18-JUL-2026 @fotografecommarco	18/07/2026	R$ 352,78	R$ 352,78	22
259389 - Treino PRAINHA 12-JUL-2026 @fotografecommarco	12/07/2026	R$ 440,54	R$ 440,54	30
259097 - Treino PRAINHA 11-JUL-2026 @fotografecommarco	11/07/2026	R$ 837,49	R$ 837,49	52
254349 - Treino PRAINHA 28-JUN-2026 @fotografecommarco	28/06/2026	R$ 778,91	R$ 778,91	49
254018 - Treino PRAINHA 27-JUN-2026 @fotografecommarco	27/06/2026	R$ 629,61	R$ 629,61	39
251953 - Treino PRAINHA 21-JUN-2026 @fotografecommarco	21/06/2026	R$ 209,68	R$ 209,68	13
251597 - Treino PRAINHA 20-JUN-2026 @fotografecommarco	20/06/2026	R$ 522,49	R$ 522,49	38
249510 - Treino PRAINHA 14-JUN-2026 @fotografecommarco	14/06/2026	R$ 965,66	R$ 965,66	58
249200 - Treino PRAINHA 13-JUN-2026 @fotografecommarco	13/06/2026	R$ 554,87	R$ 554,87	36
247084 - Treino PRAINHA 07-JUN-2026 @fotografecommarco	07/06/2026	R$ 699,40	R$ 699,40	46
246695 - Treino PRAINHA 06-JUN-2026 @fotografecommarco	06/06/2026	R$ 743,86	R$ 743,86	49
243404 - Treino PRAINHA 30-MAIO-2026 @fotografecommarco	30/05/2026	R$ 589,92	R$ 589,92	38
241149 - TREINO PRAINHA 24-MAIO-2026 @fotografecommarco	24/05/2026	R$ 1.129,87	R$ 1.129,87	77
240710 - TREINO PRAINHA 23-MAIO-2026 @fotografecommarco	23/05/2026	R$ 744,82	R$ 744,82	51
238590 - TREINO PRAINHA 17-MAIO-2026 @fotografecommarco	17/05/2026	R$ 684,92	R$ 684,92	45
238214 - TREINO PRAINHA 16-MAIO-2026 @fotografecommarco	16/05/2026	R$ 798,13	R$ 798,13	54
236117 - TREINO PRAINHA 10-MAIO-2026 @fotografecommarco	10/05/2026	R$ 808,07	R$ 808,07	53
235816 - TREINO PRAINHA 09-MAIO-2026 @fotografecommarco	09/05/2026	R$ 746,61	R$ 746,61	50
233044 - TREINO PRAINHA 02-MAIO-2026 @fotografecommarco	02/05/2026	R$ 509,73	R$ 509,73	34
230849 - TREINO PRAINHA 26-ABR-2026 @fotografecommarco	26/04/2026	R$ 660,70	R$ 660,70	44
230488 - TREINO PRAINHA 25-ABR-2026 @fotografecommarco	25/04/2026	R$ 975,02	R$ 975,02	67
229673 - TREINO PRAINHA 23-ABR-2026 @fotografecommarco	23/04/2026	R$ 889,07	R$ 889,07	61
228899 - TREINO PRAINHA 21-ABR-2026 @fotografecommarco	21/04/2026	R$ 903,67	R$ 903,67	64
228016 - TREINO PRAINHA 19-ABR-2026 @fotografecommarco	19/04/2026	R$ 1.015,82	R$ 1.015,82	66
227636 - TREINO PRAINHA 18-ABR-2026 @fotografecommarco	18/04/2026	R$ 1.006,58	R$ 1.006,58	60
222410 - TREINO PRAINHA 05-ABR-2026 @fotografecommarco	05/04/2026	R$ 834,44	R$ 834,44	55
222090 - TREINO PRAINHA 04-ABR-2026 @fotografecommarco	04/04/2026	R$ 902,39	R$ 902,39	61
221745 - TREINO PRAINHA 03-ABR-2026 @fotografecommarco	03/04/2026	R$ 636,63	R$ 636,63	48
219872 - TREINO PRAINHA 29-MAR-2026 @fotografecommarco	29/03/2026	R$ 1.838,45	R$ 1.838,45	128
219487 - TREINO PRAINHA 28-MAR-2026 @fotografecommarco	28/03/2026	R$ 947,97	R$ 947,97	70
217263 - TREINO PRAINHA 22-MAR-2026 @fotografecommarco	22/03/2026	R$ 960,38	R$ 960,38	70
216862 - TREINO PRAINHA 21-MAR-2026 @fotografecommarco	21/03/2026	R$ 910,61	R$ 910,61	63
214434 - TREINO PRAINHA 15-MAR-2026 @fotografecommarco	15/03/2026	R$ 1.139,16	R$ 1.139,16	83
214047 - TREINO PRAINHA 14-MAR-2026 @fotografecommarco	14/03/2026	R$ 611,55	R$ 611,55	45
211796 - TREINO PRAINHA 08-MAR-2026 @fotografecommarco	08/03/2026	R$ 1.000,56	R$ 1.000,56	76
211428 - TREINO PRAINHA 07-MAR-2026 @fotografecommarco	07/03/2026	R$ 876,77	R$ 876,77	62
209062 - TREINO PRAINHA 01-MAR-2026 @fotografecommarco	01/03/2026	R$ 1.195,14	R$ 1.195,14	85
208719 - TREINO PRAINHA 28-FEV-2026 @fotografecommarco	28/02/2026	R$ 1.114,55	R$ 1.114,55	83
206422 - TREINO PRAINHA 22-FEV-2026 @fotografecommarco	22/02/2026	R$ 722,75	R$ 722,75	52
206057 - TREINO PRAINHA 21-FEV-2026 - @fotografecommarco	21/02/2026	R$ 395,83	R$ 395,83	30
204669 - TREINO PRAINHA 17-FEV-2026 @fotografecommarco	17/02/2026	R$ 484,40	R$ 484,40	33
204377 - TREINO PRAINHA 16-FEV-2026 @fotografecommarco	16/02/2026	R$ 418,06	R$ 418,06	29
204086 - TREINO PRAINHA 15-FEV-2026 @fotografecommarco	15/02/2026	R$ 701,99	R$ 701,99	51
203784 - TREINO PRAINHA 14-FEV-2026 @fotografecommarco	14/02/2026	R$ 962,91	R$ 962,91	67
200969 - TREINO PRAINHA 07-FEV-2026 @fotografecommarco	07/02/2026	R$ 967,59	R$ 967,59	68
198066 - TREINO PRAINHA 01-FEV-2026 @fotografecommarco	01/02/2026	R$ 801,19	R$ 801,19	60
197680 - TREINO PRAINHA 31-JAN-2026 @fotografecommarco	31/01/2026	R$ 808,13	R$ 808,13	54
194816 - TREINO PRAINHA 24-JAN-2026 @fotografecommarco	24/01/2026	R$ 616,95	R$ 616,95	43
192730 - TREINO PRAINHA 18-JAN-2026 @fotografecommarco	18/01/2026	R$ 1.009,73	R$ 1.009,73	71
192420 - TREINO PRAINHA 17-JAN-2026 @fotografecommarco	17/01/2026	R$ 1.239,07	R$ 1.239,07	81
190174 - TREINO PRAINHA 11-JAN-2026 @fotografecommarco	11/01/2026	R$ 719,74	R$ 719,74	55
189896 - TREINO PRAINHA 10-JAN-2026 @fotografecommarco	10/01/2026	R$ 771,45	R$ 771,45	51
187502 - TREINO PRAINHA 04-JAN-2026 @fotografecommarco	04/01/2026	R$ 617,41	R$ 617,41	43
187174 - TREINO PRAINHA 03-JAN-2026 @fotografecommarco	03/01/2026	R$ 637,72	R$ 637,72	44`;

function parseValorReal(str) {
  const limpo = str.replace(/R\$\s*/i, '').trim();
  return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
}

const relatorio = new Map();
for (const linha of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
  const partes = linha.split('\t');
  const [, dataStr] = partes;
  const [dia, mes, ano] = dataStr.split('/');
  const data = `${ano}-${mes}-${dia}`;
  const valor = parseValorReal(partes[2]);
  const qtd = parseInt(partes[4], 10);
  relatorio.set(data, { valor, qtd });
}
console.log(`Relatório colado: ${relatorio.size} eventos`);

const loginRes = await fetch(`${BASE}/api/admin-auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: SENHA }),
});
const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];

const res = await fetch(`${BASE}/api/admin-eventos`, { headers: { Cookie: cookie } });
const eventosDb = await res.json();
const porData = new Map(eventosDb.map((e) => [e.data, e]));

console.log('\n=== Comparação (data | valor relatório vs banco | fotos relatório vs banco) ===');
let semCorrespondencia = 0;
let valorDivergente = 0;
let fotosDivergente = 0;
let semDadosNoBanco = 0;

for (const [data, { valor, qtd }] of [...relatorio].sort()) {
  const evDb = porData.get(data);
  if (!evDb) { console.log(`${data}: SEM EVENTO NO BANCO (relatório diz R$${valor}, ${qtd} fotos)`); semCorrespondencia++; continue; }

  const valorDb = evDb.valor_total_vendido;
  const fotosDb = evDb.fotos_vendidas_total;

  if (valorDb == null && fotosDb == null) { semDadosNoBanco++; continue; }

  const valorBate = valorDb != null && Math.abs(valorDb - valor) < 0.01;
  const fotosBatem = fotosDb != null && fotosDb === qtd;

  if (!valorBate || !fotosBatem) {
    console.log(
      `${data}: valor relatório=R$${valor} banco=${valorDb ?? '—'} ${valorBate ? 'OK' : 'DIVERGE'} | ` +
        `fotos relatório=${qtd} banco=${fotosDb ?? '—'} ${fotosBatem ? 'OK' : 'DIVERGE'}`,
    );
    if (!valorBate) valorDivergente++;
    if (!fotosBatem) fotosDivergente++;
  }
}

console.log(`\nResumo: ${semCorrespondencia} sem evento no banco, ${semDadosNoBanco} eventos no banco sem vendas ainda, ${valorDivergente} valores divergentes, ${fotosDivergente} contagens de fotos divergentes.`);

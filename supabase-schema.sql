-- Rode isso no SQL Editor do Supabase (projeto novo e separado do EvaluaOS),
-- assim que o projeto for criado.

create table coberturas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  local text default 'treino-prainha',
  data_evento date not null,
  foto_capa text,
  obs text,
  data_saida_do_ar date,
  link_principal text not null,
  galerias jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table avisos_em_breve (
  id uuid primary key default gen_random_uuid(),
  evento text not null,
  data_evento date,
  previsao_horario text not null,
  obs text,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table inscricoes_em_breve (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid references avisos_em_breve(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

create table metas_progresso (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  percentual int not null default 0,
  prazo text,
  link text,
  link_label text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- RLS: leitura pública (o site busca coberturas/avisos/metas ativos direto do navegador),
-- escrita só via Vercel Functions com a service_role key (que ignora RLS).
alter table coberturas enable row level security;
alter table avisos_em_breve enable row level security;
alter table inscricoes_em_breve enable row level security;
alter table metas_progresso enable row level security;

create policy "Leitura pública de coberturas" on coberturas for select using (true);
create policy "Leitura pública de avisos" on avisos_em_breve for select using (true);
create policy "Leitura pública de metas" on metas_progresso for select using (true);

-- Inscrição em "Em Breve": qualquer visitante pode inserir o próprio e-mail, mas não ler a lista.
create policy "Inserção pública de inscrição" on inscricoes_em_breve for insert with check (true);

-- Sem isso, mesmo com RLS liberando a leitura, o papel "anon" (navegador) leva
-- "permission denied": RLS controla LINHAS, mas o GRANT controla a TABELA em si.
grant select on coberturas, avisos_em_breve, metas_progresso to anon, authenticated;
grant insert on inscricoes_em_breve to anon, authenticated;

-- service_role (usado só no servidor) precisa de acesso total pra o /admin funcionar.
grant all on coberturas, avisos_em_breve, inscricoes_em_breve, metas_progresso to service_role;

-- ============================================================
-- Sistema de Relatórios e Dashboard (uso 100% administrativo —
-- nenhuma dessas tabelas é lida pelo site público, então nenhuma
-- tem policy de leitura pública, só acesso via service_role).
-- ============================================================

create table relatorio_eventos (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  foi_fotografar boolean not null default true,
  motivo_nao_foi text,
  horario_chegada time,
  horario_saida time,
  clima_condicoes text[] default '{}',
  clima_fonte text, -- 'manual' | 'auto'
  clima_temperatura_max numeric,
  clima_temperatura_min numeric,
  clima_precipitacao_mm numeric,
  clima_vento_kmh_max numeric,
  rostos_reconhecidos int,
  camera text,
  preco_baixa numeric,
  preco_media numeric,
  preco_alta numeric,
  preco_premium numeric,
  fotos_enviadas int,
  fotos_vendidas_total int,
  vendas_baixa_qtd int,
  vendas_baixa_valor numeric,
  vendas_media_qtd int,
  vendas_media_valor numeric,
  vendas_alta_qtd int,
  vendas_alta_valor numeric,
  vendas_premium_qtd int,
  vendas_premium_valor numeric,
  vendas_video_qtd int,
  vendas_video_valor numeric,
  valor_total_vendido numeric,
  divulgacao text[] default '{}', -- nenhuma | stories | post | grupo_whatsapp | outro
  divulgacao_obs text,
  concorrencia boolean,
  concorrencia_obs text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Uma linha por transação do CSV de vendas. Nunca guarda CPF, nome, endereço
-- ou e-mail — só o hash do CPF, pra identificar recompra entre meses.
-- cpf_hash fica null quando a linha do CSV não tinha um CPF válido (ainda
-- assim entra nos totais de transações/valor, só fica de fora das métricas
-- por comprador).
create table compras_hash (
  id uuid primary key default gen_random_uuid(),
  cpf_hash text,
  mes_referencia date not null,
  data_pagamento timestamptz not null,
  valor_bruto numeric not null,
  meio_pagamento text,
  codigo_servico text,
  created_at timestamptz default now()
);
create index compras_hash_cpf_hash_idx on compras_hash (cpf_hash);
create index compras_hash_mes_referencia_idx on compras_hash (mes_referencia);

-- Snapshot calculado por mês a partir de compras_hash. Recalculado do zero
-- (substituição completa do mês) toda vez que um import tocar aquele mês.
create table importacoes_compradores (
  id uuid primary key default gen_random_uuid(),
  mes_referencia date not null unique,
  total_transacoes int not null default 0,
  total_compradores_unicos int not null default 0,
  valor_bruto_total numeric not null default 0,
  ticket_medio numeric not null default 0,
  taxa_recompra_mes numeric not null default 0,
  compradores_novos int not null default 0,
  compradores_recorrentes int not null default 0,
  distribuicao_pagamento jsonb default '{}'::jsonb,
  distribuicao_frequencia jsonb default '{}'::jsonb,
  linhas_sem_cpf_valido int not null default 0,
  ultimo_arquivo text,
  atualizado_em timestamptz default now()
);

-- Cache do clima histórico (Open-Meteo) por data, pra não rechamar a API
-- pra uma data já buscada.
create table clima_historico (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  temperatura_max numeric,
  temperatura_min numeric,
  precipitacao_mm numeric,
  vento_kmh_max numeric,
  weathercode int,
  condicoes text[] default '{}',
  created_at timestamptz default now()
);

alter table relatorio_eventos enable row level security;
alter table compras_hash enable row level security;
alter table importacoes_compradores enable row level security;
alter table clima_historico enable row level security;

-- Sem policy pública nenhuma — só o service_role (usado nas Vercel Functions
-- do /admin) acessa essas tabelas.
grant all on relatorio_eventos, compras_hash, importacoes_compradores, clima_historico to service_role;

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

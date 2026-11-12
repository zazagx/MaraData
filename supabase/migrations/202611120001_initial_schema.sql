-- MaraData: esquema inicial remoto (PostgreSQL / Supabase)
-- Execute no SQL Editor do Supabase ou aplique com a Supabase CLI.
-- IDs são TEXT porque os dispositivos geram identificadores offline.

begin;

create table if not exists public.participants (
  id text primary key,
  nome text not null,
  nome_normalizado text not null,
  data_nascimento date not null,
  genero text not null,
  escolaridade text not null,
  mercado_games text not null default '',
  interesse_profissional_games text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_participants_nome_normalizado
  on public.participants (nome_normalizado);
create index if not exists idx_participants_data_nascimento
  on public.participants (data_nascimento);
create index if not exists idx_participants_identidade
  on public.participants (nome_normalizado, data_nascimento);

create table if not exists public.games (
  id text primary key,
  nome text not null,
  nome_normalizado text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participant_games (
  participant_id text not null references public.participants(id) on delete cascade,
  game_id text not null references public.games(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (participant_id, game_id)
);

create table if not exists public.events (
  id text primary key,
  nome_evento text not null,
  local_evento text not null,
  data_inicio date not null,
  data_termino date,
  horario_inicio time not null,
  horario_termino time,
  descricao text not null default '',
  situacao text not null check (situacao in ('agendado', 'em_andamento', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  encerrado_em timestamptz,
  constraint chk_evento_datas check (data_termino is null or data_termino >= data_inicio)
);
create index if not exists idx_events_situacao_data
  on public.events (situacao, data_inicio);
create unique index if not exists idx_events_unico_em_andamento
  on public.events (situacao) where situacao = 'em_andamento';

-- Uma mesma pessoa pode participar de muitos eventos. Os campos *_snapshot
-- preservam o que foi informado naquele evento, mesmo se o cadastro global mudar.
create table if not exists public.event_participants (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  participant_id text not null references public.participants(id) on delete restrict,
  nome_snapshot text not null,
  data_nascimento_snapshot date not null,
  genero_snapshot text not null,
  escolaridade_snapshot text not null,
  mercado_games text not null default '',
  interesse_profissional_games text not null default '',
  registered_at timestamptz not null default now(),
  unique (event_id, participant_id)
);
create index if not exists idx_event_participants_event
  on public.event_participants (event_id);
create index if not exists idx_event_participants_person
  on public.event_participants (participant_id);

-- As escolhas de jogos são guardadas por participação, para que as estatísticas
-- de cada evento não sejam alteradas por preferências registradas posteriormente.
create table if not exists public.event_participant_games (
  event_participant_id text not null references public.event_participants(id) on delete cascade,
  game_id text not null references public.games(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (event_participant_id, game_id)
);

create table if not exists public.event_queues (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  nome text not null,
  status text not null check (status in ('ativa', 'encerrada')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists idx_event_queues_event
  on public.event_queues (event_id);

create table if not exists public.queue_entries (
  id text primary key,
  queue_id text not null references public.event_queues(id) on delete cascade,
  event_participant_id text not null references public.event_participants(id) on delete restrict,
  ticket_number text not null,
  sequence_number integer not null check (sequence_number > 0),
  status text not null check (status in ('aguardando', 'atendido')),
  added_at timestamptz not null default now(),
  called_at timestamptz,
  unique (queue_id, ticket_number),
  unique (queue_id, sequence_number),
  unique (queue_id, event_participant_id)
);
create index if not exists idx_queue_entries_queue_sequence
  on public.queue_entries (queue_id, sequence_number);

-- Estatísticas são derivadas dos registros originais. Não duplicamos os totais
-- em tabelas que poderiam ficar inconsistentes.
create or replace view public.event_statistics
with (security_invoker = true)
as
with participant_totals as (
  select event_id, count(*)::bigint as participantes
  from public.event_participants
  group by event_id
),
queue_totals as (
  select event_id, count(*)::bigint as filas
  from public.event_queues
  group by event_id
),
entry_totals as (
  select
    q.event_id,
    count(qe.id)::bigint as entradas_fila,
    count(qe.id) filter (where qe.status = 'atendido')::bigint as atendimentos,
    count(qe.id) filter (where qe.status = 'aguardando')::bigint as aguardando
  from public.event_queues q
  left join public.queue_entries qe on qe.queue_id = q.id
  group by q.event_id
)
select
  e.id as event_id,
  e.nome_evento,
  e.situacao,
  coalesce(pt.participantes, 0)::bigint as participantes,
  coalesce(qt.filas, 0)::bigint as filas,
  coalesce(et.entradas_fila, 0)::bigint as entradas_fila,
  coalesce(et.atendimentos, 0)::bigint as atendimentos,
  coalesce(et.aguardando, 0)::bigint as aguardando
from public.events e
left join participant_totals pt on pt.event_id = e.id
left join queue_totals qt on qt.event_id = e.id
left join entry_totals et on et.event_id = e.id;

create or replace view public.event_game_statistics
with (security_invoker = true)
as
select
  ep.event_id,
  g.id as game_id,
  g.nome as jogo,
  count(*)::bigint as selecoes
from public.event_participant_games epg
join public.event_participants ep on ep.id = epg.event_participant_id
join public.games g on g.id = epg.game_id
group by ep.event_id, g.id, g.nome;

create or replace view public.global_statistics
with (security_invoker = true)
as
select
  (select count(*) from public.participants)::bigint as participantes_cadastrados,
  (select count(*) from public.games)::bigint as jogos_cadastrados,
  (select count(*) from public.events)::bigint as total_eventos,
  (select count(*) from public.events where situacao = 'agendado')::bigint as eventos_agendados,
  (select count(*) from public.events where situacao = 'em_andamento')::bigint as eventos_em_andamento,
  (select count(*) from public.events where situacao = 'encerrado')::bigint as eventos_encerrados,
  (select count(*) from public.event_participants)::bigint as participacoes,
  (select count(*) from public.queue_entries)::bigint as entradas_fila,
  (select count(*) from public.queue_entries where status = 'atendido')::bigint as atendimentos;

-- A tabela de dispositivos fica em schema privado e será usada pela futura
-- Edge Function de sincronização. Nenhum token bruto será guardado, apenas hash.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.sync_devices (
  id text primary key,
  descricao text not null,
  token_hash text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz
);
alter table private.sync_devices enable row level security;
revoke all on table private.sync_devices from public, anon, authenticated;
grant all on table private.sync_devices to service_role;

-- Importante: sem login, as tabelas NÃO ficam abertas à role anon.
-- A sincronização remota será feita por Edge Functions que validam um token
-- por dispositivo e usam a service_role somente no servidor.
alter table public.participants enable row level security;
alter table public.games enable row level security;
alter table public.participant_games enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_participant_games enable row level security;
alter table public.event_queues enable row level security;
alter table public.queue_entries enable row level security;

revoke all on table
  public.participants,
  public.games,
  public.participant_games,
  public.events,
  public.event_participants,
  public.event_participant_games,
  public.event_queues,
  public.queue_entries,
  public.event_statistics,
  public.event_game_statistics,
  public.global_statistics
from anon, authenticated;

grant all on table
  public.participants,
  public.games,
  public.participant_games,
  public.events,
  public.event_participants,
  public.event_participant_games,
  public.event_queues,
  public.queue_entries
 to service_role;

grant select on table
  public.event_statistics,
  public.event_game_statistics,
  public.global_statistics
 to service_role;

commit;

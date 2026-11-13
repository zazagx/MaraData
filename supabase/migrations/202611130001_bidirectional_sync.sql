-- MaraData: tabelas complementares + permissões para sincronização direta
-- autenticada (conta compartilhada da equipe). Não concede acesso à role anon.
-- Execute uma única vez no SQL Editor do Supabase.

begin;

-- Tabelas presentes no SQLite (migração local v3), mas ausentes na migração remota inicial.
create table if not exists public.event_days (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  event_date date not null,
  status text not null check (status in ('nao_iniciado', 'em_andamento', 'concluido', 'nao_realizado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (event_id, day_number),
  unique (event_id, event_date)
);
create index if not exists idx_event_days_event_date
  on public.event_days(event_id, event_date);
create unique index if not exists idx_event_days_one_active
  on public.event_days(event_id) where status = 'em_andamento';

create table if not exists public.event_participant_days (
  id text primary key,
  event_day_id text not null references public.event_days(id) on delete cascade,
  event_participant_id text not null references public.event_participants(id) on delete cascade,
  source text not null check (source in ('manual', 'fila')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_day_id, event_participant_id)
);
create index if not exists idx_event_participant_days_participant
  on public.event_participant_days(event_participant_id);

create table if not exists public.event_feedback (
  id text primary key,
  event_participant_id text not null unique references public.event_participants(id) on delete cascade,
  liked_event integer not null check (liked_event in (0, 1)),
  arena_rating integer not null check (arena_rating between 1 and 5),
  wanted_game integer not null check (wanted_game in (0, 1)),
  used_queue integer not null check (used_queue in (0, 1)),
  queue_rating integer check (queue_rating is null or queue_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((used_queue = 0 and queue_rating is null) or (used_queue = 1 and queue_rating is not null))
);

create table if not exists public.event_feedback_game_suggestions (
  id text primary key,
  feedback_id text not null references public.event_feedback(id) on delete cascade,
  game_name text not null,
  game_name_normalized text not null,
  created_at timestamptz not null default now(),
  unique (feedback_id, game_name_normalized)
);
create index if not exists idx_feedback_suggestions_name
  on public.event_feedback_game_suggestions(game_name_normalized);

-- A mesma validação de consistência entre evento/dia e inscrição que existe no SQLite.
create or replace function public.validar_event_participant_day_mesmo_evento()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
      from public.event_days d
      join public.event_participants ep on ep.id = new.event_participant_id
     where d.id = new.event_day_id
       and d.event_id = ep.event_id
  ) then
    raise exception 'A presença e a inscrição precisam pertencer ao mesmo evento.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_participant_day_same_event on public.event_participant_days;
create trigger trg_event_participant_day_same_event
before insert or update on public.event_participant_days
for each row execute function public.validar_event_participant_day_mesmo_evento();

-- O app usa a sessão da conta compartilhada (role authenticated) para ler/gravar.
-- As tabelas continuam inacessíveis anonimamente; não colocar service_role no app.
do $$
declare
  tabela text;
  tabelas text[] := array[
    'participants', 'games', 'participant_games', 'events',
    'event_participants', 'event_participant_games', 'event_queues',
    'queue_entries', 'event_days', 'event_participant_days',
    'event_feedback', 'event_feedback_game_suggestions'
  ];
begin
  foreach tabela in array tabelas loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('revoke all on table public.%I from anon', tabela);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tabela);
    execute format('drop policy if exists maradata_authenticated_access on public.%I', tabela);
    execute format(
      'create policy maradata_authenticated_access on public.%I for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)',
      tabela
    );
  end loop;
end $$;

-- Views de estatística continuam obedecendo às políticas das tabelas-base.
grant select on table
  public.event_statistics,
  public.event_game_statistics,
  public.global_statistics
 to authenticated;

commit;

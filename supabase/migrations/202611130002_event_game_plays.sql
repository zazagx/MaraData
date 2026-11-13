-- MaraData: registra os jogos que cada participante realmente utilizou em cada dia.
-- Execute depois da migração bidirecional 202611130001.

begin;

create table if not exists public.event_game_plays (
  id text primary key,
  event_id text not null references public.events(id) on delete cascade,
  event_day_id text not null references public.event_days(id) on delete cascade,
  event_participant_id text not null references public.event_participants(id) on delete cascade,
  game_id text not null references public.games(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_day_id, event_participant_id, game_id)
);

create index if not exists idx_event_game_plays_event
  on public.event_game_plays(event_id);
create index if not exists idx_event_game_plays_day
  on public.event_game_plays(event_day_id);
create index if not exists idx_event_game_plays_game
  on public.event_game_plays(game_id);
create index if not exists idx_event_game_plays_participant
  on public.event_game_plays(event_participant_id);

create or replace function public.validar_event_game_play_mesmo_evento()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.event_days d
    join public.event_participants ep on ep.id = new.event_participant_id
    where d.id = new.event_day_id
      and d.event_id = new.event_id
      and ep.event_id = new.event_id
  ) then
    raise exception 'O jogo, o dia e o participante precisam pertencer ao mesmo evento.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_event_game_play_same_event on public.event_game_plays;
create trigger trg_event_game_play_same_event
before insert or update on public.event_game_plays
for each row execute function public.validar_event_game_play_mesmo_evento();

alter table public.event_game_plays enable row level security;
revoke all on table public.event_game_plays from public, anon;
grant select, insert, update, delete on table public.event_game_plays to authenticated;
grant all on table public.event_game_plays to service_role;
drop policy if exists maradata_authenticated_access on public.event_game_plays;
create policy maradata_authenticated_access
  on public.event_game_plays
  for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

commit;

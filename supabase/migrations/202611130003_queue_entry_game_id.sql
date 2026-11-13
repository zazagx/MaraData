-- MaraData: registra o dia e o jogo escolhido em cada entrada individual da fila.
-- Execute depois da migration 202611130002_event_game_plays.sql.

begin;

alter table public.queue_entries
  add column if not exists event_day_id text
  references public.event_days(id) on delete restrict;

alter table public.queue_entries
  add column if not exists game_id text
  references public.games(id) on delete restrict;

create index if not exists idx_queue_entries_day
  on public.queue_entries(event_day_id);

create index if not exists idx_queue_entries_game
  on public.queue_entries(game_id);

create or replace function public.validar_queue_entry_mesmo_evento()
returns trigger
language plpgsql
as $$
begin
  if new.event_day_id is not null and not exists (
    select 1
      from public.event_queues q
      join public.event_days d on d.id = new.event_day_id
      join public.event_participants ep on ep.id = new.event_participant_id
     where q.id = new.queue_id
       and d.event_id = q.event_id
       and ep.event_id = q.event_id
  ) then
    raise exception 'A fila, o dia e o participante precisam pertencer ao mesmo evento.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_queue_entry_same_event on public.queue_entries;
create trigger trg_queue_entry_same_event
before insert or update on public.queue_entries
for each row execute function public.validar_queue_entry_mesmo_evento();

commit;

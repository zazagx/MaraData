-- LIMPEZA DE DADOS DE TESTE DO MARADATA
-- Esta operação é destrutiva e não pode ser desfeita após COMMIT.
-- Preserva tabelas, views, políticas e o usuário compartilhado em auth.users.
-- Execute no SQL Editor do projeto Supabase correto, após conferir que este é o ambiente de testes.

begin;

truncate table
  public.event_game_plays,
  public.queue_entries,
  public.event_participant_days,
  public.event_feedback_game_suggestions,
  public.event_feedback,
  public.event_participant_games,
  public.event_queues,
  public.event_days,
  public.event_participants,
  public.participant_games,
  public.events,
  public.participants,
  public.games
restart identity cascade;

-- A tabela privada guarda apenas registros técnicos dos dispositivos usados pela
-- futura sincronização no servidor; também será reiniciada para zerar o ambiente.
truncate table private.sync_devices;

commit;

-- Conferência: todos os resultados abaixo devem ser zero.
select 'participants' as tabela, count(*) as registros from public.participants
union all select 'participant_games', count(*) from public.participant_games
union all select 'events', count(*) from public.events
union all select 'event_participants', count(*) from public.event_participants
union all select 'event_participant_games', count(*) from public.event_participant_games
union all select 'event_queues', count(*) from public.event_queues
union all select 'queue_entries', count(*) from public.queue_entries
union all select 'event_days', count(*) from public.event_days
union all select 'event_participant_days', count(*) from public.event_participant_days
union all select 'event_feedback', count(*) from public.event_feedback
union all select 'event_feedback_game_suggestions', count(*) from public.event_feedback_game_suggestions
union all select 'event_game_plays', count(*) from public.event_game_plays
union all select 'games', count(*) from public.games;

-- IMPORTANTE: não apague auth.users. A conta compartilhada da MaraGames permanece.

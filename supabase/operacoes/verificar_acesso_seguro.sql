-- Verifica RLS/ORGANIZAÇÃO da conta compartilhada. Consulta somente leitura.

-- Todas as tabelas operacionais devem mostrar RLS e FORCE RLS habilitados.
select
  c.relname as tabela,
  c.relrowsecurity as rls_habilitado,
  c.relforcerowsecurity as rls_forcado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'participants', 'games', 'participant_games', 'events',
    'event_participants', 'event_participant_games', 'event_queues',
    'queue_entries', 'event_days', 'event_participant_days',
    'event_feedback', 'event_feedback_game_suggestions', 'event_game_plays'
  )
order by c.relname;

-- Deve existir uma política maradata_conta_compartilhada para cada tabela.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'participants', 'games', 'participant_games', 'events',
    'event_participants', 'event_participant_games', 'event_queues',
    'queue_entries', 'event_days', 'event_participant_days',
    'event_feedback', 'event_feedback_game_suggestions', 'event_game_plays'
  )
order by tablename, policyname;

-- Deve mostrar a conta compartilhada e ativo = true.
select user_id, ativo, criado_em
from private.maradata_usuarios_autorizados;

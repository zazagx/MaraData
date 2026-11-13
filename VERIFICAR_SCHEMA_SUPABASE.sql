-- Execute no Supabase SQL Editor para confirmar se as 12 tabelas esperadas
-- pelo sincronizador existem no schema public e se o RLS está habilitado.
WITH esperadas(nome) AS (
  VALUES
    ('participants'),
    ('games'),
    ('participant_games'),
    ('events'),
    ('event_participants'),
    ('event_participant_games'),
    ('event_queues'),
    ('queue_entries'),
    ('event_days'),
    ('event_participant_days'),
    ('event_feedback'),
    ('event_feedback_game_suggestions')
)
SELECT
  e.nome AS tabela,
  (c.oid IS NOT NULL) AS existe,
  COALESCE(c.relrowsecurity, false) AS rls_habilitado,
  EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = e.nome
      AND 'authenticated' = ANY (p.roles::text[])
  ) AS possui_politica_authenticated
FROM esperadas e
LEFT JOIN pg_class c
  ON c.relname = e.nome
 AND c.relnamespace = 'public'::regnamespace
ORDER BY e.nome;

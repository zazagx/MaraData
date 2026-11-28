-- PROTEÇÃO DE ACESSO DO MARADATA PARA UMA CONTA COMPARTILHADA
-- Execute depois de copiar o UUID da conta da MaraGames em Auth > Users.
-- Primeiro execute este script. Depois execute autorizar_conta_compartilhada.sql
-- com o UUID real. Até autorizar a conta, o acesso aos dados fica bloqueado (fail-closed).

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.maradata_usuarios_autorizados (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
alter table private.maradata_usuarios_autorizados enable row level security;
revoke all on table private.maradata_usuarios_autorizados from public, anon, authenticated;
grant all on table private.maradata_usuarios_autorizados to service_role;

create or replace function public.maradata_usuario_autorizado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from private.maradata_usuarios_autorizados u
     where u.user_id = auth.uid()
       and u.ativo = true
  );
$$;
revoke all on function public.maradata_usuario_autorizado() from public, anon;
grant execute on function public.maradata_usuario_autorizado() to authenticated;

do $$
declare
  tabela text;
  politica record;
  tabelas text[] := array[
    'participants', 'games', 'participant_games', 'events',
    'event_participants', 'event_participant_games', 'event_queues',
    'queue_entries', 'event_days', 'event_participant_days',
    'event_feedback', 'event_feedback_game_suggestions', 'event_game_plays'
  ];
begin
  foreach tabela in array tabelas loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format('alter table public.%I force row level security', tabela);
    execute format('revoke all on table public.%I from public, anon', tabela);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', tabela);

    for politica in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = tabela
    loop
      execute format('drop policy %I on public.%I', politica.policyname, tabela);
    end loop;

    execute format(
      'create policy maradata_conta_compartilhada on public.%I for all to authenticated using (public.maradata_usuario_autorizado()) with check (public.maradata_usuario_autorizado())',
      tabela
    );
  end loop;
end $$;

-- Views precisam respeitar as políticas das tabelas base.
alter view public.event_statistics set (security_invoker = true);
alter view public.event_game_statistics set (security_invoker = true);
alter view public.global_statistics set (security_invoker = true);
revoke all on table public.event_statistics, public.event_game_statistics, public.global_statistics from public, anon;
grant select on table public.event_statistics, public.event_game_statistics, public.global_statistics to authenticated;

commit;

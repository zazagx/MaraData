-- Acrescenta os campos já coletados pelo formulário de participantes.
-- IF NOT EXISTS permite aplicar mesmo se a migração inicial já os contiver.
alter table public.participants
  add column if not exists mercado_games text not null default '';

alter table public.participants
  add column if not exists interesse_profissional_games text not null default '';

-- Índice de busca, sem tratar nome + nascimento como identidade única.
create index if not exists idx_participants_identidade
  on public.participants (nome_normalizado, data_nascimento);

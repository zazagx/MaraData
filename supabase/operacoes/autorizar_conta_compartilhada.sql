-- Substitua o UUID abaixo pelo ID da única conta compartilhada da MaraGames,
-- encontrado em Supabase Dashboard > Authentication > Users.
-- O UUID não é senha nem chave privada. Não coloque senha ou service_role aqui.

insert into private.maradata_usuarios_autorizados (user_id, ativo)
values ('00000000-0000-0000-0000-000000000000'::uuid, true)
on conflict (user_id) do update set ativo = true;

-- Verifique que existe exatamente uma conta autorizada:
select user_id, ativo, criado_em
from private.maradata_usuarios_autorizados;

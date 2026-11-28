/** Mantém o mesmo identificador usado pelo padrão de armazenamento do Supabase Auth. */
export function obterChaveArmazenamentoSupabase(url: string): string {
  const host = new URL(url).hostname;
  const referenciaProjeto = host.split('.')[0];
  if (!referenciaProjeto) throw new Error('Não foi possível identificar o projeto Supabase pela URL.');
  return `sb-${referenciaProjeto}-auth-token`;
}

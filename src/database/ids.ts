/**
 * Gera identificadores locais sem depender de APIs exclusivas do navegador
 * ou do dispositivo. O prefixo facilita identificar o tipo de registro nos logs.
 */
export function criarId(prefixo: string = 'id'): string {
  const tempo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 12);
  const aleatorioExtra = Math.random().toString(36).slice(2, 8);

  return `${prefixo}_${tempo}_${aleatorio}${aleatorioExtra}`;
}

/**
 * Normaliza nomes para comparação e prevenção de duplicatas.
 * Remove acentos, ignora diferenças entre maiúsculas/minúsculas
 * e reduz sequências de espaços a um único espaço.
 */
export function normalizarNome(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export interface Fila {
  id: string;
  nome: string;
  evento: string;
  status: 'ativa' | 'encerrada';
  quantidadeAguardando: number;
}

// Temporary example data.
// We'll remove these examples when the creation screen is ready.
const filas: Fila[] = [
  {
    id: 'fila-001',
    nome: 'Console',
    evento: 'Arena Games 2026',
    status: 'ativa',
    quantidadeAguardando: 12,
  },
  {
    id: 'fila-002',
    nome: 'Just Dance',
    evento: 'Arena Games 2026',
    status: 'ativa',
    quantidadeAguardando: 5,
  },
];

export function buscarFilas() {
  return [...filas];
}
export function buscarFilaPorId(id: string) {
  return filas.find((fila) => fila.id === id);
}

export function salvarFila(dados: Omit<Fila, 'id'>) {
  const novaFila: Fila = {
    ...dados,
    id: `fila-${Date.now()}`,
  };

  filas.push(novaFila);

  return novaFila;
}
export interface EventoAtivo {
  nomeEvento: string;
  localEvento: string;
  dataInicio: string;
  dataTermino: string;
  horarioInicio: string;
  horarioTermino: string;
  descricao: string;
  situacao: 'agendado' | 'em_andamento';
}

// Guarda um único evento durante a execução do aplicativo.
let eventoAtivo: EventoAtivo | null = null;

// Salva ou substitui o evento atual.
export function salvarEventoAtivo(evento: EventoAtivo) {
  eventoAtivo = { ...evento };
}

// Recupera o evento atual.
export function buscarEventoAtivo(): EventoAtivo | null {
  return eventoAtivo ? { ...eventoAtivo } : null;
}
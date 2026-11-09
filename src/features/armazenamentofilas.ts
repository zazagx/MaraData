export type StatusFila = 'ativa' | 'encerrada';
export type StatusParticipanteFila = 'aguardando' | 'atendido';

export interface ParticipanteNaFila {
  id: string;
  nome: string;
  dataNascimento: string;
  senha: string;
  jogos: string[];
  status: StatusParticipanteFila;
  adicionadoEm: string;
  chamadoEm?: string;
}

export interface Fila {
  id: string;
  nome: string;
  evento: string;
  localEvento: string;
  status: StatusFila;
  quantidadeAguardando: number;
  participantes: ParticipanteNaFila[];
  indiceAtual: number;
  criadaEm: string;
  encerradaEm?: string;
}

export interface DadosParticipanteFila {
  nome: string;
  dataNascimento: string;
  jogos: string[];
}

// Protótipo em memória: os dados existem enquanto o processo do app estiver aberto.
// Depois, este módulo poderá ser migrado para SQLite/Supabase sem mudar a tela.
const filas: Fila[] = [];
const historicoFilas: Fila[] = [];

// Completa filas criadas por uma versão anterior do protótipo.
// Isso evita que registros antigos, sem participantes/indiceAtual, quebrem a tela.
function garantirEstruturaFila(fila: Fila): Fila {
  const filaParcial = fila as Fila & {
    participantes?: ParticipanteNaFila[];
    indiceAtual?: number;
    localEvento?: string;
    quantidadeAguardando?: number;
    criadaEm?: string;
  };

  if (!Array.isArray(filaParcial.participantes)) {
    filaParcial.participantes = [];
  }

  if (!Number.isInteger(filaParcial.indiceAtual) || (filaParcial.indiceAtual ?? -1) < 0) {
    filaParcial.indiceAtual = 0;
  }

  filaParcial.indiceAtual = Math.min(
    filaParcial.indiceAtual as number,
    filaParcial.participantes.length
  );

  filaParcial.localEvento = filaParcial.localEvento ?? '';
  filaParcial.criadaEm = filaParcial.criadaEm ?? new Date().toISOString();
  filaParcial.quantidadeAguardando = Math.max(
    filaParcial.participantes.length - (filaParcial.indiceAtual as number),
    0
  );

  if (filaParcial.status !== 'ativa' && filaParcial.status !== 'encerrada') {
    filaParcial.status = 'ativa';
  }

  return filaParcial as Fila;
}

function copiarFila(fila: Fila): Fila {
  const filaCompleta = garantirEstruturaFila(fila);
  return {
    ...filaCompleta,
    participantes: filaCompleta.participantes.map((participante) => ({
      ...participante,
      jogos: [...(participante.jogos ?? [])],
    })),
  };
}

function atualizarQuantidade(fila: Fila) {
  garantirEstruturaFila(fila);
  fila.quantidadeAguardando = Math.max(
    fila.participantes.length - fila.indiceAtual,
    0
  );
}

export function buscarFilas(): Fila[] {
  return filas.map(copiarFila);
}

export function buscarFilaPorId(id: string): Fila | undefined {
  const fila = filas.find((item) => item.id === id);
  return fila ? copiarFila(fila) : undefined;
}

export function salvarFila(dados: {
  nome: string;
  evento: string;
  localEvento: string;
}): Fila {
  const agora = new Date().toISOString();

  const novaFila: Fila = {
    id: `fila-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: dados.nome.trim(),
    evento: dados.evento.trim(),
    localEvento: dados.localEvento.trim(),
    status: 'ativa',
    quantidadeAguardando: 0,
    participantes: [],
    indiceAtual: 0,
    criadaEm: agora,
  };

  filas.push(novaFila);
  return copiarFila(novaFila);
}

export function adicionarParticipanteAFila(
  filaId: string,
  dados: DadosParticipanteFila
): { sucesso: boolean; mensagem?: string; fila?: Fila } {
  const fila = filas.find((item) => item.id === filaId);

  if (!fila) return { sucesso: false, mensagem: 'Fila não encontrada.' };
  garantirEstruturaFila(fila);
  if (fila.status !== 'ativa') {
    return { sucesso: false, mensagem: 'Esta fila já foi encerrada.' };
  }

  const nomeNormalizado = dados.nome.trim().toLocaleLowerCase('pt-BR');
  const jaEstaNaFila = fila.participantes.some(
    (item) =>
      item.nome.trim().toLocaleLowerCase('pt-BR') === nomeNormalizado &&
      item.dataNascimento === dados.dataNascimento
  );

  if (jaEstaNaFila) {
    return { sucesso: false, mensagem: 'Este participante já está nesta fila.' };
  }

  const numero = fila.participantes.length + 1;
  const novoParticipante: ParticipanteNaFila = {
    id: `${fila.id}-participante-${Date.now()}-${numero}`,
    nome: dados.nome.trim(),
    dataNascimento: dados.dataNascimento,
    senha: `A-${String(numero).padStart(3, '0')}`,
    jogos: [...dados.jogos],
    status: 'aguardando',
    adicionadoEm: new Date().toISOString(),
  };

  fila.participantes.push(novoParticipante);
  atualizarQuantidade(fila);

  return { sucesso: true, fila: copiarFila(fila) };
}

// Avança o índice atual e marca o participante como atendido.
// O participante continua no array para preservar o histórico completo.
export function avancarSenha(filaId: string): { sucesso: boolean; mensagem?: string; fila?: Fila } {
  const fila = filas.find((item) => item.id === filaId);

  if (!fila) return { sucesso: false, mensagem: 'Fila não encontrada.' };
  garantirEstruturaFila(fila);
  if (fila.status !== 'ativa') {
    return { sucesso: false, mensagem: 'Esta fila já foi encerrada.' };
  }

  const atual = fila.participantes[fila.indiceAtual];
  if (!atual) {
    return { sucesso: false, mensagem: 'Sem participantes na fila.' };
  }

  atual.status = 'atendido';
  atual.chamadoEm = new Date().toISOString();
  fila.indiceAtual += 1;
  atualizarQuantidade(fila);

  return { sucesso: true, fila: copiarFila(fila) };
}

export function encerrarFila(filaId: string): { sucesso: boolean; mensagem?: string; fila?: Fila } {
  const indice = filas.findIndex((item) => item.id === filaId);
  if (indice < 0) return { sucesso: false, mensagem: 'Fila não encontrada.' };

  const fila = filas[indice];
  garantirEstruturaFila(fila);
  if (fila.status === 'encerrada') {
    return { sucesso: false, mensagem: 'Esta fila já foi encerrada.' };
  }

  fila.status = 'encerrada';
  fila.encerradaEm = new Date().toISOString();
  atualizarQuantidade(fila);

  // Guarda uma cópia completa para relatórios/estatísticas.
  const historicoExistente = historicoFilas.findIndex((item) => item.id === fila.id);
  if (historicoExistente >= 0) historicoFilas[historicoExistente] = copiarFila(fila);
  else historicoFilas.push(copiarFila(fila));

  return { sucesso: true, fila: copiarFila(fila) };
}

// Ponto de leitura simples para a futura tela de estatísticas.
export function buscarHistoricoFilas(): Fila[] {
  return historicoFilas.map(copiarFila);
}
import type { SQLiteDatabase } from 'expo-sqlite';
import { criarId } from '../database/ids';
import { registrarParticipanteNoEvento } from './armazenamentoEvento';

export type StatusFila = 'ativa' | 'encerrada';
export type StatusParticipanteFila = 'aguardando' | 'atendido';

export interface ParticipanteNaFila {
  /** Identificador do registro queue_entries. */
  id: string;
  participantId: string;
  eventParticipantId: string;
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
  eventId: string;
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

type FilaRow = {
  id: string;
  event_id: string;
  nome: string;
  status: StatusFila;
  created_at: string;
  closed_at: string | null;
  nome_evento: string;
  local_evento: string;
  situacao_evento: string;
};

type ParticipanteFilaRow = {
  entry_id: string;
  participant_id: string;
  event_participant_id: string;
  nome: string;
  data_nascimento: string;
  ticket_number: string;
  status: StatusParticipanteFila;
  added_at: string;
  called_at: string | null;
};

type JogoFilaRow = {
  event_participant_id: string;
  nome: string;
};

async function registrarOutbox(
  db: SQLiteDatabase,
  entityType: 'event_queue' | 'event_participant' | 'event_participant_game' | 'queue_entry',
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_outbox
      (id, entity_type, entity_id, operation, payload_json, created_at)
     VALUES (?, ?, ?, 'upsert', ?, ?)`,
    criarId('sync'),
    entityType,
    entityId,
    JSON.stringify(payload),
    new Date().toISOString()
  );
}

async function buscarFilaRow(db: SQLiteDatabase, filaId: string): Promise<FilaRow | null> {
  return db.getFirstAsync<FilaRow>(
    `SELECT q.id, q.event_id, q.nome, q.status, q.created_at, q.closed_at,
            e.nome_evento, e.local_evento, e.situacao AS situacao_evento
       FROM event_queues q
       INNER JOIN events e ON e.id = q.event_id
      WHERE q.id = ?`,
    filaId
  );
}

async function montarFila(db: SQLiteDatabase, row: FilaRow): Promise<Fila> {
  const participantesRows = await db.getAllAsync<ParticipanteFilaRow>(
    `SELECT
       qe.id AS entry_id,
       ep.participant_id,
       ep.id AS event_participant_id,
       ep.nome_snapshot AS nome,
       ep.data_nascimento_snapshot AS data_nascimento,
       qe.ticket_number,
       qe.status,
       qe.added_at,
       qe.called_at
     FROM queue_entries qe
     INNER JOIN event_participants ep ON ep.id = qe.event_participant_id
     WHERE qe.queue_id = ?
     ORDER BY qe.sequence_number ASC`,
    row.id
  );

  const jogosRows = participantesRows.length > 0
    ? await db.getAllAsync<JogoFilaRow>(
        `SELECT epg.event_participant_id, g.nome
           FROM event_participant_games epg
           INNER JOIN games g ON g.id = epg.game_id
          WHERE epg.event_participant_id IN (
            SELECT event_participant_id FROM queue_entries WHERE queue_id = ?
          )
          ORDER BY g.nome COLLATE NOCASE ASC`,
        row.id
      )
    : [];

  const jogosPorInscricao = new Map<string, string[]>();
  for (const jogo of jogosRows) {
    const atual = jogosPorInscricao.get(jogo.event_participant_id) ?? [];
    atual.push(jogo.nome);
    jogosPorInscricao.set(jogo.event_participant_id, atual);
  }

  const participantes: ParticipanteNaFila[] = participantesRows.map((item) => ({
    id: item.entry_id,
    participantId: item.participant_id,
    eventParticipantId: item.event_participant_id,
    nome: item.nome,
    dataNascimento: item.data_nascimento,
    senha: item.ticket_number,
    jogos: jogosPorInscricao.get(item.event_participant_id) ?? [],
    status: item.status,
    adicionadoEm: item.added_at,
    chamadoEm: item.called_at ?? undefined,
  }));

  const indiceAtual = participantes.findIndex((item) => item.status === 'aguardando');
  const quantidadeAguardando = participantes.filter((item) => item.status === 'aguardando').length;

  return {
    id: row.id,
    eventId: row.event_id,
    nome: row.nome,
    evento: row.nome_evento,
    localEvento: row.local_evento,
    status: row.status,
    quantidadeAguardando,
    participantes,
    indiceAtual: indiceAtual < 0 ? participantes.length : indiceAtual,
    criadaEm: row.created_at,
    encerradaEm: row.closed_at ?? undefined,
  };
}

export async function buscarFilas(db: SQLiteDatabase, eventId?: string): Promise<Fila[]> {
  const rows = eventId
    ? await db.getAllAsync<FilaRow>(
        `SELECT q.id, q.event_id, q.nome, q.status, q.created_at, q.closed_at,
                e.nome_evento, e.local_evento, e.situacao AS situacao_evento
           FROM event_queues q
           INNER JOIN events e ON e.id = q.event_id
          WHERE q.event_id = ?
          ORDER BY q.created_at DESC`,
        eventId
      )
    : await db.getAllAsync<FilaRow>(
        `SELECT q.id, q.event_id, q.nome, q.status, q.created_at, q.closed_at,
                e.nome_evento, e.local_evento, e.situacao AS situacao_evento
           FROM event_queues q
           INNER JOIN events e ON e.id = q.event_id
          ORDER BY q.created_at DESC`
      );

  return Promise.all(rows.map((row) => montarFila(db, row)));
}

export async function buscarFilaPorId(db: SQLiteDatabase, id: string): Promise<Fila | undefined> {
  const row = await buscarFilaRow(db, id);
  return row ? montarFila(db, row) : undefined;
}

export async function salvarFila(
  db: SQLiteDatabase,
  dados: { nome: string; eventId: string }
): Promise<Fila> {
  let filaId = '';

  await db.withTransactionAsync(async () => {
    const evento = await db.getFirstAsync<{ id: string; situacao: string }>(
      'SELECT id, situacao FROM events WHERE id = ?',
      dados.eventId
    );
    if (!evento) throw new Error('O evento selecionado não foi encontrado.');
    if (evento.situacao !== 'em_andamento') {
      throw new Error('Só é possível criar filas para eventos em andamento.');
    }

    filaId = criarId('queue');
    const agora = new Date().toISOString();
    const payload = {
      id: filaId,
      event_id: dados.eventId,
      nome: dados.nome.trim(),
      status: 'ativa',
      created_at: agora,
      closed_at: null,
    };

    await db.runAsync(
      `INSERT INTO event_queues (id, event_id, nome, status, created_at, closed_at)
       VALUES (?, ?, ?, 'ativa', ?, NULL)`,
      filaId,
      dados.eventId,
      dados.nome.trim(),
      agora
    );
    await registrarOutbox(db, 'event_queue', filaId, payload);
  });

  const novaFila = await buscarFilaPorId(db, filaId);
  if (!novaFila) throw new Error('A fila foi criada, mas não pôde ser carregada.');
  return novaFila;
}

/**
 * Vincula um participante já cadastrado à fila e ao evento da fila.
 * A associação ao evento é criada uma única vez, com snapshot dos dados
 * demográficos e dos jogos existentes no momento da inscrição.
 */
export async function adicionarParticipanteAFila(
  db: SQLiteDatabase,
  filaId: string,
  participantId: string
): Promise<{ sucesso: boolean; mensagem?: string; fila?: Fila }> {
  try {
    const filaAntes = await buscarFilaRow(db, filaId);
    if (!filaAntes) throw new Error('Fila não encontrada.');
    if (filaAntes.status !== 'ativa') throw new Error('Esta fila já foi encerrada.');
    if (filaAntes.situacao_evento !== 'em_andamento') {
      throw new Error('O evento desta fila não está mais em andamento.');
    }

    // Garante que o participante pertença ao evento, criando um snapshot
    // demográfico e dos jogos na primeira inscrição.
    const inscricao = await registrarParticipanteNoEvento(db, filaAntes.event_id, participantId);

    await db.withTransactionAsync(async () => {
      const filaAtual = await buscarFilaRow(db, filaId);
      if (!filaAtual || filaAtual.status !== 'ativa' || filaAtual.situacao_evento !== 'em_andamento') {
        throw new Error('A fila ou o evento foi encerrado antes de concluir a inscrição.');
      }

      const existenteNaFila = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM queue_entries WHERE queue_id = ? AND event_participant_id = ?',
        filaId,
        inscricao.eventParticipantId
      );
      if (existenteNaFila) throw new Error('Este participante já está nesta fila.');

      const sequencia = await db.getFirstAsync<{ proxima: number }>(
        'SELECT COALESCE(MAX(sequence_number), 0) + 1 AS proxima FROM queue_entries WHERE queue_id = ?',
        filaId
      );
      const numero = sequencia?.proxima ?? 1;
      const entryId = criarId('queue_entry');
      const senha = `A-${String(numero).padStart(3, '0')}`;
      const addedAt = new Date().toISOString();

      const payload = {
        id: entryId,
        queue_id: filaId,
        event_participant_id: inscricao.eventParticipantId,
        ticket_number: senha,
        sequence_number: numero,
        status: 'aguardando',
        added_at: addedAt,
        called_at: null,
      };

      await db.runAsync(
        `INSERT INTO queue_entries (
          id, queue_id, event_participant_id, ticket_number,
          sequence_number, status, added_at, called_at
        ) VALUES (?, ?, ?, ?, ?, 'aguardando', ?, NULL)`,
        entryId,
        filaId,
        inscricao.eventParticipantId,
        senha,
        numero,
        addedAt
      );
      await registrarOutbox(db, 'queue_entry', entryId, payload);
    });

    const filaAtualizada = await buscarFilaPorId(db, filaId);
    return { sucesso: true, fila: filaAtualizada };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: erro instanceof Error ? erro.message : 'Não foi possível adicionar o participante à fila.',
    };
  }
}

export async function avancarSenha(
  db: SQLiteDatabase,
  filaId: string
): Promise<{ sucesso: boolean; mensagem?: string; fila?: Fila }> {
  try {
    await db.withTransactionAsync(async () => {
      const fila = await buscarFilaRow(db, filaId);
      if (!fila) throw new Error('Fila não encontrada.');
      if (fila.status !== 'ativa') throw new Error('Esta fila já foi encerrada.');
      if (fila.situacao_evento !== 'em_andamento') throw new Error('O evento desta fila não está em andamento.');

      const atual = await db.getFirstAsync<{
        id: string;
        queue_id: string;
        event_participant_id: string;
        ticket_number: string;
        sequence_number: number;
        added_at: string;
      }>(
        `SELECT id, queue_id, event_participant_id, ticket_number, sequence_number, added_at
           FROM queue_entries
          WHERE queue_id = ? AND status = 'aguardando'
          ORDER BY sequence_number ASC LIMIT 1`,
        filaId
      );
      if (!atual) throw new Error('Sem participantes aguardando nesta fila.');

      const chamadoEm = new Date().toISOString();
      await db.runAsync(
        `UPDATE queue_entries SET status = 'atendido', called_at = ? WHERE id = ?`,
        chamadoEm,
        atual.id
      );
      await registrarOutbox(db, 'queue_entry', atual.id, {
        id: atual.id,
        queue_id: atual.queue_id,
        event_participant_id: atual.event_participant_id,
        ticket_number: atual.ticket_number,
        sequence_number: atual.sequence_number,
        status: 'atendido',
        added_at: atual.added_at,
        called_at: chamadoEm,
      });
    });

    return { sucesso: true, fila: await buscarFilaPorId(db, filaId) };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: erro instanceof Error ? erro.message : 'Não foi possível avançar a fila.',
    };
  }
}

export async function encerrarFila(
  db: SQLiteDatabase,
  filaId: string
): Promise<{ sucesso: boolean; mensagem?: string; fila?: Fila }> {
  try {
    await db.withTransactionAsync(async () => {
      const fila = await buscarFilaRow(db, filaId);
      if (!fila) throw new Error('Fila não encontrada.');
      if (fila.status === 'encerrada') throw new Error('Esta fila já foi encerrada.');

      const closedAt = new Date().toISOString();
      await db.runAsync(
        `UPDATE event_queues SET status = 'encerrada', closed_at = ? WHERE id = ?`,
        closedAt,
        filaId
      );
      await registrarOutbox(db, 'event_queue', filaId, {
        id: filaId,
        event_id: fila.event_id,
        nome: fila.nome,
        status: 'encerrada',
        created_at: fila.created_at,
        closed_at: closedAt,
      });
    });

    return { sucesso: true, fila: await buscarFilaPorId(db, filaId) };
  } catch (erro) {
    return {
      sucesso: false,
      mensagem: erro instanceof Error ? erro.message : 'Não foi possível encerrar a fila.',
    };
  }
}

export async function buscarHistoricoFilas(db: SQLiteDatabase): Promise<Fila[]> {
  const todas = await buscarFilas(db);
  return todas.filter((fila) => fila.status === 'encerrada');
}

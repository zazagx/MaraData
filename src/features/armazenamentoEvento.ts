import type { SQLiteDatabase } from 'expo-sqlite';
import { criarId } from '../database/ids';
import type { Participante } from './armazenamentoParticipantes';

export type SituacaoEvento = 'agendado' | 'em_andamento' | 'encerrado';

export interface Evento {
  id: string;
  nomeEvento: string;
  localEvento: string;
  dataInicio: string;
  dataTermino: string;
  horarioInicio: string;
  horarioTermino: string;
  descricao: string;
  situacao: SituacaoEvento;
  criadoEm: string;
  atualizadoEm: string;
  encerradoEm?: string | null;
}

export type DadosEvento = Omit<Evento, 'id' | 'criadoEm' | 'atualizadoEm' | 'encerradoEm'> & {
  id?: string;
};

type EventoRow = {
  id: string;
  nome_evento: string;
  local_evento: string;
  data_inicio: string;
  data_termino: string | null;
  horario_inicio: string;
  horario_termino: string | null;
  descricao: string;
  situacao: SituacaoEvento;
  created_at: string;
  updated_at: string;
  encerrado_em: string | null;
};

async function registrarEventoOutbox(db: SQLiteDatabase, evento: Evento): Promise<void> {
  const payload = {
    id: evento.id,
    nome_evento: evento.nomeEvento,
    local_evento: evento.localEvento,
    data_inicio: evento.dataInicio,
    data_termino: evento.dataTermino || null,
    horario_inicio: evento.horarioInicio,
    horario_termino: evento.horarioTermino || null,
    descricao: evento.descricao,
    situacao: evento.situacao,
    created_at: evento.criadoEm,
    updated_at: evento.atualizadoEm,
    encerrado_em: evento.encerradoEm ?? null,
  };

  await db.runAsync(
    `INSERT INTO sync_outbox
      (id, entity_type, entity_id, operation, payload_json, created_at)
     VALUES (?, 'event', ?, 'upsert', ?, ?)`,
    criarId('sync'),
    evento.id,
    JSON.stringify(payload),
    new Date().toISOString()
  );
}

function mapearEvento(row: EventoRow): Evento {
  return {
    id: row.id,
    nomeEvento: row.nome_evento,
    localEvento: row.local_evento,
    dataInicio: row.data_inicio,
    dataTermino: row.data_termino ?? '',
    horarioInicio: row.horario_inicio,
    horarioTermino: row.horario_termino ?? '',
    descricao: row.descricao,
    situacao: row.situacao,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
    encerradoEm: row.encerrado_em,
  };
}

export async function buscarEventos(db: SQLiteDatabase): Promise<Evento[]> {
  const rows = await db.getAllAsync<EventoRow>(
    `SELECT id, nome_evento, local_evento, data_inicio, data_termino,
            horario_inicio, horario_termino, descricao, situacao,
            created_at, updated_at, encerrado_em
       FROM events
      ORDER BY created_at DESC`
  );

  return rows.map(mapearEvento);
}

export async function buscarEventoPorId(
  db: SQLiteDatabase,
  id: string
): Promise<Evento | null> {
  const row = await db.getFirstAsync<EventoRow>(
    `SELECT id, nome_evento, local_evento, data_inicio, data_termino,
            horario_inicio, horario_termino, descricao, situacao,
            created_at, updated_at, encerrado_em
       FROM events
      WHERE id = ?`,
    id
  );

  return row ? mapearEvento(row) : null;
}

export async function salvarEvento(db: SQLiteDatabase, dados: DadosEvento): Promise<Evento> {
  let salvo: Evento | null = null;

  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    const id = dados.id || criarId('event');
    const existente = dados.id
      ? await db.getFirstAsync<Pick<EventoRow, 'created_at' | 'encerrado_em' | 'situacao'>>(
          'SELECT created_at, encerrado_em, situacao FROM events WHERE id = ?', id
        )
      : null;

    // Um evento que já recebeu participantes ou filas não pode voltar a ser
    // apenas agendado. Para finalizar sua operação, use encerrarEvento().
    if (existente?.situacao === 'em_andamento' && dados.situacao === 'agendado') {
      const possuiOperacao = await db.getFirstAsync<{ possui: number }>(
        `SELECT (
           EXISTS (SELECT 1 FROM event_participants WHERE event_id = ?) OR
           EXISTS (SELECT 1 FROM event_queues WHERE event_id = ?)
         ) AS possui`,
        id,
        id
      );
      if (possuiOperacao?.possui) {
        throw new Error('Este evento já possui participantes ou filas. Para finalizar, utilize a opção Encerrar evento.');
      }
    }

    if (dados.situacao === 'em_andamento') {
      const outroAtivo = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM events WHERE situacao = 'em_andamento' AND id <> ? LIMIT 1`,
        id
      );
      if (outroAtivo) {
        throw new Error('Já existe outro evento em andamento. Encerre-o antes de iniciar um novo.');
      }
    }

    const evento: Evento = {
      id,
      nomeEvento: dados.nomeEvento.trim(),
      localEvento: dados.localEvento.trim(),
      dataInicio: dados.dataInicio,
      dataTermino: dados.dataTermino || '',
      horarioInicio: dados.horarioInicio,
      horarioTermino: dados.horarioTermino || '',
      descricao: dados.descricao.trim(),
      situacao: dados.situacao,
      criadoEm: existente?.created_at ?? agora,
      atualizadoEm: agora,
      encerradoEm: existente?.encerrado_em ?? null,
    };

    if (existente) {
      await db.runAsync(
        `UPDATE events SET
           nome_evento = ?, local_evento = ?, data_inicio = ?, data_termino = ?,
           horario_inicio = ?, horario_termino = ?, descricao = ?, situacao = ?, updated_at = ?
         WHERE id = ?`,
        evento.nomeEvento,
        evento.localEvento,
        evento.dataInicio,
        evento.dataTermino || null,
        evento.horarioInicio,
        evento.horarioTermino || null,
        evento.descricao,
        evento.situacao,
        evento.atualizadoEm,
        evento.id
      );
    } else {
      await db.runAsync(
        `INSERT INTO events (
          id, nome_evento, local_evento, data_inicio, data_termino,
          horario_inicio, horario_termino, descricao, situacao,
          details_downloaded, created_at, updated_at, encerrado_em
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
        evento.id,
        evento.nomeEvento,
        evento.localEvento,
        evento.dataInicio,
        evento.dataTermino || null,
        evento.horarioInicio,
        evento.horarioTermino || null,
        evento.descricao,
        evento.situacao,
        evento.criadoEm,
        evento.atualizadoEm
      );
    }

    await registrarEventoOutbox(db, evento);
    salvo = evento;
  });

  if (!salvo) throw new Error('Não foi possível salvar o evento.');
  return salvo;
}


/**
 * Retorna somente as pessoas vinculadas a um evento específico.
 *
 * Os dados cadastrais são lidos do snapshot salvo no momento da inscrição,
 * evitando que alterações posteriores no cadastro global alterem o histórico.
 */
export async function buscarParticipantesDoEvento(
  db: SQLiteDatabase,
  eventId: string
): Promise<Participante[]> {
  const participantes = await db.getAllAsync<{
    id: string;
    nome: string;
    data_nascimento: string;
    genero: string;
    escolaridade: string;
    mercado_games: string;
    interesse_profissional_games: string;
    registered_at: string;
  }>(
    `SELECT
       ep.participant_id AS id,
       ep.nome_snapshot AS nome,
       ep.data_nascimento_snapshot AS data_nascimento,
       ep.genero_snapshot AS genero,
       ep.escolaridade_snapshot AS escolaridade,
       ep.mercado_games,
       ep.interesse_profissional_games,
       ep.registered_at
     FROM event_participants ep
     WHERE ep.event_id = ?
     ORDER BY ep.nome_snapshot COLLATE NOCASE ASC`,
    eventId
  );

  if (participantes.length === 0) return [];

  const jogos = await db.getAllAsync<{
    participant_id: string;
    nome: string;
  }>(
    `SELECT
       ep.participant_id AS participant_id,
       g.nome AS nome
     FROM event_participant_games epg
     INNER JOIN event_participants ep
       ON ep.id = epg.event_participant_id
     INNER JOIN games g
       ON g.id = epg.game_id
     WHERE ep.event_id = ?
     ORDER BY g.nome COLLATE NOCASE ASC`,
    eventId
  );

  const jogosPorParticipante = new Map<string, string[]>();
  for (const jogo of jogos) {
    const lista = jogosPorParticipante.get(jogo.participant_id) ?? [];
    lista.push(jogo.nome);
    jogosPorParticipante.set(jogo.participant_id, lista);
  }

  return participantes.map((row) => ({
    id: row.id,
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    genero: row.genero,
    escolaridade: row.escolaridade,
    jogos: jogosPorParticipante.get(row.id) ?? [],
    mercadoGames: row.mercado_games,
    interesseProfissionalGames: row.interesse_profissional_games,
    criadoEm: row.registered_at,
    atualizadoEm: row.registered_at,
  }));
}

export async function registrarParticipanteNoEvento(
  db: SQLiteDatabase,
  eventId: string,
  participantId: string
): Promise<{ eventParticipantId: string; jaExistia: boolean }> {
  let resultado: { eventParticipantId: string; jaExistia: boolean } | null = null;

  await db.withTransactionAsync(async () => {
    const evento = await db.getFirstAsync<{ id: string; situacao: string }>(
      'SELECT id, situacao FROM events WHERE id = ?', eventId
    );
    if (!evento) throw new Error('Evento não encontrado.');
    if (evento.situacao === 'encerrado') {
      throw new Error('Não é possível adicionar participantes a um evento já encerrado.');
    }

    const participante = await db.getFirstAsync<{
      id: string;
      nome: string;
      data_nascimento: string;
      genero: string;
      escolaridade: string;
      mercado_games: string;
      interesse_profissional_games: string;
    }>(
      `SELECT id, nome, data_nascimento, genero, escolaridade,
              mercado_games, interesse_profissional_games
         FROM participants WHERE id = ?`,
      participantId
    );
    if (!participante) throw new Error('Participante não encontrado neste dispositivo.');

    const existente = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM event_participants WHERE event_id = ? AND participant_id = ?',
      eventId,
      participantId
    );

    if (existente) {
      resultado = { eventParticipantId: existente.id, jaExistia: true };
      return;
    }

    const id = criarId('event_participant');
    const registeredAt = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO event_participants (
        id, event_id, participant_id, nome_snapshot, data_nascimento_snapshot,
        genero_snapshot, escolaridade_snapshot, mercado_games,
        interesse_profissional_games, registered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      eventId,
      participante.id,
      participante.nome,
      participante.data_nascimento,
      participante.genero,
      participante.escolaridade,
      participante.mercado_games,
      participante.interesse_profissional_games,
      registeredAt
    );

    await db.runAsync(
      `INSERT INTO sync_outbox
        (id, entity_type, entity_id, operation, payload_json, created_at)
       VALUES (?, 'event_participant', ?, 'upsert', ?, ?)`,
      criarId('sync'),
      id,
      JSON.stringify({
        id,
        event_id: eventId,
        participant_id: participante.id,
        nome_snapshot: participante.nome,
        data_nascimento_snapshot: participante.data_nascimento,
        genero_snapshot: participante.genero,
        escolaridade_snapshot: participante.escolaridade,
        mercado_games: participante.mercado_games,
        interesse_profissional_games: participante.interesse_profissional_games,
        registered_at: registeredAt,
      }),
      registeredAt
    );

    const jogos = await db.getAllAsync<{ game_id: string; nome: string }>(
      `SELECT pg.game_id, g.nome
         FROM participant_games pg
         INNER JOIN games g ON g.id = pg.game_id
        WHERE pg.participant_id = ?`,
      participante.id
    );

    for (const jogo of jogos) {
      await db.runAsync(
        `INSERT INTO event_participant_games (event_participant_id, game_id, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(event_participant_id, game_id) DO NOTHING`,
        id,
        jogo.game_id,
        registeredAt
      );
      await db.runAsync(
        `INSERT INTO sync_outbox
          (id, entity_type, entity_id, operation, payload_json, created_at)
         VALUES (?, 'event_participant_game', ?, 'upsert', ?, ?)`,
        criarId('sync'),
        `${id}:${jogo.game_id}`,
        JSON.stringify({
          event_participant_id: id,
          game_id: jogo.game_id,
          created_at: registeredAt,
        }),
        registeredAt
      );
    }

    resultado = { eventParticipantId: id, jaExistia: false };
  });

  if (!resultado) throw new Error('Não foi possível vincular o participante ao evento.');
  return resultado;
}

export async function encerrarEvento(db: SQLiteDatabase, eventoId: string): Promise<Evento> {
  let encerrado: Evento | null = null;

  await db.withTransactionAsync(async () => {
    const atual = await buscarEventoPorId(db, eventoId);
    if (!atual) throw new Error('Evento não encontrado.');
    if (atual.situacao !== 'em_andamento') {
      throw new Error('Somente um evento em andamento pode ser encerrado.');
    }

    const agora = new Date().toISOString();
    const eventoAtualizado: Evento = {
      ...atual,
      situacao: 'encerrado',
      atualizadoEm: agora,
      encerradoEm: agora,
    };

    await db.runAsync(
      `UPDATE events SET situacao = 'encerrado', updated_at = ?, encerrado_em = ? WHERE id = ?`,
      agora,
      agora,
      eventoId
    );
    await registrarEventoOutbox(db, eventoAtualizado);

    // Encerrar o evento também encerra todas as filas abertas vinculadas a ele.
    const filasAbertas = await db.getAllAsync<{
      id: string; nome: string; created_at: string;
    }>(
      `SELECT id, nome, created_at FROM event_queues
        WHERE event_id = ? AND status = 'ativa'`,
      eventoId
    );
    for (const fila of filasAbertas) {
      await db.runAsync(
        `UPDATE event_queues SET status = 'encerrada', closed_at = ? WHERE id = ?`,
        agora,
        fila.id
      );
      await db.runAsync(
        `INSERT INTO sync_outbox
          (id, entity_type, entity_id, operation, payload_json, created_at)
         VALUES (?, 'event_queue', ?, 'upsert', ?, ?)`,
        criarId('sync'),
        fila.id,
        JSON.stringify({
          id: fila.id,
          event_id: eventoId,
          nome: fila.nome,
          status: 'encerrada',
          created_at: fila.created_at,
          closed_at: agora,
        }),
        agora
      );
    }
    encerrado = eventoAtualizado;
  });

  if (!encerrado) throw new Error('Não foi possível encerrar o evento.');
  return encerrado;
}

import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase } from './supabase';

type TipoEntidade =
  | 'participant'
  | 'game'
  | 'participant_game'
  | 'event'
  | 'event_participant'
  | 'event_participant_game'
  | 'event_queue'
  | 'queue_entry'
  | 'event_day'
  | 'event_participant_day'
  | 'event_feedback'
  | 'event_feedback_game_suggestion'
  | 'event_game_play';

type OperacaoOutbox = 'upsert' | 'delete';

type RegistroOutbox = {
  id: string;
  entity_type: TipoEntidade;
  entity_id: string;
  operation: OperacaoOutbox;
  payload_json: string;
  attempts: number;
};

type Destino = {
  tabela: string;
  conflito: string;
  chavesDelete: string[];
};

// Os nomes correspondem às tabelas PostgreSQL criadas no projeto Supabase.
const DESTINOS: Record<TipoEntidade, Destino> = {
  participant: { tabela: 'participants', conflito: 'id', chavesDelete: ['id'] },
  game: { tabela: 'games', conflito: 'id', chavesDelete: ['id'] },
  participant_game: { tabela: 'participant_games', conflito: 'participant_id,game_id', chavesDelete: ['participant_id', 'game_id'] },
  event: { tabela: 'events', conflito: 'id', chavesDelete: ['id'] },
  event_participant: { tabela: 'event_participants', conflito: 'id', chavesDelete: ['id'] },
  event_participant_game: { tabela: 'event_participant_games', conflito: 'event_participant_id,game_id', chavesDelete: ['event_participant_id', 'game_id'] },
  event_queue: { tabela: 'event_queues', conflito: 'id', chavesDelete: ['id'] },
  queue_entry: { tabela: 'queue_entries', conflito: 'id', chavesDelete: ['id'] },
  event_day: { tabela: 'event_days', conflito: 'id', chavesDelete: ['id'] },
  event_participant_day: { tabela: 'event_participant_days', conflito: 'id', chavesDelete: ['id'] },
  event_feedback: { tabela: 'event_feedback', conflito: 'id', chavesDelete: ['id'] },
  event_feedback_game_suggestion: { tabela: 'event_feedback_game_suggestions', conflito: 'id', chavesDelete: ['id'] },
  event_game_play: { tabela: 'event_game_plays', conflito: 'id', chavesDelete: ['id'] },
};

/** Define exatamente quais colunas são copiadas do PostgreSQL para o SQLite. */
type ConfiguracaoDownload = {
  tipo: TipoEntidade;
  tabela: string;
  colunas: string[];
  chaves: string[];
  ordenarPor: string[];
  entityId: (row: Record<string, unknown>) => string;
};

const DOWNLOADS: ConfiguracaoDownload[] = [
  {
    tipo: 'participant', tabela: 'participants',
    colunas: ['id', 'nome', 'nome_normalizado', 'data_nascimento', 'genero', 'escolaridade', 'mercado_games', 'interesse_profissional_games', 'created_at', 'updated_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'game', tabela: 'games',
    colunas: ['id', 'nome', 'nome_normalizado', 'created_at', 'updated_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event', tabela: 'events',
    colunas: ['id', 'nome_evento', 'local_evento', 'data_inicio', 'data_termino', 'horario_inicio', 'horario_termino', 'descricao', 'situacao', 'details_downloaded', 'created_at', 'updated_at', 'encerrado_em'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'participant_game', tabela: 'participant_games',
    colunas: ['participant_id', 'game_id', 'created_at'],
    chaves: ['participant_id', 'game_id'], ordenarPor: ['participant_id', 'game_id'],
    entityId: (r) => `${r.participant_id}:${r.game_id}`,
  },
  {
    tipo: 'event_participant', tabela: 'event_participants',
    colunas: ['id', 'event_id', 'participant_id', 'nome_snapshot', 'data_nascimento_snapshot', 'genero_snapshot', 'escolaridade_snapshot', 'mercado_games', 'interesse_profissional_games', 'registered_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_participant_game', tabela: 'event_participant_games',
    colunas: ['event_participant_id', 'game_id', 'created_at'],
    chaves: ['event_participant_id', 'game_id'], ordenarPor: ['event_participant_id', 'game_id'],
    entityId: (r) => `${r.event_participant_id}:${r.game_id}`,
  },
  {
    tipo: 'event_queue', tabela: 'event_queues',
    colunas: ['id', 'event_id', 'nome', 'status', 'created_at', 'closed_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_day', tabela: 'event_days',
    colunas: ['id', 'event_id', 'day_number', 'event_date', 'status', 'created_at', 'updated_at', 'started_at', 'completed_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'queue_entry', tabela: 'queue_entries',
    colunas: ['id', 'queue_id', 'event_participant_id', 'event_day_id', 'game_id', 'ticket_number', 'sequence_number', 'status', 'added_at', 'called_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_participant_day', tabela: 'event_participant_days',
    colunas: ['id', 'event_day_id', 'event_participant_id', 'source', 'created_at', 'updated_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_feedback', tabela: 'event_feedback',
    colunas: ['id', 'event_participant_id', 'liked_event', 'arena_rating', 'wanted_game', 'used_queue', 'queue_rating', 'created_at', 'updated_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_feedback_game_suggestion', tabela: 'event_feedback_game_suggestions',
    colunas: ['id', 'feedback_id', 'game_name', 'game_name_normalized', 'created_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
  {
    tipo: 'event_game_play', tabela: 'event_game_plays',
    colunas: ['id', 'event_id', 'event_day_id', 'event_participant_id', 'game_id', 'created_at', 'updated_at'],
    chaves: ['id'], ordenarPor: ['id'], entityId: (r) => String(r.id),
  },
];

let sincronizacaoEmAndamento = false;

function mensagemErro(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  if (typeof erro === 'object' && erro !== null && 'message' in erro) {
    return String((erro as { message: unknown }).message);
  }
  return String(erro);
}


type JogoRemoto = {
  id: string;
  nome: string;
  nome_normalizado: string;
  created_at: string;
  updated_at: string;
};

type DiaRemoto = {
  id: string;
  event_id: string;
  day_number: number;
  event_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type PresencaDiaRemota = {
  id: string;
  event_day_id: string;
  event_participant_id: string;
  source: string;
  created_at: string;
  updated_at: string;
};

type JogoEventoRemoto = {
  id: string;
  event_id: string;
  event_day_id: string;
  event_participant_id: string;
  game_id: string;
  created_at: string;
  updated_at: string;
};

/**
 * Atualiza os payloads pendentes depois que o servidor informa o ID canônico.
 * A atualização ocorre dentro da mesma transação que remapeia as FKs locais.
 */
async function remapearReferenciasOutbox(
  db: SQLiteDatabase,
  tipo: 'game' | 'event_day',
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (idAntigo === idCanonico) return;

  const pendencias = await db.getAllAsync<{
    id: string;
    entity_type: TipoEntidade;
    entity_id: string;
    operation: OperacaoOutbox;
    payload_json: string;
  }>(
    `SELECT id, entity_type, entity_id, operation, payload_json
       FROM sync_outbox`
  );

  for (const pendencia of pendencias) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(pendencia.payload_json) as Record<string, unknown>;
    } catch {
      // Não altera payloads inválidos; a rotina normal de sincronização os reportará.
      continue;
    }

    let mudou = false;
    let novoEntityId = pendencia.entity_id;

    if (tipo === 'game') {
      if (pendencia.entity_type === 'game' && pendencia.entity_id === idAntigo) {
        payload.id = idCanonico;
        novoEntityId = idCanonico;
        mudou = true;
      }
      if (payload.game_id === idAntigo) {
        payload.game_id = idCanonico;
        mudou = true;
      }
      if (mudou && pendencia.entity_type === 'participant_game') {
        novoEntityId = `${String(payload.participant_id)}:${idCanonico}`;
      }
      if (mudou && pendencia.entity_type === 'event_participant_game') {
        novoEntityId = `${String(payload.event_participant_id)}:${idCanonico}`;
      }
    } else {
      // Uma exclusão de um dia antigo não deve ser transformada em exclusão
      // do dia canônico que já existe no servidor.
      if (pendencia.entity_type === 'event_day' && pendencia.operation === 'upsert'
          && pendencia.entity_id === idAntigo) {
        payload.id = idCanonico;
        novoEntityId = idCanonico;
        mudou = true;
      }
      if (pendencia.entity_type !== 'event_day' && payload.event_day_id === idAntigo) {
        payload.event_day_id = idCanonico;
        mudou = true;
      }
    }

    if (mudou) {
      await db.runAsync(
        'UPDATE sync_outbox SET entity_id = ?, payload_json = ? WHERE id = ?',
        novoEntityId,
        JSON.stringify(payload),
        pendencia.id
      );
    }
  }
}

/**
 * Substitui um ID local de jogo pelo ID canônico retornado pelo Supabase.
 * As FKs são temporariamente adiadas durante a transação para não perder
 * participantes, filas ou jogos registrados em eventos.
 */
async function remapearJogoLocal(
  db: SQLiteDatabase,
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (!idAntigo || !idCanonico || idAntigo === idCanonico) return;

  await db.withTransactionAsync(async () => {
    const antigo = await db.getFirstAsync<{ id: string; nome_normalizado: string }>(
      'SELECT id, nome_normalizado FROM games WHERE id = ?', idAntigo
    );
    const destino = await db.getFirstAsync<{ id: string; nome_normalizado: string }>(
      'SELECT id, nome_normalizado FROM games WHERE id = ?', idCanonico
    );

    const antigoEmMesclagemInterrompida =
      antigo?.nome_normalizado === `__temp_merge_${idAntigo}`;
    if (destino && antigo && destino.nome_normalizado !== antigo.nome_normalizado
        && !antigoEmMesclagemInterrompida) {
      throw new Error(`Conflito de IDs de jogos: ${idCanonico} já identifica outro jogo no dispositivo.`);
    }

    if (antigo && !destino) {
      // Move a chave principal antes das FKs; todas as verificações são
      // conferidas ao final da transação.
      await db.execAsync('PRAGMA defer_foreign_keys = ON;');
      await db.runAsync('UPDATE games SET id = ? WHERE id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE participant_games SET game_id = ? WHERE game_id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE event_participant_games SET game_id = ? WHERE game_id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE queue_entries SET game_id = ? WHERE game_id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE event_game_plays SET game_id = ? WHERE game_id = ?', idCanonico, idAntigo);
    } else if (antigo && destino) {
      // Os dois IDs já existem localmente (por exemplo, uma mesclagem antiga
      // interrompida). Move cada relação ou descarta apenas a duplicata natural.
      const relacoesParticipante = await db.getAllAsync<{ participant_id: string }>(
        'SELECT participant_id FROM participant_games WHERE game_id = ?', idAntigo
      );
      for (const relacao of relacoesParticipante) {
        const duplicada = await db.getFirstAsync<{ participant_id: string }>(
          'SELECT participant_id FROM participant_games WHERE participant_id = ? AND game_id = ?',
          relacao.participant_id, idCanonico
        );
        if (duplicada) {
          await db.runAsync(
            `UPDATE participant_games SET created_at = MIN(created_at,
              (SELECT created_at FROM participant_games WHERE participant_id = ? AND game_id = ?))
             WHERE participant_id = ? AND game_id = ?`,
            relacao.participant_id, idAntigo, relacao.participant_id, idCanonico
          );
          await db.runAsync('DELETE FROM participant_games WHERE participant_id = ? AND game_id = ?', relacao.participant_id, idAntigo);
        } else {
          await db.runAsync('UPDATE participant_games SET game_id = ? WHERE participant_id = ? AND game_id = ?', idCanonico, relacao.participant_id, idAntigo);
        }
      }

      const relacoesEvento = await db.getAllAsync<{ event_participant_id: string }>(
        'SELECT event_participant_id FROM event_participant_games WHERE game_id = ?', idAntigo
      );
      for (const relacao of relacoesEvento) {
        const duplicada = await db.getFirstAsync<{ event_participant_id: string }>(
          'SELECT event_participant_id FROM event_participant_games WHERE event_participant_id = ? AND game_id = ?',
          relacao.event_participant_id, idCanonico
        );
        if (duplicada) {
          await db.runAsync(
            `UPDATE event_participant_games SET created_at = MIN(created_at,
              (SELECT created_at FROM event_participant_games WHERE event_participant_id = ? AND game_id = ?))
             WHERE event_participant_id = ? AND game_id = ?`,
            relacao.event_participant_id, idAntigo, relacao.event_participant_id, idCanonico
          );
          await db.runAsync('DELETE FROM event_participant_games WHERE event_participant_id = ? AND game_id = ?', relacao.event_participant_id, idAntigo);
        } else {
          await db.runAsync('UPDATE event_participant_games SET game_id = ? WHERE event_participant_id = ? AND game_id = ?', idCanonico, relacao.event_participant_id, idAntigo);
        }
      }

      await db.runAsync('UPDATE queue_entries SET game_id = ? WHERE game_id = ?', idCanonico, idAntigo);

      const usosAntigos = await db.getAllAsync<{
        id: string; event_day_id: string; event_participant_id: string;
      }>(
        'SELECT id, event_day_id, event_participant_id FROM event_game_plays WHERE game_id = ?', idAntigo
      );
      for (const uso of usosAntigos) {
        const duplicado = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM event_game_plays
            WHERE event_day_id = ? AND event_participant_id = ? AND game_id = ?`,
          uso.event_day_id, uso.event_participant_id, idCanonico
        );
        if (duplicado) {
          await db.runAsync(
            `UPDATE event_game_plays
                SET created_at = MIN(created_at, (SELECT created_at FROM event_game_plays WHERE id = ?)),
                    updated_at = MAX(updated_at, (SELECT updated_at FROM event_game_plays WHERE id = ?))
              WHERE id = ?`, uso.id, uso.id, duplicado.id
          );
          await db.runAsync('DELETE FROM event_game_plays WHERE id = ?', uso.id);
        } else {
          await db.runAsync('UPDATE event_game_plays SET game_id = ? WHERE id = ?', idCanonico, uso.id);
        }
      }
      await db.runAsync('DELETE FROM games WHERE id = ?', idAntigo);
    }

    await remapearReferenciasOutbox(db, 'game', idAntigo, idCanonico);
  });
}

/**
 * Substitui um ID local de dia pelo ID canônico do Supabase e atualiza todas
 * as referências em presenças, filas, jogos utilizados e operações pendentes.
 */
async function remapearDiaLocal(
  db: SQLiteDatabase,
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (!idAntigo || !idCanonico || idAntigo === idCanonico) return;

  await db.withTransactionAsync(async () => {
    const antigo = await db.getFirstAsync<{ id: string; event_id: string; day_number: number; event_date: string }>(
      'SELECT id, event_id, day_number, event_date FROM event_days WHERE id = ?', idAntigo
    );
    const destino = await db.getFirstAsync<{ id: string; event_id: string; day_number: number; event_date: string }>(
      'SELECT id, event_id, day_number, event_date FROM event_days WHERE id = ?', idCanonico
    );

    if (destino && antigo && (
      destino.event_id !== antigo.event_id ||
      destino.day_number !== antigo.day_number ||
      destino.event_date !== antigo.event_date
    )) {
      throw new Error(`Conflito de IDs de dias: ${idCanonico} já identifica outro dia no dispositivo.`);
    }

    if (antigo && !destino) {
      await db.execAsync('PRAGMA defer_foreign_keys = ON;');
      await db.runAsync('UPDATE event_days SET id = ? WHERE id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE event_participant_days SET event_day_id = ? WHERE event_day_id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE event_game_plays SET event_day_id = ? WHERE event_day_id = ?', idCanonico, idAntigo);
      await db.runAsync('UPDATE queue_entries SET event_day_id = ? WHERE event_day_id = ?', idCanonico, idAntigo);
    } else if (antigo && destino) {
      // Mescla as relações pelos identificadores naturais, preservando uma
      // presença/uso por participante e dia, sem depender do ID aleatório.
      const presencasAntigas = await db.getAllAsync<{ id: string; event_participant_id: string }>(
        'SELECT id, event_participant_id FROM event_participant_days WHERE event_day_id = ?', idAntigo
      );
      for (const presenca of presencasAntigas) {
        const duplicada = await db.getFirstAsync<{ id: string }>(
          'SELECT id FROM event_participant_days WHERE event_day_id = ? AND event_participant_id = ?',
          idCanonico, presenca.event_participant_id
        );
        if (duplicada) {
          await db.runAsync(
            `UPDATE event_participant_days
                SET source = CASE WHEN source = 'fila' OR
                    (SELECT source FROM event_participant_days WHERE id = ?) = 'fila' THEN 'fila' ELSE 'manual' END,
                    created_at = MIN(created_at, (SELECT created_at FROM event_participant_days WHERE id = ?)),
                    updated_at = MAX(updated_at, (SELECT updated_at FROM event_participant_days WHERE id = ?))
              WHERE id = ?`,
            presenca.id, presenca.id, presenca.id, duplicada.id
          );
          await db.runAsync('DELETE FROM event_participant_days WHERE id = ?', presenca.id);
        } else {
          await db.runAsync('UPDATE event_participant_days SET event_day_id = ? WHERE id = ?', idCanonico, presenca.id);
        }
      }

      const usosAntigos = await db.getAllAsync<{
        id: string; event_participant_id: string; game_id: string;
      }>(
        'SELECT id, event_participant_id, game_id FROM event_game_plays WHERE event_day_id = ?', idAntigo
      );
      for (const uso of usosAntigos) {
        const duplicado = await db.getFirstAsync<{ id: string }>(
          `SELECT id FROM event_game_plays
            WHERE event_day_id = ? AND event_participant_id = ? AND game_id = ?`,
          idCanonico, uso.event_participant_id, uso.game_id
        );
        if (duplicado) {
          await db.runAsync(
            `UPDATE event_game_plays
                SET created_at = MIN(created_at, (SELECT created_at FROM event_game_plays WHERE id = ?)),
                    updated_at = MAX(updated_at, (SELECT updated_at FROM event_game_plays WHERE id = ?))
              WHERE id = ?`, uso.id, uso.id, duplicado.id
          );
          await db.runAsync('DELETE FROM event_game_plays WHERE id = ?', uso.id);
        } else {
          await db.runAsync('UPDATE event_game_plays SET event_day_id = ? WHERE id = ?', idCanonico, uso.id);
        }
      }

      await db.runAsync('UPDATE queue_entries SET event_day_id = ? WHERE event_day_id = ?', idCanonico, idAntigo);
      await db.runAsync('DELETE FROM event_days WHERE id = ?', idAntigo);
    }

    await remapearReferenciasOutbox(db, 'event_day', idAntigo, idCanonico);
  });
}

async function remapearOutboxId(
  db: SQLiteDatabase,
  tipo: 'event_participant_day' | 'event_game_play',
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (idAntigo === idCanonico) return;
  const pendencias = await db.getAllAsync<{ id: string; payload_json: string }>(
    'SELECT id, payload_json FROM sync_outbox WHERE entity_type = ? AND entity_id = ?',
    tipo, idAntigo
  );
  for (const pendencia of pendencias) {
    try {
      const payload = JSON.parse(pendencia.payload_json) as Record<string, unknown>;
      payload.id = idCanonico;
      await db.runAsync(
        'UPDATE sync_outbox SET entity_id = ?, payload_json = ? WHERE id = ?',
        idCanonico, JSON.stringify(payload), pendencia.id
      );
    } catch {
      throw new Error(`Não foi possível atualizar a pendência ${pendencia.id} durante a reconciliação.`);
    }
  }
}

async function remapearPresencaLocal(
  db: SQLiteDatabase,
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (!idAntigo || !idCanonico || idAntigo === idCanonico) return;
  await db.withTransactionAsync(async () => {
    const antigo = await db.getFirstAsync<PresencaDiaRemota>(
      'SELECT id, event_day_id, event_participant_id, source, created_at, updated_at FROM event_participant_days WHERE id = ?', idAntigo
    );
    const destino = await db.getFirstAsync<PresencaDiaRemota>(
      'SELECT id, event_day_id, event_participant_id, source, created_at, updated_at FROM event_participant_days WHERE id = ?', idCanonico
    );
    if (antigo && destino && (
      antigo.event_day_id !== destino.event_day_id ||
      antigo.event_participant_id !== destino.event_participant_id
    )) {
      throw new Error(`Conflito de IDs de presença: ${idCanonico} já identifica outra presença.`);
    }
    if (antigo && !destino) {
      await db.runAsync('UPDATE event_participant_days SET id = ? WHERE id = ?', idCanonico, idAntigo);
    } else if (antigo && destino) {
      await db.runAsync(
        `UPDATE event_participant_days
            SET source = CASE WHEN source = 'fila' OR ? = 'fila' THEN 'fila' ELSE 'manual' END,
                created_at = MIN(created_at, ?),
                updated_at = MAX(updated_at, ?)
          WHERE id = ?`,
        antigo.source, antigo.created_at, antigo.updated_at, idCanonico
      );
      await db.runAsync('DELETE FROM event_participant_days WHERE id = ?', idAntigo);
    }
    await remapearOutboxId(db, 'event_participant_day', idAntigo, idCanonico);
  });
}

async function remapearJogoEventoLocal(
  db: SQLiteDatabase,
  idAntigo: string,
  idCanonico: string
): Promise<void> {
  if (!idAntigo || !idCanonico || idAntigo === idCanonico) return;
  await db.withTransactionAsync(async () => {
    const antigo = await db.getFirstAsync<JogoEventoRemoto>(
      `SELECT id, event_id, event_day_id, event_participant_id, game_id, created_at, updated_at
         FROM event_game_plays WHERE id = ?`, idAntigo
    );
    const destino = await db.getFirstAsync<JogoEventoRemoto>(
      `SELECT id, event_id, event_day_id, event_participant_id, game_id, created_at, updated_at
         FROM event_game_plays WHERE id = ?`, idCanonico
    );
    if (antigo && destino && (
      antigo.event_id !== destino.event_id || antigo.event_day_id !== destino.event_day_id ||
      antigo.event_participant_id !== destino.event_participant_id || antigo.game_id !== destino.game_id
    )) {
      throw new Error(`Conflito de IDs de jogos utilizados: ${idCanonico} já identifica outro registro.`);
    }
    if (antigo && !destino) {
      await db.runAsync('UPDATE event_game_plays SET id = ? WHERE id = ?', idCanonico, idAntigo);
    } else if (antigo && destino) {
      await db.runAsync(
        `UPDATE event_game_plays SET created_at = MIN(created_at, ?), updated_at = MAX(updated_at, ?)
          WHERE id = ?`,
        antigo.created_at, antigo.updated_at, idCanonico
      );
      await db.runAsync('DELETE FROM event_game_plays WHERE id = ?', idAntigo);
    }
    await remapearOutboxId(db, 'event_game_play', idAntigo, idCanonico);
  });
}

async function reconciliarPresencaBaixada(db: SQLiteDatabase, remoto: PresencaDiaRemota): Promise<void> {
  const local = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM event_participant_days
      WHERE event_day_id = ? AND event_participant_id = ?`,
    remoto.event_day_id, remoto.event_participant_id
  );
  if (local && local.id !== remoto.id) {
    await remapearPresencaLocal(db, local.id, remoto.id);
  }
}

async function reconciliarJogoEventoBaixado(db: SQLiteDatabase, remoto: JogoEventoRemoto): Promise<void> {
  const local = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM event_game_plays
      WHERE event_day_id = ? AND event_participant_id = ? AND game_id = ?`,
    remoto.event_day_id, remoto.event_participant_id, remoto.game_id
  );
  if (local && local.id !== remoto.id) {
    await remapearJogoEventoLocal(db, local.id, remoto.id);
  }
}

function primeiraLinhaRpc<T>(data: unknown, descricao: string): T {
  const linha = Array.isArray(data) ? data[0] : data;
  if (!linha || typeof linha !== 'object') {
    throw new Error(`O Supabase não retornou o registro canônico de ${descricao}.`);
  }
  return linha as T;
}

async function reconciliarJogoBaixado(db: SQLiteDatabase, remoto: JogoRemoto): Promise<void> {
  const porNome = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM games WHERE nome_normalizado = ?', remoto.nome_normalizado
  );
  if (porNome && porNome.id !== remoto.id) {
    await remapearJogoLocal(db, porNome.id, remoto.id);
  }
}

async function reconciliarDiaBaixado(db: SQLiteDatabase, remoto: DiaRemoto): Promise<void> {
  const porNumero = await db.getFirstAsync<{ id: string; event_date: string }>(
    'SELECT id, event_date FROM event_days WHERE event_id = ? AND day_number = ?',
    remoto.event_id, remoto.day_number
  );
  const porData = await db.getFirstAsync<{ id: string; day_number: number }>(
    'SELECT id, day_number FROM event_days WHERE event_id = ? AND event_date = ?',
    remoto.event_id, remoto.event_date
  );

  if (porNumero && porData && porNumero.id !== porData.id) {
    throw new Error(`O evento ${remoto.event_id} possui dias locais conflitantes para o dia ${remoto.day_number}.`);
  }
  const local = porNumero ?? porData;
  if (!local) return;
  if ((porNumero && porNumero.event_date !== remoto.event_date) ||
      (porData && porData.day_number !== remoto.day_number)) {
    throw new Error(`O dia ${remoto.day_number} do evento ${remoto.event_id} possui datas diferentes entre dispositivos.`);
  }
  if (local.id !== remoto.id) await remapearDiaLocal(db, local.id, remoto.id);
}

async function enviarJogoComReconciliacao(
  db: SQLiteDatabase,
  payload: Record<string, unknown>
): Promise<void> {
  if (!supabase) throw new Error('Cliente Supabase não configurado.');
  const { data, error } = await supabase.rpc('maradata_upsert_game', {
    p_id: String(payload.id),
    p_nome: String(payload.nome),
    p_nome_normalizado: String(payload.nome_normalizado),
    p_created_at: String(payload.created_at ?? new Date().toISOString()),
    p_updated_at: String(payload.updated_at ?? new Date().toISOString()),
  });
  if (error) throw error;
  const canonico = primeiraLinhaRpc<JogoRemoto>(data, 'jogo');
  if (canonico.id !== String(payload.id)) {
    await remapearJogoLocal(db, String(payload.id), canonico.id);
  }
}

async function enviarDiaComReconciliacao(
  db: SQLiteDatabase,
  payload: Record<string, unknown>
): Promise<void> {
  if (!supabase) throw new Error('Cliente Supabase não configurado.');
  const { data, error } = await supabase.rpc('maradata_upsert_event_day', {
    p_id: String(payload.id),
    p_event_id: String(payload.event_id),
    p_day_number: Number(payload.day_number),
    p_event_date: String(payload.event_date),
    p_status: String(payload.status),
    p_created_at: String(payload.created_at ?? new Date().toISOString()),
    p_updated_at: String(payload.updated_at ?? new Date().toISOString()),
    p_started_at: payload.started_at ?? null,
    p_completed_at: payload.completed_at ?? null,
  });
  if (error) throw error;
  const canonico = primeiraLinhaRpc<DiaRemoto>(data, 'dia do evento');
  if (canonico.id !== String(payload.id)) {
    await remapearDiaLocal(db, String(payload.id), canonico.id);
  }
}

async function enviarPresencaComReconciliacao(
  db: SQLiteDatabase,
  payload: Record<string, unknown>
): Promise<void> {
  if (!supabase) throw new Error('Cliente Supabase não configurado.');
  const { data, error } = await supabase.rpc('maradata_upsert_event_participant_day', {
    p_id: String(payload.id),
    p_event_day_id: String(payload.event_day_id),
    p_event_participant_id: String(payload.event_participant_id),
    p_source: String(payload.source),
    p_created_at: String(payload.created_at ?? new Date().toISOString()),
    p_updated_at: String(payload.updated_at ?? new Date().toISOString()),
  });
  if (error) throw error;
  const canonico = primeiraLinhaRpc<PresencaDiaRemota>(data, 'presença do dia');
  if (canonico.id !== String(payload.id)) {
    await remapearPresencaLocal(db, String(payload.id), canonico.id);
  }
}

async function enviarJogoEventoComReconciliacao(
  db: SQLiteDatabase,
  payload: Record<string, unknown>
): Promise<void> {
  if (!supabase) throw new Error('Cliente Supabase não configurado.');
  const { data, error } = await supabase.rpc('maradata_upsert_event_game_play', {
    p_id: String(payload.id),
    p_event_id: String(payload.event_id),
    p_event_day_id: String(payload.event_day_id),
    p_event_participant_id: String(payload.event_participant_id),
    p_game_id: String(payload.game_id),
    p_created_at: String(payload.created_at ?? new Date().toISOString()),
    p_updated_at: String(payload.updated_at ?? new Date().toISOString()),
  });
  if (error) throw error;
  const canonico = primeiraLinhaRpc<JogoEventoRemoto>(data, 'jogo utilizado no evento');
  if (canonico.id !== String(payload.id)) {
    await remapearJogoEventoLocal(db, String(payload.id), canonico.id);
  }
}

async function prepararPayload(
  db: SQLiteDatabase,
  registro: RegistroOutbox,
  payloadOriginal: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const payload = { ...payloadOriginal };

  // Sugestões são sincronizadas como linhas próprias; os booleanos precisam
  // chegar ao PostgreSQL como booleanos, não como 0/1 do SQLite.
  if (registro.entity_type === 'event_feedback') {
    delete payload.suggestions;
    if (payload.liked_event !== undefined) payload.liked_event = Boolean(payload.liked_event);
    if (payload.wanted_game !== undefined) payload.wanted_game = Boolean(payload.wanted_game);
    if (payload.used_queue !== undefined) payload.used_queue = Boolean(payload.used_queue);
  }

  if (registro.entity_type === 'event') {
    if (payload.details_downloaded !== undefined) {
      payload.details_downloaded = Boolean(payload.details_downloaded);
    }
    const eventoAtual = await db.getFirstAsync<{
      situacao: string; encerrado_em: string | null; updated_at: string;
    }>(
      'SELECT situacao, encerrado_em, updated_at FROM events WHERE id = ?', registro.entity_id
    );
    if (eventoAtual) {
      payload.situacao = eventoAtual.situacao;
      payload.encerrado_em = eventoAtual.encerrado_em;
      payload.updated_at = eventoAtual.updated_at;
    }
    // O banco remoto permite apenas um evento em andamento. Se outro aparelho
    // já iniciou outro evento, encerra-se o registro local antigo para manter
    // a mesma regra que existe no SQLite.
    if (payload.situacao === 'em_andamento' && supabase) {
      const { data: ativoRemoto, error } = await supabase
        .from('events').select('id').eq('situacao', 'em_andamento').maybeSingle();
      if (error) throw error;
      if (ativoRemoto && ativoRemoto.id !== registro.entity_id) {
        const agora = new Date().toISOString();
        payload.situacao = 'encerrado';
        payload.encerrado_em ??= agora;
        await db.runAsync(
          "UPDATE events SET situacao = 'encerrado', encerrado_em = COALESCE(encerrado_em, ?), updated_at = ? WHERE id = ?",
          agora, agora, registro.entity_id
        );
      }
    }
  }

  if (registro.entity_type === 'event_day') {
    const diaAtual = await db.getFirstAsync<{
      day_number: number; event_date: string; status: string;
      created_at: string; updated_at: string; started_at: string | null; completed_at: string | null;
    }>(
      `SELECT day_number, event_date, status, created_at, updated_at, started_at, completed_at
         FROM event_days WHERE id = ?`, registro.entity_id
    );
    if (diaAtual) {
      payload.day_number = diaAtual.day_number;
      payload.event_date = diaAtual.event_date;
      payload.status = diaAtual.status;
      payload.created_at = diaAtual.created_at;
      payload.updated_at = diaAtual.updated_at;
      payload.started_at = diaAtual.started_at;
      payload.completed_at = diaAtual.completed_at;
    }
  }

  return payload;
}

async function enviarRegistro(
  db: SQLiteDatabase,
  registro: RegistroOutbox
): Promise<void> {
  if (!supabase) throw new Error('Cliente Supabase não configurado. Confira o .env.');

  const destino = DESTINOS[registro.entity_type];
  if (!destino) throw new Error(`Tipo de registro sem mapeamento: ${registro.entity_type}`);

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(registro.payload_json) as Record<string, unknown>;
  } catch {
    throw new Error(`O payload local da operação ${registro.id} não contém JSON válido.`);
  }

  if (registro.operation === 'upsert') {
    const payloadRemoto = await prepararPayload(db, registro, payload);

    // Jogos e dias possuem chaves naturais além do ID. Os RPCs resolvem
    // concorrência entre dispositivos e devolvem o identificador canônico.
    if (registro.entity_type === 'game') {
      await enviarJogoComReconciliacao(db, payloadRemoto);
      return;
    }
    if (registro.entity_type === 'event_day') {
      await enviarDiaComReconciliacao(db, payloadRemoto);
      return;
    }
    if (registro.entity_type === 'event_participant_day') {
      await enviarPresencaComReconciliacao(db, payloadRemoto);
      return;
    }
    if (registro.entity_type === 'event_game_play') {
      await enviarJogoEventoComReconciliacao(db, payloadRemoto);
      return;
    }

    const { error } = await supabase
      .from(destino.tabela)
      .upsert(payloadRemoto as never, { onConflict: destino.conflito });
    if (error) throw error;
    return;
  }

  const condicoes = destino.chavesDelete.map((chave) => ({
    chave,
    valor: payload[chave] ?? (chave === 'id' ? registro.entity_id : undefined),
  }));
  if (condicoes.some((item) => item.valor === undefined || item.valor === null)) {
    throw new Error(`Não foi possível identificar a chave para excluir o registro ${registro.entity_id}.`);
  }

  let consulta: any = supabase.from(destino.tabela).delete();
  for (const condicao of condicoes) {
    consulta = consulta.eq(condicao.chave, condicao.valor as string | number | boolean);
  }
  const { error } = await consulta;
  if (error) throw error;
}

function prioridadeEntidade(tipo: TipoEntidade): number {
  const prioridades: Record<TipoEntidade, number> = {
    participant: 10,
    game: 10,
    event: 20,
    participant_game: 30,
    event_participant: 40,
    event_participant_game: 50,
    event_queue: 50,
    event_day: 50,
    queue_entry: 60,
    event_participant_day: 60,
    event_feedback: 60,
    event_feedback_game_suggestion: 70,
    event_game_play: 70,
  };
  return prioridades[tipo];
}

export type ResultadoSincronizacao = {
  status: 'concluida' | 'sem_configuracao' | 'sem_sessao' | 'erro';
  enviados: number;
  pendentes: number;
  mensagem?: string;
};

/** Envia operações locais pendentes, removendo-as somente após confirmação remota. */
export async function sincronizarOutbox(db: SQLiteDatabase): Promise<ResultadoSincronizacao> {
  if (!supabase) {
    return { status: 'sem_configuracao', enviados: 0, pendentes: 0, mensagem: 'Supabase não configurado.' };
  }
  if (sincronizacaoEmAndamento) {
    return { status: 'concluida', enviados: 0, pendentes: 0 };
  }

  sincronizacaoEmAndamento = true;
  let enviados = 0;

  try {
    const { data: { session }, error: erroSessao } = await supabase.auth.getSession();
    if (erroSessao) throw erroSessao;
    if (!session) {
      return { status: 'sem_sessao', enviados: 0, pendentes: 0, mensagem: 'Aguardando autenticação.' };
    }

    const registros = await db.getAllAsync<RegistroOutbox & { created_at: string; ordem: number }>(
      `SELECT id, entity_type, entity_id, operation, payload_json, attempts,
              created_at, rowid AS ordem
         FROM sync_outbox
        ORDER BY created_at ASC, rowid ASC`
    );

    registros.sort((a, b) =>
      prioridadeEntidade(a.entity_type) - prioridadeEntidade(b.entity_type) ||
      a.created_at.localeCompare(b.created_at) ||
      a.ordem - b.ordem
    );

    for (const registroLista of registros) {
      // IDs e payloads podem ser reconciliados por uma operação anterior desta
      // mesma rodada. Sempre lemos a versão atual antes de enviar o registro.
      const registro = await db.getFirstAsync<RegistroOutbox>(
        `SELECT id, entity_type, entity_id, operation, payload_json, attempts
           FROM sync_outbox WHERE id = ?`,
        registroLista.id
      );
      if (!registro) continue;

      try {
        await enviarRegistro(db, registro);
        await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', registro.id);
        enviados += 1;
      } catch (erro) {
        const mensagem = mensagemErro(erro).slice(0, 1000);
        await db.runAsync(
          'UPDATE sync_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
          mensagem,
          registro.id
        );
        const restantes = registros.length - enviados;
        return { status: 'erro', enviados, pendentes: restantes, mensagem };
      }
    }

    return { status: 'concluida', enviados, pendentes: 0 };
  } catch (erro) {
    return {
      status: 'erro', enviados, pendentes: -1, mensagem: mensagemErro(erro),
    };
  } finally {
    sincronizacaoEmAndamento = false;
  }
}

export type ResultadoDownload = {
  status: 'concluido' | 'sem_configuracao' | 'sem_sessao' | 'erro';
  baixados: number;
  ignoradosComAlteracaoLocal: number;
  mensagem?: string;
};

const TAMANHO_PAGINA = 500;

/** Busca todas as páginas de uma tabela remota, com ordenação estável pela chave primária. */
async function buscarTabelaRemota(config: ConfiguracaoDownload): Promise<Record<string, unknown>[]> {
  if (!supabase) throw new Error('Cliente Supabase não configurado.');

  const resultado: Record<string, unknown>[] = [];
  let inicio = 0;

  while (true) {
    let consulta: any = supabase.from(config.tabela).select('*');
    for (const campo of config.ordenarPor) {
      consulta = consulta.order(campo, { ascending: true });
    }

    const { data, error } = await consulta.range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    const pagina = (data ?? []) as Record<string, unknown>[];
    resultado.push(...pagina);
    if (pagina.length < TAMANHO_PAGINA) break;
    inicio += TAMANHO_PAGINA;
  }

  return resultado;
}

function gerarUpsertLocal(config: ConfiguracaoDownload): string {
  const colunas = config.colunas;
  const placeholders = colunas.map(() => '?').join(', ');
  const chaves = config.chaves.join(', ');
  const atualizaveis = colunas.filter((coluna) => !config.chaves.includes(coluna));
  const atualizacao = atualizaveis.length
    ? `DO UPDATE SET ${atualizaveis.map((coluna) => `${coluna} = excluded.${coluna}`).join(', ')}`
    : 'DO NOTHING';

  return `INSERT INTO ${config.tabela} (${colunas.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${chaves}) ${atualizacao}`;
}

/**
 * Baixa o conteúdo remoto e grava no SQLite em ordem de dependência.
 * Registros com operações pendentes na outbox local não são sobrescritos:
 * isso protege alterações ainda não enviadas e exclusões aguardando sincronização.
 * Nenhum registro local é apagado nesta rotina.
 */
export async function baixarDadosRemotos(db: SQLiteDatabase): Promise<ResultadoDownload> {
  if (!supabase) {
    return { status: 'sem_configuracao', baixados: 0, ignoradosComAlteracaoLocal: 0, mensagem: 'Supabase não configurado.' };
  }

  const { data: { session }, error: erroSessao } = await supabase.auth.getSession();
  if (erroSessao) {
    return { status: 'erro', baixados: 0, ignoradosComAlteracaoLocal: 0, mensagem: mensagemErro(erroSessao) };
  }
  if (!session) {
    return { status: 'sem_sessao', baixados: 0, ignoradosComAlteracaoLocal: 0, mensagem: 'Aguardando autenticação.' };
  }

  try {
    // A rede é consultada antes da transação para não manter o SQLite bloqueado durante downloads.
    const conjuntos: Array<{ config: ConfiguracaoDownload; linhas: Record<string, unknown>[] }> = [];
    for (const config of DOWNLOADS) {
      conjuntos.push({ config, linhas: await buscarTabelaRemota(config) });
    }

    let baixados = 0;
    let ignoradosComAlteracaoLocal = 0;

    // Resolve colisões de IDs antigos antes do upsert genérico por chave primária.
    // Isso evita violar UNIQUE(nome_normalizado) e UNIQUE(event_id, dia/data).
    const jogosRemotos = conjuntos.find((item) => item.config.tipo === 'game')?.linhas ?? [];
    for (const linha of jogosRemotos) {
      await reconciliarJogoBaixado(db, linha as unknown as JogoRemoto);
    }
    const diasRemotos = conjuntos.find((item) => item.config.tipo === 'event_day')?.linhas ?? [];
    for (const linha of diasRemotos) {
      await reconciliarDiaBaixado(db, linha as unknown as DiaRemoto);
    }
    const presencasRemotas = conjuntos.find((item) => item.config.tipo === 'event_participant_day')?.linhas ?? [];
    for (const linha of presencasRemotas) {
      await reconciliarPresencaBaixada(db, linha as unknown as PresencaDiaRemota);
    }
    const jogosEventoRemotos = conjuntos.find((item) => item.config.tipo === 'event_game_play')?.linhas ?? [];
    for (const linha of jogosEventoRemotos) {
      await reconciliarJogoEventoBaixado(db, linha as unknown as JogoEventoRemoto);
    }

    await db.withTransactionAsync(async () => {
      for (const conjunto of conjuntos) {
        const { config, linhas } = conjunto;
        const sqlUpsert = gerarUpsertLocal(config);

        for (const linha of linhas) {
          const entityId = config.entityId(linha);
          const pendenciaLocal = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM sync_outbox WHERE entity_type = ? AND entity_id = ? LIMIT 1',
            config.tipo,
            entityId
          );

          if (pendenciaLocal) {
            ignoradosComAlteracaoLocal += 1;
            continue;
          }

          const valores = config.colunas.map((coluna) => {
            if (config.tabela === 'events' && coluna === 'details_downloaded') return 1;
            return linha[coluna] === undefined ? null : linha[coluna];
          });

          await db.runAsync(sqlUpsert, ...valores as (string | number | null | boolean)[]);
          baixados += 1;
        }
      }

      const agora = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO sync_metadata (chave, valor) VALUES ('ultima_baixa_remota', ?)
         ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
        agora
      );
    });

    return { status: 'concluido', baixados, ignoradosComAlteracaoLocal };
  } catch (erro) {
    return {
      status: 'erro', baixados: 0, ignoradosComAlteracaoLocal: 0,
      mensagem: mensagemErro(erro),
    };
  }
}

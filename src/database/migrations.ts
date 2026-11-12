import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Estrutura local do MaraData.
 * O SQLite é a fonte de verdade durante o trabalho offline.
 */
const VERSAO_BANCO = 3;

const MIGRACAO_1 = `
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  nome_normalizado TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  genero TEXT NOT NULL,
  escolaridade TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_participants_nome_normalizado ON participants(nome_normalizado);
CREATE INDEX IF NOT EXISTS idx_participants_data_nascimento ON participants(data_nascimento);

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  nome_normalizado TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participant_games (
  participant_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (participant_id, game_id),
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY NOT NULL,
  nome_evento TEXT NOT NULL,
  local_evento TEXT NOT NULL,
  data_inicio TEXT NOT NULL,
  data_termino TEXT,
  horario_inicio TEXT NOT NULL,
  horario_termino TEXT,
  descricao TEXT NOT NULL DEFAULT '',
  situacao TEXT NOT NULL CHECK (situacao IN ('agendado', 'em_andamento', 'encerrado')),
  details_downloaded INTEGER NOT NULL DEFAULT 1 CHECK (details_downloaded IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  encerrado_em TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_situacao_data ON events(situacao, data_inicio);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unico_em_andamento ON events(situacao) WHERE situacao = 'em_andamento';

CREATE TABLE IF NOT EXISTS event_participants (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  nome_snapshot TEXT NOT NULL,
  data_nascimento_snapshot TEXT NOT NULL,
  genero_snapshot TEXT NOT NULL,
  escolaridade_snapshot TEXT NOT NULL,
  mercado_games TEXT NOT NULL DEFAULT '',
  interesse_profissional_games TEXT NOT NULL DEFAULT '',
  registered_at TEXT NOT NULL,
  UNIQUE (event_id, participant_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_person ON event_participants(participant_id);

CREATE TABLE IF NOT EXISTS event_participant_games (
  event_participant_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (event_participant_id, game_id),
  FOREIGN KEY (event_participant_id) REFERENCES event_participants(id) ON DELETE CASCADE,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS event_queues (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ativa', 'encerrada')),
  created_at TEXT NOT NULL,
  closed_at TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_queues_event ON event_queues(event_id);

CREATE TABLE IF NOT EXISTS queue_entries (
  id TEXT PRIMARY KEY NOT NULL,
  queue_id TEXT NOT NULL,
  event_participant_id TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('aguardando', 'atendido')),
  added_at TEXT NOT NULL,
  called_at TEXT,
  UNIQUE (queue_id, ticket_number),
  UNIQUE (queue_id, sequence_number),
  UNIQUE (queue_id, event_participant_id),
  FOREIGN KEY (queue_id) REFERENCES event_queues(id) ON DELETE CASCADE,
  FOREIGN KEY (event_participant_id) REFERENCES event_participants(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_sequence ON queue_entries(queue_id, sequence_number);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'participant', 'game', 'participant_game', 'event',
    'event_participant', 'event_participant_game', 'event_queue', 'queue_entry'
  )),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_created ON sync_outbox(created_at, id);

CREATE TABLE IF NOT EXISTS sync_metadata (
  chave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL
);
`;

const MIGRACAO_2 = `
ALTER TABLE participants ADD COLUMN mercado_games TEXT NOT NULL DEFAULT '';
ALTER TABLE participants ADD COLUMN interesse_profissional_games TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_participants_identidade ON participants(nome_normalizado, data_nascimento);
`;

const MIGRACAO_3 = `
-- A versão anterior restringia os tipos da outbox. Reconstruímos a tabela
-- preservando todas as operações pendentes já registradas.
DROP INDEX IF EXISTS idx_sync_outbox_created;
ALTER TABLE sync_outbox RENAME TO sync_outbox_v2;
CREATE TABLE sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'participant', 'game', 'participant_game', 'event',
    'event_participant', 'event_participant_game', 'event_queue', 'queue_entry',
    'event_day', 'event_participant_day', 'event_feedback',
    'event_feedback_game_suggestion'
  )),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at, attempts, last_error)
SELECT id, entity_type, entity_id, operation, payload_json, created_at, attempts, last_error
FROM sync_outbox_v2;
DROP TABLE sync_outbox_v2;
CREATE INDEX IF NOT EXISTS idx_sync_outbox_created ON sync_outbox(created_at, id);

CREATE TABLE IF NOT EXISTS event_days (
  id TEXT PRIMARY KEY NOT NULL,
  event_id TEXT NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  event_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido', 'nao_realizado')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  UNIQUE (event_id, day_number),
  UNIQUE (event_id, event_date),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_days_event_date ON event_days(event_id, event_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_days_one_active
  ON event_days(event_id) WHERE status = 'em_andamento';

CREATE TABLE IF NOT EXISTS event_participant_days (
  id TEXT PRIMARY KEY NOT NULL,
  event_day_id TEXT NOT NULL,
  event_participant_id TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'fila')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (event_day_id, event_participant_id),
  FOREIGN KEY (event_day_id) REFERENCES event_days(id) ON DELETE CASCADE,
  FOREIGN KEY (event_participant_id) REFERENCES event_participants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_event_participant_days_participant
  ON event_participant_days(event_participant_id);

CREATE TRIGGER IF NOT EXISTS trg_event_participant_day_same_event
BEFORE INSERT ON event_participant_days
WHEN (SELECT event_id FROM event_days WHERE id = NEW.event_day_id)
   != (SELECT event_id FROM event_participants WHERE id = NEW.event_participant_id)
BEGIN
  SELECT RAISE(ABORT, 'A presença e a inscrição precisam pertencer ao mesmo evento.');
END;

CREATE TABLE IF NOT EXISTS event_feedback (
  id TEXT PRIMARY KEY NOT NULL,
  event_participant_id TEXT NOT NULL UNIQUE,
  liked_event INTEGER NOT NULL CHECK (liked_event IN (0, 1)),
  arena_rating INTEGER NOT NULL CHECK (arena_rating BETWEEN 1 AND 5),
  wanted_game INTEGER NOT NULL CHECK (wanted_game IN (0, 1)),
  used_queue INTEGER NOT NULL CHECK (used_queue IN (0, 1)),
  queue_rating INTEGER CHECK (queue_rating IS NULL OR queue_rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((used_queue = 0 AND queue_rating IS NULL) OR (used_queue = 1 AND queue_rating IS NOT NULL)),
  FOREIGN KEY (event_participant_id) REFERENCES event_participants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS event_feedback_game_suggestions (
  id TEXT PRIMARY KEY NOT NULL,
  feedback_id TEXT NOT NULL,
  game_name TEXT NOT NULL,
  game_name_normalized TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (feedback_id, game_name_normalized),
  FOREIGN KEY (feedback_id) REFERENCES event_feedback(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_feedback_suggestions_name
  ON event_feedback_game_suggestions(game_name_normalized);
`;

function converterParaISO(data: string): string | null {
  const valor = data.trim();
  const br = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let ano: number;
  let mes: number;
  let dia: number;

  if (br) {
    dia = Number(br[1]);
    mes = Number(br[2]);
    ano = Number(br[3]);
  } else if (iso) {
    ano = Number(iso[1]);
    mes = Number(iso[2]);
    dia = Number(iso[3]);
  } else {
    return null;
  }

  const dataConvertida = new Date(Date.UTC(ano, mes - 1, dia));
  if (dataConvertida.getUTCFullYear() !== ano || dataConvertida.getUTCMonth() !== mes - 1 || dataConvertida.getUTCDate() !== dia) {
    return null;
  }
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function dataLocalISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

function gerarDatasDoEvento(inicio: string, termino: string): string[] {
  const dataInicial = converterParaISO(inicio);
  const dataFinal = converterParaISO(termino || inicio);
  if (!dataInicial || !dataFinal || dataFinal < dataInicial) return [];

  const datas: string[] = [];
  const atual = new Date(`${dataInicial}T12:00:00Z`);
  const limite = new Date(`${dataFinal}T12:00:00Z`);
  while (atual <= limite && datas.length < 366) {
    datas.push(atual.toISOString().slice(0, 10));
    atual.setUTCDate(atual.getUTCDate() + 1);
  }
  return datas;
}

async function preencherDiasDeEventosExistentes(db: SQLiteDatabase): Promise<void> {
  const eventos = await db.getAllAsync<{
    id: string;
    data_inicio: string;
    data_termino: string | null;
    situacao: 'agendado' | 'em_andamento' | 'encerrado';
  }>('SELECT id, data_inicio, data_termino, situacao FROM events');

  const hoje = dataLocalISO();
  for (const evento of eventos) {
    await db.withTransactionAsync(async () => {
      const datas = gerarDatasDoEvento(evento.data_inicio, evento.data_termino ?? '');
      const diaAtivo = evento.situacao === 'em_andamento'
        ? Math.max(0, datas.indexOf(hoje))
        : -1;

      for (let indice = 0; indice < datas.length; indice += 1) {
      const id = `event_day_${evento.id}_${datas[indice]}`;
      const jaExiste = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM event_days WHERE event_id = ? AND event_date = ?',
        evento.id,
        datas[indice]
      );
      if (jaExiste) continue;

      const agora = new Date().toISOString();
      const status = evento.situacao === 'encerrado'
        ? 'concluido'
        : evento.situacao === 'em_andamento' && (diaAtivo >= 0 ? indice === diaAtivo : indice === 0)
          ? 'em_andamento'
          : 'nao_iniciado';
      const iniciadoEm = status === 'em_andamento' ? agora : null;
      const concluidoEm = status === 'concluido' ? agora : null;

      await db.runAsync(
        `INSERT INTO event_days
          (id, event_id, day_number, event_date, status, created_at, updated_at, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        evento.id,
        indice + 1,
        datas[indice],
        status,
        agora,
        agora,
        iniciadoEm,
        concluidoEm
      );
      await db.runAsync(
        `INSERT INTO sync_outbox
          (id, entity_type, entity_id, operation, payload_json, created_at)
         VALUES (?, 'event_day', ?, 'upsert', ?, ?)`,
        `sync_backfill_${id}`,
        id,
        JSON.stringify({
          id,
          event_id: evento.id,
          day_number: indice + 1,
          event_date: datas[indice],
          status,
          started_at: iniciadoEm,
          completed_at: concluidoEm,
        }),
        agora
      );
      }
    });
  }
}

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const versaoAtual = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let versao = versaoAtual?.user_version ?? 0;

  if (versao < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACAO_1);
      await db.execAsync('PRAGMA user_version = 1;');
    });
    versao = 1;
  }

  if (versao < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACAO_2);
      await db.execAsync('PRAGMA user_version = 2;');
    });
    versao = 2;
  }

  if (versao < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACAO_3);
      await db.execAsync('PRAGMA user_version = 3;');
    });
  }

  await preencherDiasDeEventosExistentes(db);
}

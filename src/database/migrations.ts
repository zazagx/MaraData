import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Estrutura local do MaraData.
 *
 * O SQLite é a fonte de verdade durante o trabalho offline. A sincronização
 * com o Supabase será implementada sobre a tabela sync_outbox.
 */
const VERSAO_BANCO = 2;

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

CREATE INDEX IF NOT EXISTS idx_participants_nome_normalizado
  ON participants(nome_normalizado);
CREATE INDEX IF NOT EXISTS idx_participants_data_nascimento
  ON participants(data_nascimento);

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

CREATE INDEX IF NOT EXISTS idx_events_situacao_data
  ON events(situacao, data_inicio);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_unico_em_andamento
  ON events(situacao) WHERE situacao = 'em_andamento';

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

CREATE INDEX IF NOT EXISTS idx_event_participants_event
  ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_person
  ON event_participants(participant_id);

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

CREATE INDEX IF NOT EXISTS idx_event_queues_event
  ON event_queues(event_id);

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

CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_sequence
  ON queue_entries(queue_id, sequence_number);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'participant', 'game', 'participant_game', 'event',
    'event_participant', 'event_participant_game',
    'event_queue', 'queue_entry'
  )),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_created
  ON sync_outbox(created_at, id);

CREATE TABLE IF NOT EXISTS sync_metadata (
  chave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL
);
`;

const MIGRACAO_2 = `
ALTER TABLE participants
  ADD COLUMN mercado_games TEXT NOT NULL DEFAULT '';

ALTER TABLE participants
  ADD COLUMN interesse_profissional_games TEXT NOT NULL DEFAULT '';

-- Índice composto para buscas por nome e nascimento, sem assumir que essa
-- combinação identifica uma pessoa de forma única.
CREATE INDEX IF NOT EXISTS idx_participants_identidade
  ON participants(nome_normalizado, data_nascimento);
`;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const versaoAtual = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );

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
  }
}

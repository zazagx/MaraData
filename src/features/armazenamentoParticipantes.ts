import type { SQLiteDatabase } from 'expo-sqlite';
import { criarId, normalizarNome } from '../database/ids';

/** Dados preenchidos no formulário antes de existir um ID no banco. */
export interface DadosParticipante {
  nome: string;
  dataNascimento: string;
  genero: string;
  escolaridade: string;
  jogos: string[];
  mercadoGames: string;
  interesseProfissionalGames: string;
}

/** Participante persistido no SQLite. */
export interface Participante extends DadosParticipante {
  id: string;
  criadoEm: string;
  atualizadoEm: string;
}

type ParticipanteRow = {
  id: string;
  nome: string;
  data_nascimento: string;
  genero: string;
  escolaridade: string;
  mercado_games: string;
  interesse_profissional_games: string;
  created_at: string;
  updated_at: string;
};

type JogoRow = {
  id: string;
  nome: string;
  nome_normalizado: string;
  created_at: string;
  updated_at: string;
};

type JogoParticipanteRow = {
  participant_id: string;
  game_id: string;
  nome: string;
};

type TipoEntidadeOutbox = 'participant' | 'game' | 'participant_game';

async function registrarOutbox(
  db: SQLiteDatabase,
  entityType: TipoEntidadeOutbox,
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

async function obterOuCriarJogo(
  db: SQLiteDatabase,
  nomeInformado: string
): Promise<JogoRow> {
  const nome = nomeInformado.trim().replace(/\s+/g, ' ');
  const nomeNormalizado = normalizarNome(nome);

  if (!nomeNormalizado) {
    throw new Error('O nome do jogo não pode ficar vazio.');
  }

  const existente = await db.getFirstAsync<JogoRow>(
    `SELECT id, nome, nome_normalizado, created_at, updated_at
       FROM games
      WHERE nome_normalizado = ?`,
    nomeNormalizado
  );

  if (existente) return existente;

  const agora = new Date().toISOString();
  const novoJogo: JogoRow = {
    id: criarId('game'),
    nome,
    nome_normalizado: nomeNormalizado,
    created_at: agora,
    updated_at: agora,
  };

  await db.runAsync(
    `INSERT INTO games (id, nome, nome_normalizado, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    novoJogo.id,
    novoJogo.nome,
    novoJogo.nome_normalizado,
    novoJogo.created_at,
    novoJogo.updated_at
  );

  await registrarOutbox(db, 'game', novoJogo.id, novoJogo);
  return novoJogo;
}

/**
 * Adiciona um jogo ao catálogo local. A operação é imediata e funciona offline.
 * Se o nome já existir (ignorando acentos, caixa e espaços repetidos),
 * retorna o nome canônico já cadastrado.
 */
export async function adicionarJogo(
  db: SQLiteDatabase,
  nome: string
): Promise<string> {
  let nomeResultado = '';

  await db.withTransactionAsync(async () => {
    const jogo = await obterOuCriarJogo(db, nome);
    nomeResultado = jogo.nome;
  });

  return nomeResultado;
}

export type JogoCatalogo = { id: string; nome: string };

/** Lista o catálogo local com identificadores, inclusive jogos criados offline. */
export async function buscarCatalogoJogos(db: SQLiteDatabase): Promise<JogoCatalogo[]> {
  return db.getAllAsync<JogoCatalogo>(
    `SELECT id, nome FROM games ORDER BY nome COLLATE NOCASE ASC`
  );
}

/** Localiza ou cria um jogo no catálogo local e registra a criação na sync_outbox. */
export async function obterOuCriarJogoNoCatalogo(
  db: SQLiteDatabase,
  nome: string
): Promise<JogoCatalogo> {
  const nomeNormalizado = normalizarNome(nome.trim().replace(/\s+/g, ' '));
  if (!nomeNormalizado) throw new Error('O nome do jogo não pode ficar vazio.');

  await db.withTransactionAsync(async () => {
    await obterOuCriarJogo(db, nome);
  });

  const jogoSalvo = await db.getFirstAsync<JogoRow>(
    `SELECT id, nome, nome_normalizado, created_at, updated_at
       FROM games WHERE nome_normalizado = ?`,
    nomeNormalizado
  );
  if (!jogoSalvo) throw new Error('Não foi possível salvar o jogo no catálogo.');
  return { id: jogoSalvo.id, nome: jogoSalvo.nome };
}

/** Lista o catálogo persistido, inicialmente vazio. */
export async function buscarJogos(db: SQLiteDatabase): Promise<string[]> {
  const jogos = await buscarCatalogoJogos(db);
  return jogos.map((jogo) => jogo.nome);
}

/**
 * Salva um participante e suas relações com os jogos em uma única transação.
 * Também registra cada alteração na outbox para a futura sincronização.
 */
export async function salvarParticipante(
  db: SQLiteDatabase,
  dados: DadosParticipante
): Promise<Participante> {
  let participanteSalvo: Participante | null = null;

  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    const nome = dados.nome.trim().replace(/\s+/g, ' ');
    const nomeNormalizado = normalizarNome(nome);

    const novoParticipante: Participante = {
      id: criarId('participant'),
      nome,
      dataNascimento: dados.dataNascimento,
      genero: dados.genero,
      escolaridade: dados.escolaridade,
      jogos: [],
      mercadoGames: dados.mercadoGames,
      interesseProfissionalGames: dados.interesseProfissionalGames,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    await db.runAsync(
      `INSERT INTO participants (
        id, nome, nome_normalizado, data_nascimento, genero, escolaridade,
        mercado_games, interesse_profissional_games, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      novoParticipante.id,
      novoParticipante.nome,
      nomeNormalizado,
      novoParticipante.dataNascimento,
      novoParticipante.genero,
      novoParticipante.escolaridade,
      novoParticipante.mercadoGames,
      novoParticipante.interesseProfissionalGames,
      novoParticipante.criadoEm,
      novoParticipante.atualizadoEm
    );

    await registrarOutbox(db, 'participant', novoParticipante.id, {
      id: novoParticipante.id,
      nome: novoParticipante.nome,
      nome_normalizado: nomeNormalizado,
      data_nascimento: novoParticipante.dataNascimento,
      genero: novoParticipante.genero,
      escolaridade: novoParticipante.escolaridade,
      mercado_games: novoParticipante.mercadoGames,
      interesse_profissional_games: novoParticipante.interesseProfissionalGames,
      created_at: novoParticipante.criadoEm,
      updated_at: novoParticipante.atualizadoEm,
    });

    const jogosUnicos = Array.from(
      new Map(
        dados.jogos
          .map((jogo) => jogo.trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .map((jogo) => [normalizarNome(jogo), jogo] as const)
      ).values()
    );

    const nomesSalvos: string[] = [];

    for (const nomeJogo of jogosUnicos) {
      const jogo = await obterOuCriarJogo(db, nomeJogo);
      await db.runAsync(
        `INSERT INTO participant_games (participant_id, game_id, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(participant_id, game_id) DO NOTHING`,
        novoParticipante.id,
        jogo.id,
        agora
      );

      await registrarOutbox(
        db,
        'participant_game',
        `${novoParticipante.id}:${jogo.id}`,
        {
          participant_id: novoParticipante.id,
          game_id: jogo.id,
          created_at: agora,
        }
      );
      nomesSalvos.push(jogo.nome);
    }

    participanteSalvo = {
      ...novoParticipante,
      jogos: nomesSalvos,
    };
  });

  if (!participanteSalvo) {
    throw new Error('Não foi possível concluir o cadastro do participante.');
  }

  return participanteSalvo;
}

/** Busca todos os participantes com seus jogos vinculados. */
export async function buscarParticipantes(
  db: SQLiteDatabase
): Promise<Participante[]> {
  const rows = await db.getAllAsync<ParticipanteRow>(
    `SELECT
       id, nome, data_nascimento, genero, escolaridade,
       mercado_games, interesse_profissional_games, created_at, updated_at
     FROM participants
     ORDER BY nome COLLATE NOCASE ASC`
  );

  if (rows.length === 0) return [];

  const jogosRows = await db.getAllAsync<JogoParticipanteRow>(
    `SELECT pg.participant_id, pg.game_id, g.nome
       FROM participant_games pg
       INNER JOIN games g ON g.id = pg.game_id
      ORDER BY g.nome COLLATE NOCASE ASC`
  );

  const jogosPorParticipante = new Map<string, string[]>();
  for (const row of jogosRows) {
    const lista = jogosPorParticipante.get(row.participant_id) ?? [];
    lista.push(row.nome);
    jogosPorParticipante.set(row.participant_id, lista);
  }

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    genero: row.genero,
    escolaridade: row.escolaridade,
    jogos: jogosPorParticipante.get(row.id) ?? [],
    mercadoGames: row.mercado_games,
    interesseProfissionalGames: row.interesse_profissional_games,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  }));
}


/** Busca um único participante pelo identificador persistido. */
export async function buscarParticipantePorId(
  db: SQLiteDatabase,
  id: string
): Promise<Participante | null> {
  const row = await db.getFirstAsync<ParticipanteRow>(
    `SELECT
       id, nome, data_nascimento, genero, escolaridade,
       mercado_games, interesse_profissional_games, created_at, updated_at
     FROM participants
     WHERE id = ?`,
    id
  );

  if (!row) return null;

  const jogosRows = await db.getAllAsync<Pick<JogoParticipanteRow, 'nome'>>(
    `SELECT g.nome
       FROM participant_games pg
       INNER JOIN games g ON g.id = pg.game_id
      WHERE pg.participant_id = ?
      ORDER BY g.nome COLLATE NOCASE ASC`,
    id
  );

  return {
    id: row.id,
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    genero: row.genero,
    escolaridade: row.escolaridade,
    jogos: jogosRows.map((jogo) => jogo.nome),
    mercadoGames: row.mercado_games,
    interesseProfissionalGames: row.interesse_profissional_games,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

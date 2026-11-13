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

async function prepararPayload(
  db: SQLiteDatabase,
  registro: RegistroOutbox,
  payloadOriginal: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const payload = { ...payloadOriginal };

  // O array `suggestions` é metadado local; as sugestões são enviadas como
  // linhas próprias em event_feedback_game_suggestions.
  if (registro.entity_type === 'event_feedback') {
    delete payload.suggestions;
  }

  if (registro.entity_type === 'event_day') {
    const datas = await db.getFirstAsync<{ created_at: string; updated_at: string }>(
      'SELECT created_at, updated_at FROM event_days WHERE id = ?',
      registro.entity_id
    );
    if (datas) {
      payload.created_at ??= datas.created_at;
      payload.updated_at ??= datas.updated_at;
    } else {
      const agora = new Date().toISOString();
      payload.created_at ??= agora;
      payload.updated_at ??= agora;
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

    for (const registro of registros) {
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

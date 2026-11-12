import type { SQLiteDatabase } from 'expo-sqlite';
import { criarId, normalizarNome } from '../database/ids';
import type { Participante } from './armazenamentoParticipantes';

export type StatusDiaEvento = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'nao_realizado';

export interface DiaEvento {
  id: string;
  eventId: string;
  numero: number;
  data: string;
  status: StatusDiaEvento;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  totalParticipantes: number;
}

export interface ResumoPresencasEvento {
  participantesInscritos: number;
  participantesUnicosPresentes: number;
  totalPresencas: number;
  participantesRecorrentes: number;
  participantesUmaVez: number;
}

export interface FeedbackParticipante {
  id: string;
  eventParticipantId: string;
  gostouEvento: boolean;
  avaliacaoArena: number;
  desejouOutroJogo: boolean;
  utilizouFila: boolean;
  avaliacaoFila: number | null;
  sugestoesJogos: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface DadosFeedback {
  gostouEvento: boolean;
  avaliacaoArena: number;
  desejouOutroJogo: boolean;
  sugestoesJogos: string[];
  utilizouFila: boolean;
  avaliacaoFila: number | null;
}

export interface ParticipanteFeedbackLista {
  id: string;
  eventParticipantId: string;
  nome: string;
  feedbackRegistrado: boolean;
  gostouEvento: boolean | null;
  avaliacaoArena: number | null;
  avaliacaoFila: number | null;
}

function dataParaISO(valor: string): string | null {
  const texto = valor.trim();
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let ano: number;
  let mes: number;
  let dia: number;
  if (br) {
    dia = Number(br[1]); mes = Number(br[2]); ano = Number(br[3]);
  } else if (iso) {
    ano = Number(iso[1]); mes = Number(iso[2]); dia = Number(iso[3]);
  } else return null;

  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function gerarIntervaloDatas(inicio: string, termino: string): string[] {
  const primeiro = dataParaISO(inicio);
  const ultimo = dataParaISO(termino || inicio);
  if (!primeiro || !ultimo || ultimo < primeiro) {
    throw new Error('As datas do evento são inválidas. Confira o cadastro do evento.');
  }
  const resultado: string[] = [];
  const cursor = new Date(`${primeiro}T12:00:00Z`);
  const final = new Date(`${ultimo}T12:00:00Z`);
  while (cursor <= final) {
    resultado.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (resultado.length > 366) throw new Error('O evento não pode ter mais de 366 dias.');
  }
  return resultado;
}

function dataLocalISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

async function registrarOutbox(
  db: SQLiteDatabase,
  tipo: 'event_day' | 'event_participant_day' | 'event_feedback' | 'event_feedback_game_suggestion',
  entityId: string,
  operacao: 'upsert' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    criarId('sync'), tipo, entityId, operacao, JSON.stringify(payload), new Date().toISOString()
  );
}

async function registrarDiaOutbox(db: SQLiteDatabase, dia: DiaEvento): Promise<void> {
  await registrarOutbox(db, 'event_day', dia.id, 'upsert', {
    id: dia.id,
    event_id: dia.eventId,
    day_number: dia.numero,
    event_date: dia.data,
    status: dia.status,
    started_at: dia.iniciadaEm,
    completed_at: dia.concluidaEm,
  });
}

/** Deve ser chamada dentro da transação de salvamento do evento. */
export async function sincronizarDiasDoEventoNoBanco(
  db: SQLiteDatabase,
  event: { id: string; dataInicio: string; dataTermino: string; situacao: string },
  iniciarDiaSeNecessario: boolean
): Promise<void> {
  const datasDesejadas = gerarIntervaloDatas(event.dataInicio, event.dataTermino);
  const existentes = await db.getAllAsync<{
    id: string; event_date: string; status: StatusDiaEvento;
  }>(
    'SELECT id, event_date, status FROM event_days WHERE event_id = ? ORDER BY day_number', event.id
  );
  const datasExistentes = existentes.map((dia) => dia.event_date);
  const mudouIntervalo = datasExistentes.length > 0 && (
    datasExistentes.length !== datasDesejadas.length ||
    datasExistentes.some((data, indice) => data !== datasDesejadas[indice])
  );

  if (mudouIntervalo) {
    const possuiHistorico = existentes.some((dia) => dia.status !== 'nao_iniciado');
    const presencas = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM event_participant_days epd
       INNER JOIN event_days ed ON ed.id = epd.event_day_id
       WHERE ed.event_id = ?`, event.id
    );
    if (possuiHistorico || (presencas?.total ?? 0) > 0) {
      throw new Error('As datas deste evento não podem ser alteradas depois que um dia foi iniciado ou recebeu presenças.');
    }

    for (const dia of existentes) {
      await registrarOutbox(db, 'event_day', dia.id, 'delete', { id: dia.id, event_id: event.id });
    }
    await db.runAsync('DELETE FROM event_days WHERE event_id = ?', event.id);
  }

  if (datasExistentes.length === 0 || mudouIntervalo) {
    for (let indice = 0; indice < datasDesejadas.length; indice += 1) {
      const agora = new Date().toISOString();
      const dia: DiaEvento = {
        id: criarId('event_day'),
        eventId: event.id,
        numero: indice + 1,
        data: datasDesejadas[indice],
        status: 'nao_iniciado',
        iniciadaEm: null,
        concluidaEm: null,
        totalParticipantes: 0,
      };
      await db.runAsync(
        `INSERT INTO event_days
          (id, event_id, day_number, event_date, status, created_at, updated_at, started_at, completed_at)
         VALUES (?, ?, ?, ?, 'nao_iniciado', ?, ?, NULL, NULL)`,
        dia.id, dia.eventId, dia.numero, dia.data, agora, agora
      );
      await registrarDiaOutbox(db, dia);
    }
  }

  if (event.situacao === 'em_andamento' && iniciarDiaSeNecessario) {
    const diaAtivo = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM event_days WHERE event_id = ? AND status = 'em_andamento' LIMIT 1`, event.id
    );
    if (!diaAtivo) {
      const hoje = dataLocalISO();
      const escolhido = await db.getFirstAsync<{ id: string; day_number: number; event_date: string }>(
        `SELECT id, day_number, event_date FROM event_days
          WHERE event_id = ? AND status = 'nao_iniciado'
          ORDER BY CASE WHEN event_date = ? THEN 0 ELSE 1 END, day_number LIMIT 1`,
        event.id, hoje
      );
      if (escolhido) {
        const agora = new Date().toISOString();
        await db.runAsync(
          `UPDATE event_days SET status = 'em_andamento', started_at = ?, updated_at = ? WHERE id = ?`,
          agora, agora, escolhido.id
        );
        await registrarDiaOutbox(db, {
          id: escolhido.id, eventId: event.id, numero: escolhido.day_number,
          data: escolhido.event_date, status: 'em_andamento', iniciadaEm: agora,
          concluidaEm: null, totalParticipantes: 0,
        });
      }
    }
  }
}

export async function buscarDiasEvento(db: SQLiteDatabase, eventId: string): Promise<DiaEvento[]> {
  const rows = await db.getAllAsync<{
    id: string; event_id: string; day_number: number; event_date: string; status: StatusDiaEvento;
    started_at: string | null; completed_at: string | null; total_participantes: number;
  }>(
    `SELECT ed.id, ed.event_id, ed.day_number, ed.event_date, ed.status,
            ed.started_at, ed.completed_at,
            COUNT(epd.id) AS total_participantes
       FROM event_days ed
       LEFT JOIN event_participant_days epd ON epd.event_day_id = ed.id
      WHERE ed.event_id = ?
      GROUP BY ed.id
      ORDER BY ed.day_number`, eventId
  );
  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    numero: row.day_number,
    data: row.event_date,
    status: row.status,
    iniciadaEm: row.started_at,
    concluidaEm: row.completed_at,
    totalParticipantes: row.total_participantes,
  }));
}

export async function iniciarDiaEvento(db: SQLiteDatabase, eventDayId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    const dia = await db.getFirstAsync<{
      id: string; event_id: string; day_number: number; event_date: string; status: StatusDiaEvento;
    }>('SELECT id, event_id, day_number, event_date, status FROM event_days WHERE id = ?', eventDayId);
    if (!dia) throw new Error('Dia do evento não encontrado.');
    const evento = await db.getFirstAsync<{ situacao: string }>(
      'SELECT situacao FROM events WHERE id = ?', dia.event_id
    );
    if (evento?.situacao !== 'em_andamento') throw new Error('Inicie o evento antes de iniciar um dia.');
    if (dia.status === 'concluido' || dia.status === 'nao_realizado') {
      throw new Error('Este dia já foi finalizado e não pode ser iniciado novamente.');
    }
    const outroAtivo = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM event_days WHERE event_id = ? AND status = 'em_andamento' AND id <> ? LIMIT 1`,
      dia.event_id, dia.id
    );
    if (outroAtivo) throw new Error('Conclua o dia que está em andamento antes de iniciar outro.');
    const agora = new Date().toISOString();
    await db.runAsync(
      `UPDATE event_days SET status = 'em_andamento', started_at = COALESCE(started_at, ?), updated_at = ? WHERE id = ?`,
      agora, agora, dia.id
    );
    await registrarDiaOutbox(db, {
      id: dia.id, eventId: dia.event_id, numero: dia.day_number, data: dia.event_date,
      status: 'em_andamento', iniciadaEm: agora, concluidaEm: null, totalParticipantes: 0,
    });
  });
}

export async function concluirDiaEvento(db: SQLiteDatabase, eventDayId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    const dia = await db.getFirstAsync<{
      id: string; event_id: string; day_number: number; event_date: string; status: StatusDiaEvento;
    }>('SELECT id, event_id, day_number, event_date, status FROM event_days WHERE id = ?', eventDayId);
    if (!dia) throw new Error('Dia do evento não encontrado.');
    if (dia.status !== 'em_andamento') throw new Error('Somente um dia em andamento pode ser concluído.');
    const agora = new Date().toISOString();
    await db.runAsync(
      `UPDATE event_days SET status = 'concluido', completed_at = ?, updated_at = ? WHERE id = ?`,
      agora, agora, dia.id
    );
    await registrarDiaOutbox(db, {
      id: dia.id, eventId: dia.event_id, numero: dia.day_number, data: dia.event_date,
      status: 'concluido', iniciadaEm: null, concluidaEm: agora, totalParticipantes: 0,
    });
  });
}

/** Registra presença no dia operacional atual; deve ser chamada na transação que vincula o participante. */
export async function registrarPresencaNoDiaAtivo(
  db: SQLiteDatabase,
  eventId: string,
  eventParticipantId: string,
  source: 'manual' | 'fila' = 'fila'
): Promise<void> {
  const dia = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM event_days WHERE event_id = ? AND status = 'em_andamento' LIMIT 1`, eventId
  );
  if (!dia) return;
  const existente = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM event_participant_days WHERE event_day_id = ? AND event_participant_id = ?',
    dia.id, eventParticipantId
  );
  if (existente) return;

  const id = criarId('event_presence');
  const agora = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO event_participant_days
      (id, event_day_id, event_participant_id, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, dia.id, eventParticipantId, source, agora, agora
  );
  await registrarOutbox(db, 'event_participant_day', id, 'upsert', {
    id, event_day_id: dia.id, event_participant_id: eventParticipantId,
    source, created_at: agora, updated_at: agora,
  });
}

export async function definirPresencaManual(
  db: SQLiteDatabase,
  eventDayId: string,
  participantId: string,
  presente: boolean
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const relacao = await db.getFirstAsync<{
      event_participant_id: string; event_id: string; event_status: string; day_status: StatusDiaEvento;
    }>(
      `SELECT ep.id AS event_participant_id, ep.event_id,
              e.situacao AS event_status, ed.status AS day_status
         FROM event_days ed
         INNER JOIN events e ON e.id = ed.event_id
         INNER JOIN event_participants ep ON ep.event_id = ed.event_id AND ep.participant_id = ?
        WHERE ed.id = ?`,
      participantId, eventDayId
    );
    if (!relacao) throw new Error('Este participante não está vinculado ao evento.');
    // Dias concluídos de eventos encerrados continuam editáveis para correções históricas.
    if (relacao.day_status === 'nao_iniciado' || relacao.day_status === 'nao_realizado') {
      throw new Error('Inicie este dia antes de registrar presenças.');
    }

    const atual = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM event_participant_days WHERE event_day_id = ? AND event_participant_id = ?',
      eventDayId, relacao.event_participant_id
    );
    if (presente && !atual) {
      const id = criarId('event_presence');
      const agora = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO event_participant_days
          (id, event_day_id, event_participant_id, source, created_at, updated_at)
         VALUES (?, ?, ?, 'manual', ?, ?)`,
        id, eventDayId, relacao.event_participant_id, agora, agora
      );
      await registrarOutbox(db, 'event_participant_day', id, 'upsert', {
        id, event_day_id: eventDayId, event_participant_id: relacao.event_participant_id,
        source: 'manual', created_at: agora, updated_at: agora,
      });
    } else if (!presente && atual) {
      await db.runAsync('DELETE FROM event_participant_days WHERE id = ?', atual.id);
      await registrarOutbox(db, 'event_participant_day', atual.id, 'delete', { id: atual.id });
    }
  });
}

export async function buscarParticipantesDoDia(
  db: SQLiteDatabase,
  eventDayId: string
): Promise<Participante[]> {
  const rows = await db.getAllAsync<{
    participant_id: string; nome: string; data_nascimento: string; genero: string;
    escolaridade: string; mercado_games: string; interesse_profissional_games: string; created_at: string;
  }>(
    `SELECT ep.participant_id, ep.nome_snapshot AS nome,
            ep.data_nascimento_snapshot AS data_nascimento, ep.genero_snapshot AS genero,
            ep.escolaridade_snapshot AS escolaridade, ep.mercado_games,
            ep.interesse_profissional_games, epd.created_at
       FROM event_participant_days epd
       INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
      WHERE epd.event_day_id = ?
      ORDER BY ep.nome_snapshot COLLATE NOCASE`, eventDayId
  );
  const jogos = await db.getAllAsync<{ participant_id: string; nome: string }>(
    `SELECT ep.participant_id, g.nome
       FROM event_participant_days epd
       INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
       INNER JOIN event_participant_games epg ON epg.event_participant_id = ep.id
       INNER JOIN games g ON g.id = epg.game_id
      WHERE epd.event_day_id = ?
      ORDER BY g.nome COLLATE NOCASE`, eventDayId
  );
  const jogosPorParticipante = new Map<string, string[]>();
  for (const jogo of jogos) {
    const lista = jogosPorParticipante.get(jogo.participant_id) ?? [];
    lista.push(jogo.nome);
    jogosPorParticipante.set(jogo.participant_id, lista);
  }
  return rows.map((row) => ({
    id: row.participant_id,
    nome: row.nome,
    dataNascimento: row.data_nascimento,
    genero: row.genero,
    escolaridade: row.escolaridade,
    jogos: jogosPorParticipante.get(row.participant_id) ?? [],
    mercadoGames: row.mercado_games,
    interesseProfissionalGames: row.interesse_profissional_games,
    criadoEm: row.created_at,
    atualizadoEm: row.created_at,
  }));
}

export async function buscarIdsPresentesNoDia(db: SQLiteDatabase, eventDayId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ participant_id: string }>(
    `SELECT ep.participant_id
       FROM event_participant_days epd
       INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
      WHERE epd.event_day_id = ?`, eventDayId
  );
  return rows.map((row) => row.participant_id);
}

export async function buscarResumoPresencasEvento(
  db: SQLiteDatabase,
  eventId: string
): Promise<ResumoPresencasEvento> {
  const row = await db.getFirstAsync<{
    inscritos: number; unicos: number; presencas: number; recorrentes: number; uma_vez: number;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM event_participants WHERE event_id = ?) AS inscritos,
       (SELECT COUNT(DISTINCT ep.participant_id)
          FROM event_participant_days epd
          INNER JOIN event_days ed ON ed.id = epd.event_day_id
          INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
         WHERE ed.event_id = ?) AS unicos,
       (SELECT COUNT(*) FROM event_participant_days epd
          INNER JOIN event_days ed ON ed.id = epd.event_day_id
         WHERE ed.event_id = ?) AS presencas,
       (SELECT COUNT(*) FROM (
          SELECT epd.event_participant_id
            FROM event_participant_days epd
            INNER JOIN event_days ed ON ed.id = epd.event_day_id
            INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
           WHERE ed.event_id = ?
           GROUP BY epd.event_participant_id HAVING COUNT(*) > 1
       )) AS recorrentes,
       (SELECT COUNT(*) FROM (
          SELECT epd.event_participant_id
            FROM event_participant_days epd
            INNER JOIN event_days ed ON ed.id = epd.event_day_id
            INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
           WHERE ed.event_id = ?
           GROUP BY epd.event_participant_id HAVING COUNT(*) = 1
       )) AS uma_vez`,
    eventId, eventId, eventId, eventId, eventId
  );
  return {
    participantesInscritos: row?.inscritos ?? 0,
    participantesUnicosPresentes: row?.unicos ?? 0,
    totalPresencas: row?.presencas ?? 0,
    participantesRecorrentes: row?.recorrentes ?? 0,
    participantesUmaVez: row?.uma_vez ?? 0,
  };
}

export async function buscarListaFeedbackEvento(
  db: SQLiteDatabase,
  eventId: string
): Promise<ParticipanteFeedbackLista[]> {
  const rows = await db.getAllAsync<{
    participant_id: string; event_participant_id: string; nome: string; feedback_id: string | null;
    liked_event: number | null; arena_rating: number | null; queue_rating: number | null;
  }>(
    `SELECT ep.participant_id, ep.id AS event_participant_id, ep.nome_snapshot AS nome,
            f.id AS feedback_id, f.liked_event, f.arena_rating, f.queue_rating
       FROM event_participants ep
       LEFT JOIN event_feedback f ON f.event_participant_id = ep.id
      WHERE ep.event_id = ?
      ORDER BY ep.nome_snapshot COLLATE NOCASE`, eventId
  );
  return rows.map((row) => ({
    id: row.participant_id,
    eventParticipantId: row.event_participant_id,
    nome: row.nome,
    feedbackRegistrado: Boolean(row.feedback_id),
    gostouEvento: row.liked_event === null ? null : row.liked_event === 1,
    avaliacaoArena: row.arena_rating,
    avaliacaoFila: row.queue_rating,
  }));
}

export async function buscarFeedbackParticipanteEvento(
  db: SQLiteDatabase,
  eventId: string,
  participantId: string
): Promise<FeedbackParticipante | null> {
  const row = await db.getFirstAsync<{
    id: string; event_participant_id: string; liked_event: number; arena_rating: number;
    wanted_game: number; used_queue: number; queue_rating: number | null;
    created_at: string; updated_at: string;
  }>(
    `SELECT f.id, f.event_participant_id, f.liked_event, f.arena_rating,
            f.wanted_game, f.used_queue, f.queue_rating, f.created_at, f.updated_at
       FROM event_feedback f
       INNER JOIN event_participants ep ON ep.id = f.event_participant_id
      WHERE ep.event_id = ? AND ep.participant_id = ?`,
    eventId, participantId
  );
  if (!row) return null;
  const sugestoes = await db.getAllAsync<{ game_name: string }>(
    `SELECT game_name FROM event_feedback_game_suggestions WHERE feedback_id = ? ORDER BY game_name COLLATE NOCASE`,
    row.id
  );
  return {
    id: row.id,
    eventParticipantId: row.event_participant_id,
    gostouEvento: row.liked_event === 1,
    avaliacaoArena: row.arena_rating,
    desejouOutroJogo: row.wanted_game === 1,
    utilizouFila: row.used_queue === 1,
    avaliacaoFila: row.queue_rating,
    sugestoesJogos: sugestoes.map((item) => item.game_name),
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

export async function salvarFeedbackParticipanteEvento(
  db: SQLiteDatabase,
  eventId: string,
  participantId: string,
  dados: DadosFeedback
): Promise<void> {
  if (!Number.isInteger(dados.avaliacaoArena) || dados.avaliacaoArena < 1 || dados.avaliacaoArena > 5) {
    throw new Error('Avalie a Arena com uma quantidade de estrelas entre 1 e 5.');
  }
  if (dados.utilizouFila && (!Number.isInteger(dados.avaliacaoFila) || (dados.avaliacaoFila ?? 0) < 1 || (dados.avaliacaoFila ?? 0) > 5)) {
    throw new Error('Avalie a experiência com a fila entre 1 e 5 estrelas.');
  }
  const sugestoes = Array.from(new Map(
    dados.sugestoesJogos.map((nome) => nome.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .map((nome) => [normalizarNome(nome), nome] as const)
  ).values());
  if (dados.desejouOutroJogo && sugestoes.length === 0) {
    throw new Error('Informe pelo menos um jogo desejado.');
  }

  await db.withTransactionAsync(async () => {
    const eventParticipant = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM event_participants WHERE event_id = ? AND participant_id = ?', eventId, participantId
    );
    if (!eventParticipant) throw new Error('Este participante não está vinculado ao evento.');

    const agora = new Date().toISOString();
    const feedbackExistente = await db.getFirstAsync<{ id: string; created_at: string }>(
      'SELECT id, created_at FROM event_feedback WHERE event_participant_id = ?', eventParticipant.id
    );
    const feedbackId = feedbackExistente?.id ?? criarId('feedback');
    const criadoEm = feedbackExistente?.created_at ?? agora;

    await db.runAsync(
      `INSERT INTO event_feedback
        (id, event_participant_id, liked_event, arena_rating, wanted_game, used_queue, queue_rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(event_participant_id) DO UPDATE SET
         liked_event = excluded.liked_event,
         arena_rating = excluded.arena_rating,
         wanted_game = excluded.wanted_game,
         used_queue = excluded.used_queue,
         queue_rating = excluded.queue_rating,
         updated_at = excluded.updated_at`,
      feedbackId, eventParticipant.id, dados.gostouEvento ? 1 : 0,
      dados.avaliacaoArena, dados.desejouOutroJogo ? 1 : 0,
      dados.utilizouFila ? 1 : 0, dados.utilizouFila ? dados.avaliacaoFila : null,
      criadoEm, agora
    );

    const sugestoesAntigas = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM event_feedback_game_suggestions WHERE feedback_id = ?', feedbackId
    );
    for (const antiga of sugestoesAntigas) {
      await registrarOutbox(db, 'event_feedback_game_suggestion', antiga.id, 'delete', { id: antiga.id });
    }
    await db.runAsync('DELETE FROM event_feedback_game_suggestions WHERE feedback_id = ?', feedbackId);

    for (const nome of sugestoes) {
      const id = criarId('feedback_game');
      const normalizado = normalizarNome(nome);
      await db.runAsync(
        `INSERT INTO event_feedback_game_suggestions
          (id, feedback_id, game_name, game_name_normalized, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        id, feedbackId, nome, normalizado, agora
      );
      await registrarOutbox(db, 'event_feedback_game_suggestion', id, 'upsert', {
        id, feedback_id: feedbackId, game_name: nome,
        game_name_normalized: normalizado, created_at: agora,
      });
    }

    await registrarOutbox(db, 'event_feedback', feedbackId, 'upsert', {
      id: feedbackId,
      event_participant_id: eventParticipant.id,
      liked_event: dados.gostouEvento ? 1 : 0,
      arena_rating: dados.avaliacaoArena,
      wanted_game: dados.desejouOutroJogo ? 1 : 0,
      used_queue: dados.utilizouFila ? 1 : 0,
      queue_rating: dados.utilizouFila ? dados.avaliacaoFila : null,
      suggestions: sugestoes,
      created_at: criadoEm,
      updated_at: agora,
    });
  });
}

export function formatarDataDiaEvento(dataISO: string): string {
  return formatarData(dataISO);
}

/** Finaliza o dia operacional e marca dias futuros como não realizados ao encerrar o evento. */
export async function finalizarDiasAoEncerrarEvento(db: SQLiteDatabase, eventId: string): Promise<void> {
  const dias = await db.getAllAsync<{
    id: string; day_number: number; event_date: string; status: StatusDiaEvento;
    started_at: string | null; completed_at: string | null;
  }>(
    `SELECT id, day_number, event_date, status, started_at, completed_at
       FROM event_days WHERE event_id = ? AND status IN ('em_andamento', 'nao_iniciado')`,
    eventId
  );
  const agora = new Date().toISOString();
  for (const dia of dias) {
    const status: StatusDiaEvento = dia.status === 'em_andamento' ? 'concluido' : 'nao_realizado';
    const concluidaEm = status === 'concluido' ? agora : null;
    await db.runAsync(
      'UPDATE event_days SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      status, concluidaEm, agora, dia.id
    );
    await registrarDiaOutbox(db, {
      id: dia.id,
      eventId,
      numero: dia.day_number,
      data: dia.event_date,
      status,
      iniciadaEm: dia.started_at,
      concluidaEm,
      totalParticipantes: 0,
    });
  }
}

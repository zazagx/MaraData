import type { SQLiteDatabase } from 'expo-sqlite';
import { criarId } from '../database/ids';

export type FaixaEtaria = {
  faixa: string;
  quantidade: number;
  porcentagem: number;
};

export type IndicadorSimNao = {
  sim: number;
  nao: number;
  total: number;
};

export type RankingJogo = {
  nome: string;
  quantidade: number;
  participantes: number;
};

export type DiaEstatistica = {
  id: string;
  numero: number;
  data: string;
  status: string;
  participantes: number;
};

export type FeedbackEstatistica = {
  total: number;
  gostaram: number;
  naoGostaram: number;
  mediaArena: number | null;
  notasArena: number[];
  queriamOutroJogo: number;
  naoQueriamOutroJogo: number;
  usaramFila: number;
  naoUsaramFila: number;
  mediaFila: number | null;
  notasFila: number[];
  jogosSolicitados: RankingJogo[];
};

export type EventoListaEstatistica = {
  id: string;
  nome: string;
  dataInicio: string;
  dataTermino: string | null;
  situacao: string;
  presentes: number;
  presencas: number;
  encerradoEm: string | null;
};

export type EstatisticasEvento = {
  evento: EventoListaEstatistica;
  inscritos: number;
  presentes: number;
  presencas: number;
  retornaramEmMaisDeUmDia: number;
  maiorFaixaEtaria: string | null;
  dias: DiaEstatistica[];
  faixasEtarias: FaixaEtaria[];
  conhecimentoMercado: IndicadorSimNao;
  interesseProfissional: IndicadorSimNao;
  jogosInteresse: RankingJogo[];
  jogosJogados: RankingJogo[];
  feedback: FeedbackEstatistica;
  filas: {
    total: number;
    entradas: number;
    atendimentos: number;
    aguardando: number;
  };
};

export type EstatisticasGerais = {
  participantesCadastrados: number;
  eventosRealizados: number;
  pessoasQueJaCompareceram: number;
  totalPresencas: number;
  pessoasQueRetornaram: number;
  taxaRetorno: number;
  satisfacaoMediaGeral: number | null;
  taxaAprovacaoEventos: number;
  totalAvaliacoes: number;
  conhecimentoMercado: IndicadorSimNao;
  interesseProfissional: IndicadorSimNao;
  faixasEtarias: FaixaEtaria[];
  maiorFaixaEtaria: string | null;
  jogosInteresse: RankingJogo[];
  jogosJogados: RankingJogo[];
  jogosSolicitados: RankingJogo[];
  crescimentoPublico: EventoListaEstatistica[];
  ultimoEvento: EstatisticasEvento | null;
};

export type OpcaoRegistroJogo = {
  eventParticipantId: string;
  participantId: string;
  nome: string;
};

export type OpcaoDiaRegistroJogo = {
  id: string;
  numero: number;
  data: string;
  status: 'nao_iniciado' | 'em_andamento' | 'concluido' | 'nao_realizado';
};

export type OpcaoJogoRegistro = { id: string; nome: string };

function numero(valor: unknown): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function percentual(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

function dataEmPartes(valor: string): { ano: number; mes: number; dia: number } | null {
  const texto = String(valor ?? '').trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (iso) return { ano: Number(iso[1]), mes: Number(iso[2]), dia: Number(iso[3]) };
  if (br) return { ano: Number(br[3]), mes: Number(br[2]), dia: Number(br[1]) };
  return null;
}

function calcularIdade(nascimento: string, referencia: string): number | null {
  const n = dataEmPartes(nascimento);
  const r = dataEmPartes(referencia);
  if (!n || !r) return null;
  const dataNasc = new Date(Date.UTC(n.ano, n.mes - 1, n.dia));
  if (dataNasc.getUTCFullYear() !== n.ano || dataNasc.getUTCMonth() !== n.mes - 1 || dataNasc.getUTCDate() !== n.dia) return null;
  let idade = r.ano - n.ano;
  if (r.mes < n.mes || (r.mes === n.mes && r.dia < n.dia)) idade -= 1;
  return idade >= 0 && idade <= 120 ? idade : null;
}

function nomeFaixa(idade: number): string {
  if (idade <= 12) return 'Até 12 anos';
  if (idade <= 17) return '13 a 17 anos';
  if (idade <= 24) return '18 a 24 anos';
  if (idade <= 34) return '25 a 34 anos';
  if (idade <= 44) return '35 a 44 anos';
  return '45 anos ou mais';
}

const ORDEM_FAIXAS = ['Até 12 anos', '13 a 17 anos', '18 a 24 anos', '25 a 34 anos', '35 a 44 anos', '45 anos ou mais'];

function calcularFaixas(
  linhas: Array<{ data_nascimento: string }>,
  referencia: string
): FaixaEtaria[] {
  const contagem = new Map<string, number>(ORDEM_FAIXAS.map((faixa) => [faixa, 0]));
  for (const linha of linhas) {
    const idade = calcularIdade(linha.data_nascimento, referencia);
    if (idade === null) continue;
    const faixa = nomeFaixa(idade);
    contagem.set(faixa, (contagem.get(faixa) ?? 0) + 1);
  }
  const total = Array.from(contagem.values()).reduce((soma, valor) => soma + valor, 0);
  return ORDEM_FAIXAS.map((faixa) => {
    const quantidade = contagem.get(faixa) ?? 0;
    return { faixa, quantidade, porcentagem: total ? Math.round((quantidade / total) * 100) : 0 };
  });
}

function calcularSimNao(linhas: Array<{ valor: string }>): IndicadorSimNao {
  let sim = 0;
  let nao = 0;
  for (const linha of linhas) {
    const valor = String(linha.valor ?? '').trim().toLocaleLowerCase('pt-BR');
    if (valor === 'sim' || valor === 'yes') sim += 1;
    else if (valor === 'não' || valor === 'nao' || valor === 'no') nao += 1;
  }
  return { sim, nao, total: sim + nao };
}

function formatarIndicadorSimNao(linhas: Array<{ valor: string }>): IndicadorSimNao {
  return calcularSimNao(linhas);
}

async function buscarPerfilParticipantes(
  db: SQLiteDatabase,
  referencia: string,
  eventId?: string
): Promise<{
  faixasEtarias: FaixaEtaria[];
  conhecimentoMercado: IndicadorSimNao;
  interesseProfissional: IndicadorSimNao;
}> {
  const linhas = eventId
    ? await db.getAllAsync<{
        data_nascimento: string;
        mercado_games: string;
        interesse_profissional_games: string;
      }>(
        `SELECT data_nascimento_snapshot AS data_nascimento,
                mercado_games, interesse_profissional_games
           FROM event_participants WHERE event_id = ?`, eventId
      )
    : await db.getAllAsync<{
        data_nascimento: string;
        mercado_games: string;
        interesse_profissional_games: string;
      }>(
        `SELECT data_nascimento, mercado_games, interesse_profissional_games FROM participants`
      );

  return {
    faixasEtarias: calcularFaixas(linhas, referencia),
    conhecimentoMercado: formatarIndicadorSimNao(linhas.map((linha) => ({ valor: linha.mercado_games }))),
    interesseProfissional: formatarIndicadorSimNao(linhas.map((linha) => ({ valor: linha.interesse_profissional_games }))),
  };
}

async function buscarRankingJogosJogados(db: SQLiteDatabase, eventId?: string): Promise<RankingJogo[]> {
  const filtro = eventId ? 'WHERE egp.event_id = ?' : '';
  const valores = eventId ? [eventId] : [];
  const linhas = await db.getAllAsync<{ nome: string; quantidade: number; participantes: number }>(
    `SELECT g.nome AS nome,
            COUNT(egp.id) AS quantidade,
            COUNT(DISTINCT ep.participant_id) AS participantes
       FROM event_game_plays egp
       INNER JOIN games g ON g.id = egp.game_id
       INNER JOIN event_participants ep ON ep.id = egp.event_participant_id
       ${filtro}
      GROUP BY g.id, g.nome
      ORDER BY quantidade DESC, participantes DESC, g.nome COLLATE NOCASE ASC
      LIMIT 10`, ...valores
  );
  return linhas.map((linha) => ({ nome: linha.nome, quantidade: numero(linha.quantidade), participantes: numero(linha.participantes) }));
}

async function buscarRankingJogosInteresse(db: SQLiteDatabase, eventId?: string): Promise<RankingJogo[]> {
  const sql = eventId
    ? `SELECT g.nome AS nome, COUNT(DISTINCT ep.participant_id) AS quantidade,
              COUNT(DISTINCT ep.participant_id) AS participantes
         FROM event_participant_games epg
         INNER JOIN event_participants ep ON ep.id = epg.event_participant_id
         INNER JOIN games g ON g.id = epg.game_id
        WHERE ep.event_id = ?
        GROUP BY g.id, g.nome
        ORDER BY quantidade DESC, g.nome COLLATE NOCASE ASC LIMIT 10`
    : `SELECT g.nome AS nome, COUNT(DISTINCT pg.participant_id) AS quantidade,
              COUNT(DISTINCT pg.participant_id) AS participantes
         FROM participant_games pg
         INNER JOIN games g ON g.id = pg.game_id
        GROUP BY g.id, g.nome
        ORDER BY quantidade DESC, g.nome COLLATE NOCASE ASC LIMIT 10`;
  const linhas = await db.getAllAsync<{ nome: string; quantidade: number; participantes: number }>(sql, ...(eventId ? [eventId] : []));
  return linhas.map((linha) => ({ nome: linha.nome, quantidade: numero(linha.quantidade), participantes: numero(linha.participantes) }));
}

async function buscarRankingJogosSolicitados(db: SQLiteDatabase, eventId?: string): Promise<RankingJogo[]> {
  const filtro = eventId ? 'AND ep.event_id = ?' : '';
  const linhas = await db.getAllAsync<{ nome: string; quantidade: number; participantes: number }>(
    `SELECT MIN(s.game_name) AS nome,
            COUNT(s.id) AS quantidade,
            COUNT(DISTINCT ep.participant_id) AS participantes
       FROM event_feedback_game_suggestions s
       INNER JOIN event_feedback f ON f.id = s.feedback_id
       INNER JOIN event_participants ep ON ep.id = f.event_participant_id
      WHERE f.wanted_game = 1 ${filtro}
      GROUP BY s.game_name_normalized
      ORDER BY quantidade DESC, participantes DESC, s.game_name COLLATE NOCASE ASC
      LIMIT 10`, ...(eventId ? [eventId] : [])
  );
  return linhas.map((linha) => ({ nome: linha.nome, quantidade: numero(linha.quantidade), participantes: numero(linha.participantes) }));
}

async function buscarFeedback(db: SQLiteDatabase, eventId?: string): Promise<FeedbackEstatistica> {
  const filtro = eventId ? 'WHERE ep.event_id = ?' : '';
  const valores = eventId ? [eventId] : [];
  const resumo = await db.getFirstAsync<{
    total: number; gostaram: number; nao_gostaram: number; media_arena: number | null;
    queriam_jogo: number; nao_queriam_jogo: number; usaram_fila: number;
    nao_usaram_fila: number; media_fila: number | null;
  }>(
    `SELECT COUNT(f.id) AS total,
            COALESCE(SUM(CASE WHEN f.liked_event = 1 THEN 1 ELSE 0 END), 0) AS gostaram,
            COALESCE(SUM(CASE WHEN f.liked_event = 0 THEN 1 ELSE 0 END), 0) AS nao_gostaram,
            AVG(f.arena_rating) AS media_arena,
            COALESCE(SUM(CASE WHEN f.wanted_game = 1 THEN 1 ELSE 0 END), 0) AS queriam_jogo,
            COALESCE(SUM(CASE WHEN f.wanted_game = 0 THEN 1 ELSE 0 END), 0) AS nao_queriam_jogo,
            COALESCE(SUM(CASE WHEN f.used_queue = 1 THEN 1 ELSE 0 END), 0) AS usaram_fila,
            COALESCE(SUM(CASE WHEN f.used_queue = 0 THEN 1 ELSE 0 END), 0) AS nao_usaram_fila,
            AVG(CASE WHEN f.used_queue = 1 THEN f.queue_rating END) AS media_fila
       FROM event_feedback f
       INNER JOIN event_participants ep ON ep.id = f.event_participant_id
       ${filtro}`, ...valores
  );

  const notasArenaRows = await db.getAllAsync<{ nota: number; total: number }>(
    `SELECT f.arena_rating AS nota, COUNT(*) AS total
       FROM event_feedback f INNER JOIN event_participants ep ON ep.id = f.event_participant_id
      ${filtro} GROUP BY f.arena_rating ORDER BY f.arena_rating`, ...valores
  );
  const notasFilaRows = await db.getAllAsync<{ nota: number; total: number }>(
    `SELECT f.queue_rating AS nota, COUNT(*) AS total
       FROM event_feedback f INNER JOIN event_participants ep ON ep.id = f.event_participant_id
      ${filtro}${filtro ? ' AND' : ' WHERE'} f.used_queue = 1 AND f.queue_rating IS NOT NULL
      GROUP BY f.queue_rating ORDER BY f.queue_rating`, ...valores
  );
  const sugestoes = await buscarRankingJogosSolicitados(db, eventId);

  const notasArena = [1, 2, 3, 4, 5].map((nota) => numero(notasArenaRows.find((linha) => linha.nota === nota)?.total));
  const notasFila = [1, 2, 3, 4, 5].map((nota) => numero(notasFilaRows.find((linha) => linha.nota === nota)?.total));

  return {
    total: numero(resumo?.total),
    gostaram: numero(resumo?.gostaram),
    naoGostaram: numero(resumo?.nao_gostaram),
    mediaArena: resumo?.media_arena == null ? null : Number(resumo.media_arena),
    notasArena,
    queriamOutroJogo: numero(resumo?.queriam_jogo),
    naoQueriamOutroJogo: numero(resumo?.nao_queriam_jogo),
    usaramFila: numero(resumo?.usaram_fila),
    naoUsaramFila: numero(resumo?.nao_usaram_fila),
    mediaFila: resumo?.media_fila == null ? null : Number(resumo.media_fila),
    notasFila,
    jogosSolicitados: sugestoes,
  };
}

async function buscarDiasEvento(db: SQLiteDatabase, eventId: string): Promise<DiaEstatistica[]> {
  const rows = await db.getAllAsync<{
    id: string; day_number: number; event_date: string; status: string; participantes: number;
  }>(
    `SELECT ed.id, ed.day_number, ed.event_date, ed.status,
            COUNT(DISTINCT epd.event_participant_id) AS participantes
       FROM event_days ed
       LEFT JOIN event_participant_days epd ON epd.event_day_id = ed.id
      WHERE ed.event_id = ?
      GROUP BY ed.id, ed.day_number, ed.event_date, ed.status
      ORDER BY ed.day_number`, eventId
  );
  return rows.map((row) => ({ id: row.id, numero: row.day_number, data: row.event_date, status: row.status, participantes: numero(row.participantes) }));
}

function dataAtualISO(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

async function buscarEventoLista(db: SQLiteDatabase, eventId: string): Promise<EventoListaEstatistica | null> {
  const row = await db.getFirstAsync<{
    id: string; nome_evento: string; data_inicio: string; data_termino: string | null;
    situacao: string; encerrado_em: string | null;
  }>(
    `SELECT id, nome_evento, data_inicio, data_termino, situacao, encerrado_em
       FROM events WHERE id = ?`, eventId
  );
  if (!row) return null;
  const resumo = await db.getFirstAsync<{ presentes: number; presencas: number }>(
    `SELECT COUNT(DISTINCT ep.participant_id) AS presentes, COUNT(epd.id) AS presencas
       FROM event_days ed
       LEFT JOIN event_participant_days epd ON epd.event_day_id = ed.id
       LEFT JOIN event_participants ep ON ep.id = epd.event_participant_id
      WHERE ed.event_id = ?`, eventId
  );
  return {
    id: row.id, nome: row.nome_evento, dataInicio: row.data_inicio, dataTermino: row.data_termino,
    situacao: row.situacao, encerradoEm: row.encerrado_em,
    presentes: numero(resumo?.presentes), presencas: numero(resumo?.presencas),
  };
}

export async function buscarEventosEstatisticas(db: SQLiteDatabase): Promise<EventoListaEstatistica[]> {
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM events
      ORDER BY CASE situacao WHEN 'em_andamento' THEN 0 WHEN 'agendado' THEN 1 ELSE 2 END,
               data_inicio DESC, created_at DESC`
  );
  const eventos: EventoListaEstatistica[] = [];
  for (const row of rows) {
    const evento = await buscarEventoLista(db, row.id);
    if (evento) eventos.push(evento);
  }
  return eventos;
}

export async function buscarEstatisticasEvento(db: SQLiteDatabase, eventId: string): Promise<EstatisticasEvento | null> {
  const evento = await buscarEventoLista(db, eventId);
  if (!evento) return null;

  const inscritosRow = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM event_participants WHERE event_id = ?', eventId
  );
  const presentesRow = await db.getFirstAsync<{ total: number; presencas: number }>(
    `SELECT COUNT(DISTINCT ep.participant_id) AS total, COUNT(epd.id) AS presencas
       FROM event_days ed
       LEFT JOIN event_participant_days epd ON epd.event_day_id = ed.id
       LEFT JOIN event_participants ep ON ep.id = epd.event_participant_id
      WHERE ed.event_id = ?`, eventId
  );
  const recorrentesRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM (
       SELECT ep.participant_id
         FROM event_participant_days epd
         INNER JOIN event_days ed ON ed.id = epd.event_day_id
         INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
        WHERE ed.event_id = ?
        GROUP BY ep.participant_id
       HAVING COUNT(DISTINCT ed.id) > 1
     )`, eventId
  );
  const referencia = dataEmPartes(evento.dataInicio) ? evento.dataInicio : dataAtualISO();
  const perfil = await buscarPerfilParticipantes(db, referencia, eventId);
  const jogosInteresse = await buscarRankingJogosInteresse(db, eventId);
  const jogosJogados = await buscarRankingJogosJogados(db, eventId);
  const feedback = await buscarFeedback(db, eventId);
  const dias = await buscarDiasEvento(db, eventId);
  const maiorFaixaEtaria = [...perfil.faixasEtarias].sort((a, b) => b.quantidade - a.quantidade)[0];

  const filasRow = await db.getFirstAsync<{ total: number; entradas: number; atendimentos: number; aguardando: number }>(
    `SELECT COUNT(DISTINCT q.id) AS total,
            COUNT(qe.id) AS entradas,
            COALESCE(SUM(CASE WHEN qe.status = 'atendido' THEN 1 ELSE 0 END), 0) AS atendimentos,
            COALESCE(SUM(CASE WHEN qe.status = 'aguardando' THEN 1 ELSE 0 END), 0) AS aguardando
       FROM event_queues q LEFT JOIN queue_entries qe ON qe.queue_id = q.id
      WHERE q.event_id = ?`, eventId
  );

  return {
    evento,
    inscritos: numero(inscritosRow?.total),
    presentes: numero(presentesRow?.total),
    presencas: numero(presentesRow?.presencas),
    retornaramEmMaisDeUmDia: numero(recorrentesRow?.total),
    maiorFaixaEtaria: maiorFaixaEtaria && maiorFaixaEtaria.quantidade > 0 ? maiorFaixaEtaria.faixa : null,
    dias,
    ...perfil,
    jogosInteresse,
    jogosJogados,
    feedback,
    filas: {
      total: numero(filasRow?.total), entradas: numero(filasRow?.entradas),
      atendimentos: numero(filasRow?.atendimentos), aguardando: numero(filasRow?.aguardando),
    },
  };
}

export async function buscarEstatisticasGerais(db: SQLiteDatabase): Promise<EstatisticasGerais> {
  const participantesRow = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM participants');
  const eventosRow = await db.getFirstAsync<{ total: number }>("SELECT COUNT(*) AS total FROM events WHERE situacao = 'encerrado'");
  const presencasRow = await db.getFirstAsync<{ pessoas: number; total: number }>(
    `SELECT COUNT(DISTINCT ep.participant_id) AS pessoas, COUNT(epd.id) AS total
       FROM event_participant_days epd
       INNER JOIN event_participants ep ON ep.id = epd.event_participant_id`
  );
  const retornoRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM (
       SELECT ep.participant_id
         FROM event_participant_days epd
         INNER JOIN event_days ed ON ed.id = epd.event_day_id
         INNER JOIN event_participants ep ON ep.id = epd.event_participant_id
        GROUP BY ep.participant_id
       HAVING COUNT(DISTINCT ed.event_id) >= 2
     )`
  );
  const totalPessoas = numero(presencasRow?.pessoas);
  const pessoasRetorno = numero(retornoRow?.total);
  const feedbackRow = await db.getFirstAsync<{ media: number | null; total: number; gostaram: number }>(
    `SELECT AVG(arena_rating) AS media, COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN liked_event = 1 THEN 1 ELSE 0 END), 0) AS gostaram
       FROM event_feedback`
  );
  const perfil = await buscarPerfilParticipantes(db, dataAtualISO());
  const faixasEtarias = perfil.faixasEtarias;
  const maiorFaixa = [...faixasEtarias].sort((a, b) => b.quantidade - a.quantidade)[0];
  const crescimentoRows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM events WHERE situacao = 'encerrado'
      ORDER BY COALESCE(encerrado_em, data_termino, data_inicio) DESC, data_inicio DESC LIMIT 6`
  );
  const crescimento: EventoListaEstatistica[] = [];
  for (const row of crescimentoRows) {
    const evento = await buscarEventoLista(db, row.id);
    if (evento) crescimento.push(evento);
  }
  const ultimoEventoRow = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM events WHERE situacao = 'encerrado'
      ORDER BY COALESCE(encerrado_em, data_termino, data_inicio) DESC, data_inicio DESC LIMIT 1`
  );
  const jogosInteresse = await buscarRankingJogosInteresse(db);
  const jogosJogados = await buscarRankingJogosJogados(db);
  const jogosSolicitados = await buscarRankingJogosSolicitados(db);
  const ultimoEvento = ultimoEventoRow ? await buscarEstatisticasEvento(db, ultimoEventoRow.id) : null;

  return {
    participantesCadastrados: numero(participantesRow?.total),
    eventosRealizados: numero(eventosRow?.total),
    pessoasQueJaCompareceram: totalPessoas,
    totalPresencas: numero(presencasRow?.total),
    pessoasQueRetornaram: pessoasRetorno,
    taxaRetorno: totalPessoas ? Math.round((pessoasRetorno / totalPessoas) * 100) : 0,
    satisfacaoMediaGeral: feedbackRow?.media == null ? null : Number(feedbackRow.media),
    taxaAprovacaoEventos: percentual(numero(feedbackRow?.gostaram), numero(feedbackRow?.total)),
    totalAvaliacoes: numero(feedbackRow?.total),
    ...perfil,
    maiorFaixaEtaria: maiorFaixa && maiorFaixa.quantidade > 0 ? maiorFaixa.faixa : null,
    jogosInteresse,
    jogosJogados,
    jogosSolicitados,
    crescimentoPublico: crescimento.reverse(),
    ultimoEvento,
  };
}

export async function buscarOpcoesRegistroJogos(db: SQLiteDatabase, eventId: string): Promise<{
  participantes: OpcaoRegistroJogo[];
  dias: OpcaoDiaRegistroJogo[];
  jogos: OpcaoJogoRegistro[];
}> {
  const [participantes, dias, jogos] = await Promise.all([
    db.getAllAsync<OpcaoRegistroJogo>(
      `SELECT id AS eventParticipantId, participant_id AS participantId, nome_snapshot AS nome
         FROM event_participants WHERE event_id = ? ORDER BY nome_snapshot COLLATE NOCASE`, eventId
    ),
    db.getAllAsync<OpcaoDiaRegistroJogo>(
      `SELECT id, day_number AS numero, event_date AS data, status
         FROM event_days WHERE event_id = ? ORDER BY day_number`, eventId
    ),
    db.getAllAsync<OpcaoJogoRegistro>(
      'SELECT id, nome FROM games ORDER BY nome COLLATE NOCASE'
    ),
  ]);
  return { participantes, dias, jogos };
}

export async function buscarJogosJaRegistrados(
  db: SQLiteDatabase,
  eventDayId: string,
  eventParticipantId: string
): Promise<string[]> {
  const rows = await db.getAllAsync<{ game_id: string }>(
    `SELECT game_id FROM event_game_plays
      WHERE event_day_id = ? AND event_participant_id = ?`, eventDayId, eventParticipantId
  );
  return rows.map((row) => row.game_id);
}

export async function registrarJogosEfetivamenteJogados(
  db: SQLiteDatabase,
  eventId: string,
  eventDayId: string,
  eventParticipantId: string,
  gameIds: string[]
): Promise<{ registrados: number; jaRegistrados: number }> {
  const jogosUnicos = Array.from(new Set(gameIds.filter(Boolean)));
  if (jogosUnicos.length === 0) throw new Error('Selecione pelo menos um jogo.');

  const dia = await db.getFirstAsync<{ id: string; status: string }>(
    'SELECT id, status FROM event_days WHERE id = ? AND event_id = ?', eventDayId, eventId
  );
  if (!dia) throw new Error('O dia selecionado não pertence a este evento.');
  if (dia.status === 'nao_iniciado' || dia.status === 'nao_realizado') {
    throw new Error('Só é possível registrar jogos em um dia que já foi iniciado ou concluído.');
  }

  const inscricao = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM event_participants WHERE id = ? AND event_id = ?', eventParticipantId, eventId
  );
  if (!inscricao) throw new Error('O participante não está inscrito neste evento.');

  let registrados = 0;
  let jaRegistrados = 0;
  await db.withTransactionAsync(async () => {
    const agora = new Date().toISOString();
    const presenca = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM event_participant_days WHERE event_day_id = ? AND event_participant_id = ?',
      eventDayId, eventParticipantId
    );
    if (!presenca) {
      const presencaId = `event_presence_${eventDayId}__${eventParticipantId}`;
      await db.runAsync(
        `INSERT INTO event_participant_days (id, event_day_id, event_participant_id, source, created_at, updated_at)
         VALUES (?, ?, ?, 'manual', ?, ?)`, presencaId, eventDayId, eventParticipantId, agora, agora
      );
      await db.runAsync(
        `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at)
         VALUES (?, 'event_participant_day', ?, 'upsert', ?, ?)`,
        criarId('sync'), presencaId,
        JSON.stringify({ id: presencaId, event_day_id: eventDayId, event_participant_id: eventParticipantId, source: 'manual', created_at: agora, updated_at: agora }),
        agora
      );
    }

    for (const gameId of jogosUnicos) {
      const jogo = await db.getFirstAsync<{ id: string }>('SELECT id FROM games WHERE id = ?', gameId);
      if (!jogo) throw new Error('Um dos jogos selecionados não existe no catálogo local.');

      const existente = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM event_game_plays
          WHERE event_id = ? AND event_day_id = ? AND event_participant_id = ? AND game_id = ? LIMIT 1`,
        eventId, eventDayId, eventParticipantId, gameId
      );
      if (existente) {
        jaRegistrados += 1;
        continue;
      }

      const id = `event_game_play_${eventDayId}__${eventParticipantId}__${gameId}`;
      await db.runAsync(
        `INSERT INTO event_game_plays (id, event_id, event_day_id, event_participant_id, game_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id, eventId, eventDayId, eventParticipantId, gameId, agora, agora
      );
      await db.runAsync(
        `INSERT INTO sync_outbox (id, entity_type, entity_id, operation, payload_json, created_at)
         VALUES (?, 'event_game_play', ?, 'upsert', ?, ?)`,
        criarId('sync'), id,
        JSON.stringify({ id, event_id: eventId, event_day_id: eventDayId, event_participant_id: eventParticipantId, game_id: gameId, created_at: agora, updated_at: agora }),
        agora
      );
      registrados += 1;
    }
  });

  return { registrados, jaRegistrados };
}

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useTema } from '../../context/temaContexto';
import {
  buscarEstatisticasEvento,
  buscarEstatisticasGerais,
  buscarEventosEstatisticas,
  type EstatisticasEvento,
  type EstatisticasGerais,
  type EventoListaEstatistica,
  type FaixaEtaria,
  type IndicadorSimNao,
  type RankingJogo,
} from '../../features/armazenamentoEstatisticas';

type ModoEstatistica = 'geral' | 'evento';

function formatarData(valor?: string | null): string {
  if (!valor) return 'Data não informada';
  const match = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return String(valor);
}

function intervaloEvento(evento: EventoListaEstatistica): string {
  const inicio = formatarData(evento.dataInicio);
  const fim = evento.dataTermino ? formatarData(evento.dataTermino) : '';
  return fim && fim !== inicio ? `${inicio} – ${fim}` : inicio;
}

function percentual(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

function statusDia(status: string): string {
  if (status === 'em_andamento') return 'Em andamento';
  if (status === 'concluido') return 'Concluído';
  if (status === 'nao_realizado') return 'Não realizado';
  return 'Não iniciado';
}

function CartaoIndicador({
  titulo,
  valor,
  detalhe,
  tema,
  icone,
}: {
  titulo: string;
  valor: string | number;
  detalhe?: string;
  tema: ReturnType<typeof useTema>['tema'];
  icone: ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[styles.cardIndicador, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      <View style={styles.cardIndicadorTopo}>
        <Text style={[styles.cardIndicadorTitulo, { color: tema.textSecondary }]}>{titulo}</Text>
        <Ionicons name={icone} size={19} color={tema.primary} />
      </View>
      <Text style={[styles.cardIndicadorValor, { color: tema.text }]}>{valor}</Text>
      {detalhe ? <Text style={[styles.cardIndicadorDetalhe, { color: tema.textSecondary }]}>{detalhe}</Text> : null}
    </View>
  );
}

function Secao({ titulo, subtitulo, children, tema }: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  tema: ReturnType<typeof useTema>['tema'];
}) {
  return (
    <View style={[styles.secao, { backgroundColor: tema.surface, borderColor: tema.border }]}>
      <Text style={[styles.secaoTitulo, { color: tema.text }]}>{titulo}</Text>
      {subtitulo ? <Text style={[styles.secaoSubtitulo, { color: tema.textSecondary }]}>{subtitulo}</Text> : null}
      {children}
    </View>
  );
}

function BarrasDistribuicao({ itens, tema }: { itens: FaixaEtaria[]; tema: ReturnType<typeof useTema>['tema'] }) {
  const maximo = Math.max(1, ...itens.map((item) => item.quantidade));
  return (
    <View style={{ gap: 12 }}>
      {itens.map((item) => (
        <View key={item.faixa}>
          <View style={styles.linhaBarraTitulo}>
            <Text style={[styles.textoBarra, { color: tema.text }]}>{item.faixa}</Text>
            <Text style={[styles.textoBarraValor, { color: tema.textSecondary }]}>{item.quantidade} ({item.porcentagem}%)</Text>
          </View>
          <View style={[styles.trilho, { backgroundColor: tema.surfaceSecondary }]}>
            <View style={[styles.preenchimento, { width: `${(item.quantidade / maximo) * 100}%`, backgroundColor: tema.primary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function CartaoSimNao({ titulo, dados, tema }: { titulo: string; dados: IndicadorSimNao; tema: ReturnType<typeof useTema>['tema'] }) {
  return (
    <View style={[styles.cardPequeno, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
      <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>{titulo}</Text>
      <View style={styles.simNaoLinha}>
        <View style={styles.simNaoItem}>
          <Text style={[styles.simNaoValor, { color: '#16834A' }]}>{dados.sim}</Text>
          <Text style={[styles.simNaoLegenda, { color: tema.textSecondary }]}>Sim</Text>
        </View>
        <View style={styles.simNaoItem}>
          <Text style={[styles.simNaoValor, { color: '#D15B63' }]}>{dados.nao}</Text>
          <Text style={[styles.simNaoLegenda, { color: tema.textSecondary }]}>Não</Text>
        </View>
      </View>
      <Text style={[styles.cardPequenoRodape, { color: tema.textSecondary }]}>{dados.total} respostas válidas</Text>
    </View>
  );
}

function Ranking({ tituloVazio, itens, tema, unidade = 'registros' }: {
  tituloVazio: string;
  itens: RankingJogo[];
  tema: ReturnType<typeof useTema>['tema'];
  unidade?: string;
}) {
  if (itens.length === 0) return <Text style={[styles.vazio, { color: tema.textSecondary }]}>{tituloVazio}</Text>;
  const maximo = Math.max(1, ...itens.map((item) => item.quantidade));
  return (
    <View style={{ gap: 13 }}>
      {itens.map((item, index) => (
        <View key={`${item.nome}-${index}`}>
          <View style={styles.linhaBarraTitulo}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Text style={[styles.rankingPosicao, { color: tema.primary }]}>{index + 1}.</Text>
              <Text style={[styles.textoBarra, { color: tema.text, flex: 1 }]} numberOfLines={1}>{item.nome}</Text>
            </View>
            <Text style={[styles.textoBarraValor, { color: tema.textSecondary }]}>{item.quantidade} {unidade}</Text>
          </View>
          <View style={[styles.trilho, { backgroundColor: tema.surfaceSecondary }]}>
            <View style={[styles.preenchimento, { width: `${(item.quantidade / maximo) * 100}%`, backgroundColor: tema.primary }]} />
          </View>
          {item.participantes > 0 ? <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{item.participantes} participante(s)</Text> : null}
        </View>
      ))}
    </View>
  );
}

function AvaliacaoNotas({ titulo, notas, tema }: { titulo: string; notas: number[]; tema: ReturnType<typeof useTema>['tema'] }) {
  const maximo = Math.max(1, ...notas);
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>{titulo}</Text>
      <View style={styles.notasLinha}>
        {notas.map((quantidade, indice) => (
          <View key={indice} style={styles.notaItem}>
            <Text style={[styles.notaQuantidade, { color: tema.text }]}>{quantidade}</Text>
            <View style={[styles.notaTrilho, { backgroundColor: tema.surfaceSecondary }]}>
              <View style={[styles.notaPreenchimento, { height: `${(quantidade / maximo) * 100}%`, backgroundColor: tema.primary }]} />
            </View>
            <Text style={[styles.notaRotulo, { color: tema.textSecondary }]}>{indice + 1}★</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BlocoFeedback({ dados, inscritos, tema }: {
  dados: EstatisticasEvento['feedback'];
  inscritos: number;
  tema: ReturnType<typeof useTema>['tema'];
}) {
  const respostasPct = percentual(dados.total, inscritos);
  return (
    <>
      <View style={styles.feedbackCabecalho}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feedbackNumero, { color: tema.text }]}>{dados.total}</Text>
          <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>avaliações respondidas</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feedbackNumero, { color: tema.text }]}>{respostasPct}%</Text>
          <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>taxa de resposta dos inscritos</Text>
        </View>
      </View>
      {dados.total === 0 ? <Text style={[styles.vazio, { color: tema.textSecondary }]}>Ainda não há avaliações registradas.</Text> : (
        <>
          <View style={styles.linhaMetricas}>
            <View style={[styles.cardPequeno, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>Gostaram do evento</Text>
              <Text style={[styles.simNaoValor, { color: '#16834A' }]}>{dados.gostaram} ({percentual(dados.gostaram, dados.total)}%)</Text>
              <Text style={[styles.cardPequenoRodape, { color: tema.textSecondary }]}>Não gostaram: {dados.naoGostaram}</Text>
            </View>
            <View style={[styles.cardPequeno, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>Arena</Text>
              <Text style={[styles.simNaoValor, { color: tema.primary }]}>{dados.mediaArena === null ? '—' : `${dados.mediaArena.toFixed(1)}/5`}</Text>
              <Text style={[styles.cardPequenoRodape, { color: tema.textSecondary }]}>Média das avaliações</Text>
            </View>
          </View>
          <AvaliacaoNotas titulo="Distribuição das notas da arena" notas={dados.notasArena} tema={tema} />
          <View style={[styles.linhaMetricas, { marginTop: 18 }]}>
            <View style={[styles.cardPequeno, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>Queriam outro jogo</Text>
              <Text style={[styles.simNaoValor, { color: tema.primary }]}>{dados.queriamOutroJogo}</Text>
              <Text style={[styles.cardPequenoRodape, { color: tema.textSecondary }]}>Não: {dados.naoQueriamOutroJogo}</Text>
            </View>
            <View style={[styles.cardPequeno, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Text style={[styles.cardPequenoTitulo, { color: tema.text }]}>Experiência com filas</Text>
              <Text style={[styles.simNaoValor, { color: tema.primary }]}>{dados.mediaFila === null ? '—' : `${dados.mediaFila.toFixed(1)}/5`}</Text>
              <Text style={[styles.cardPequenoRodape, { color: tema.textSecondary }]}>Usaram: {dados.usaramFila} • Não usaram: {dados.naoUsaramFila}</Text>
            </View>
          </View>
          {dados.usaramFila > 0 ? <AvaliacaoNotas titulo="Distribuição das notas das filas" notas={dados.notasFila} tema={tema} /> : null}
          <Text style={[styles.subtituloInterno, { color: tema.text }]}>Jogos que os participantes sentiram falta</Text>
          <Ranking tituloVazio="Nenhum jogo foi solicitado até agora." itens={dados.jogosSolicitados} tema={tema} unidade="solicitação(ões)" />
        </>
      )}
    </>
  );
}

function SecaoPresencaDias({ dados, tema }: { dados: EstatisticasEvento; tema: ReturnType<typeof useTema>['tema'] }) {
  if (dados.dias.length === 0) return <Text style={[styles.vazio, { color: tema.textSecondary }]}>Não há dias cadastrados para este evento.</Text>;
  const maximo = Math.max(1, ...dados.dias.map((dia) => dia.participantes));
  return (
    <View style={{ gap: 14 }}>
      {dados.dias.map((dia) => (
        <View key={dia.id}>
          <View style={styles.linhaBarraTitulo}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.textoBarra, { color: tema.text }]}>Dia {dia.numero} • {formatarData(dia.data)}</Text>
              <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{statusDia(dia.status)}</Text>
            </View>
            <Text style={[styles.textoBarraValor, { color: tema.text }]}>{dia.participantes} pessoas</Text>
          </View>
          <View style={[styles.trilho, { backgroundColor: tema.surfaceSecondary }]}>
            <View style={[styles.preenchimento, { width: `${(dia.participantes / maximo) * 100}%`, backgroundColor: tema.primary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function EstatisticaScreen() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventIdParam = typeof params.eventId === 'string' ? params.eventId : '';

  const [modo, setModo] = useState<ModoEstatistica>(eventIdParam ? 'evento' : 'geral');
  const [eventoIdSelecionado, setEventoIdSelecionado] = useState(eventIdParam);
  const [gerais, setGerais] = useState<EstatisticasGerais | null>(null);
  const [eventos, setEventos] = useState<EventoListaEstatistica[]>([]);
  const [especificas, setEspecificas] = useState<EstatisticasEvento | null>(null);
  const [modalEventos, setModalEventos] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (eventIdParam) {
      setEventoIdSelecionado(eventIdParam);
      setModo('evento');
    }
  }, [eventIdParam]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [resumoGeral, listaEventos] = await Promise.all([
        buscarEstatisticasGerais(db),
        buscarEventosEstatisticas(db),
      ]);
      setGerais(resumoGeral);
      setEventos(listaEventos);
      if (modo === 'evento' && eventoIdSelecionado) {
        setEspecificas(await buscarEstatisticasEvento(db, eventoIdSelecionado));
      } else if (modo === 'evento' && !eventoIdSelecionado && listaEventos.length > 0) {
        setEventoIdSelecionado(listaEventos[0].id);
        setEspecificas(await buscarEstatisticasEvento(db, listaEventos[0].id));
      } else {
        setEspecificas(null);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível calcular as estatísticas.');
    } finally {
      setCarregando(false);
    }
  }, [db, eventoIdSelecionado, modo]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const eventoAtual = useMemo(
    () => eventos.find((evento) => evento.id === eventoIdSelecionado) ?? null,
    [eventos, eventoIdSelecionado]
  );

  function selecionarEvento(id: string) {
    setEventoIdSelecionado(id);
    setModo('evento');
    setModalEventos(false);
  }

  const crescimento = gerais?.crescimentoPublico ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen options={{ title: 'Estatísticas' }} />
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.cabecalho}>
          <Text style={[styles.tituloPrincipal, { color: tema.text }]}>Painel de estatísticas</Text>
          <Text style={[styles.descricaoPrincipal, { color: tema.textSecondary }]}>Acompanhe o público, a operação e a experiência dos eventos MaraGames.</Text>
        </View>

        <View style={[styles.abas, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
          <Pressable onPress={() => setModo('geral')} style={[styles.aba, modo === 'geral' && { backgroundColor: tema.primary }]}>
            <Ionicons name="globe-outline" size={17} color={modo === 'geral' ? tema.primaryText : tema.textSecondary} />
            <Text style={[styles.abaTexto, { color: modo === 'geral' ? tema.primaryText : tema.textSecondary }]}>Visão geral</Text>
          </Pressable>
          <Pressable onPress={() => { setModo('evento'); if (!eventoIdSelecionado && eventos.length) setEventoIdSelecionado(eventos[0].id); }} style={[styles.aba, modo === 'evento' && { backgroundColor: tema.primary }]}>
            <Ionicons name="calendar-outline" size={17} color={modo === 'evento' ? tema.primaryText : tema.textSecondary} />
            <Text style={[styles.abaTexto, { color: modo === 'evento' ? tema.primaryText : tema.textSecondary }]}>Por evento</Text>
          </Pressable>
        </View>

        {carregando ? (
          <View style={styles.carregando}><ActivityIndicator size="large" color={tema.primary} /><Text style={{ color: tema.textSecondary, marginTop: 10 }}>Calculando indicadores...</Text></View>
        ) : erro ? (
          <View style={[styles.caixaErro, { backgroundColor: tema.surface, borderColor: tema.border }]}><Ionicons name="alert-circle-outline" size={26} color="#D92D45" /><Text style={[styles.erroTexto, { color: tema.text }]}>{erro}</Text></View>
        ) : modo === 'geral' ? (
          <>
            {gerais ? (
              <>
                <Text style={[styles.rotuloGrupo, { color: tema.textSecondary }]}>PANORAMA DA MARAGAMES</Text>
                <View style={styles.gradeIndicadores}>
                  <CartaoIndicador titulo="Participantes cadastrados" valor={gerais.participantesCadastrados} tema={tema} icone="people-outline" />
                  <CartaoIndicador titulo="Eventos realizados" valor={gerais.eventosRealizados} tema={tema} icone="calendar-outline" />
                  <CartaoIndicador titulo="Pessoas que já compareceram" valor={gerais.pessoasQueJaCompareceram} tema={tema} icone="person-outline" />
                  <CartaoIndicador titulo="Comparecimentos por dia" valor={gerais.totalPresencas} detalhe="Uma pessoa em dois dias conta duas vezes" tema={tema} icone="people-outline" />
                </View>

                <View style={styles.gradeIndicadores}>
                  <CartaoIndicador titulo="Taxa de retorno" valor={`${gerais.taxaRetorno}%`} detalhe={`${gerais.pessoasQueRetornaram} pessoas participaram de mais de um evento`} tema={tema} icone="repeat-outline" />
                  <CartaoIndicador titulo="Aprovação geral" valor={gerais.totalAvaliacoes > 0 ? `${gerais.taxaAprovacaoEventos}%` : '—'} detalhe={`${gerais.totalAvaliacoes} avaliações • satisfação média da arena ${gerais.satisfacaoMediaGeral === null ? '—' : `${gerais.satisfacaoMediaGeral.toFixed(1)}/5`}`} tema={tema} icone="star-outline" />
                </View>

                <Secao titulo="Perfil dos participantes cadastrados" subtitulo="Faixa etária atual e respostas registradas no cadastro." tema={tema}>
                  {gerais.maiorFaixaEtaria ? <View style={[styles.destaqueFaixa, { backgroundColor: tema.activeBackground }]}><Ionicons name="trophy-outline" size={20} color={tema.primary} /><Text style={[styles.destaqueFaixaTexto, { color: tema.text }]}>Faixa etária predominante: <Text style={{ color: tema.primary }}>{gerais.maiorFaixaEtaria}</Text></Text></View> : null}
                  <BarrasDistribuicao itens={gerais.faixasEtarias} tema={tema} />
                  <View style={[styles.linhaMetricas, { marginTop: 18 }]}>
                    <CartaoSimNao titulo="Conhece o mercado de games?" dados={gerais.conhecimentoMercado} tema={tema} />
                    <CartaoSimNao titulo="Tem interesse profissional?" dados={gerais.interesseProfissional} tema={tema} />
                  </View>
                </Secao>

                <Secao titulo="Jogos mais jogados" subtitulo="Participações registradas por pessoa e por dia; não representa o número de partidas ou rodadas." tema={tema}>
                  <Ranking tituloVazio="Ainda não foram registrados jogos efetivamente jogados." itens={gerais.jogosJogados} tema={tema} unidade="participações" />
                </Secao>

                <Secao titulo="Jogos de maior interesse" subtitulo="Jogos informados pelos participantes no cadastro." tema={tema}>
                  <Ranking tituloVazio="Ainda não há preferências de jogos registradas." itens={gerais.jogosInteresse} tema={tema} unidade="participantes" />
                </Secao>

                <Secao titulo="Jogos mais solicitados" subtitulo="Títulos que os participantes disseram querer jogar, mas não encontraram disponíveis." tema={tema}>
                  <Ranking tituloVazio="Ainda não há solicitações de jogos nos feedbacks." itens={gerais.jogosSolicitados} tema={tema} unidade="solicitações" />
                </Secao>

                <Secao titulo="Crescimento do público" subtitulo="Participantes únicos presentes em cada um dos últimos eventos encerrados." tema={tema}>
                  {crescimento.length === 0 ? <Text style={[styles.vazio, { color: tema.textSecondary }]}>Nenhum evento encerrado com dados disponível.</Text> : crescimento.map((evento, indice) => {
                    const anterior = indice > 0 ? crescimento[indice - 1].presentes : null;
                    const diferenca = anterior === null ? null : evento.presentes - anterior;
                    const variacao = anterior && anterior > 0 && diferenca !== null ? Math.round((diferenca / anterior) * 100) : null;
                    return (
                      <View key={evento.id} style={[styles.linhaCrescimento, { borderBottomColor: tema.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.textoBarra, { color: tema.text }]}>{evento.nome}</Text>
                          <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{intervaloEvento(evento)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.textoBarraValor, { color: tema.text }]}>{evento.presentes} pessoas</Text>
                          {diferenca !== null ? <Text style={{ color: diferenca > 0 ? '#16834A' : diferenca < 0 ? '#D15B63' : tema.textSecondary, fontSize: 11, fontWeight: '700' }}>{diferenca > 0 ? '+' : ''}{diferenca} {variacao === null ? '' : `(${variacao > 0 ? '+' : ''}${variacao}%)`}</Text> : <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>Primeiro da série</Text>}
                        </View>
                      </View>
                    );
                  })}
                </Secao>

                <Secao titulo="Último evento realizado" subtitulo="Resumo detalhado do evento encerrado mais recentemente, incluindo presença separada por dia." tema={tema}>
                  {gerais.ultimoEvento ? (
                    <>
                      <Text style={[styles.nomeEventoDestaque, { color: tema.text }]}>{gerais.ultimoEvento.evento.nome}</Text>
                      <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{intervaloEvento(gerais.ultimoEvento.evento)}</Text>
                      <View style={[styles.gradeIndicadores, { marginTop: 14 }]}>
                        <CartaoIndicador titulo="Inscritos" valor={gerais.ultimoEvento.inscritos} tema={tema} icone="document-text-outline" />
                        <CartaoIndicador titulo="Pessoas presentes" valor={gerais.ultimoEvento.presentes} tema={tema} icone="people-outline" />
                        <CartaoIndicador titulo="Comparecimentos" valor={gerais.ultimoEvento.presencas} tema={tema} icone="people-outline" />
                        <CartaoIndicador titulo="Voltaram em outro dia" valor={gerais.ultimoEvento.retornaramEmMaisDeUmDia} tema={tema} icone="repeat-outline" />
                      </View>
                      <Text style={[styles.subtituloInterno, { color: tema.text }]}>Presença em cada dia</Text>
                      <SecaoPresencaDias dados={gerais.ultimoEvento} tema={tema} />
                      <Text style={[styles.subtituloInterno, { color: tema.text }]}>Opinião sobre o evento</Text>
                      <BlocoFeedback dados={gerais.ultimoEvento.feedback} inscritos={gerais.ultimoEvento.inscritos} tema={tema} />
                      <Pressable onPress={() => selecionarEvento(gerais.ultimoEvento!.evento.id)} style={[styles.botaoVerEvento, { backgroundColor: tema.primary }]}>
                        <Text style={[styles.botaoVerEventoTexto, { color: tema.primaryText }]}>Ver estatísticas completas deste evento</Text>
                        <Ionicons name="arrow-forward" size={18} color={tema.primaryText} />
                      </Pressable>
                    </>
                  ) : <Text style={[styles.vazio, { color: tema.textSecondary }]}>Ainda não há evento encerrado para apresentar.</Text>}
                </Secao>
              </>
            ) : null}
          </>
        ) : (
          <>
            <Pressable onPress={() => setModalEventos(true)} style={[styles.seletorEvento, { backgroundColor: tema.surface, borderColor: tema.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.seletorRotulo, { color: tema.textSecondary }]}>EVENTO ANALISADO</Text>
                <Text style={[styles.seletorNome, { color: tema.text }]}>{eventoAtual?.nome ?? especificas?.evento.nome ?? 'Selecionar evento'}</Text>
                {eventoAtual ? <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{intervaloEvento(eventoAtual)}</Text> : null}
              </View>
              <Ionicons name="chevron-down" size={20} color={tema.primary} />
            </Pressable>

            {!especificas ? (
              <View style={[styles.caixaErro, { backgroundColor: tema.surface, borderColor: tema.border }]}><Text style={[styles.vazio, { color: tema.textSecondary }]}>Selecione um evento para consultar suas estatísticas.</Text><Pressable onPress={() => setModalEventos(true)}><Text style={{ color: tema.primary, fontWeight: '700' }}>Escolher evento</Text></Pressable></View>
            ) : (
              <>
                <View style={styles.gradeIndicadores}>
                  <CartaoIndicador titulo="Participantes inscritos" valor={especificas.inscritos} tema={tema} icone="document-text-outline" />
                  <CartaoIndicador titulo="Pessoas presentes" valor={especificas.presentes} detalhe={`${percentual(especificas.presentes, especificas.inscritos)}% dos inscritos`} tema={tema} icone="people-outline" />
                  <CartaoIndicador titulo="Comparecimentos por dia" valor={especificas.presencas} tema={tema} icone="people-outline" />
                  <CartaoIndicador titulo="Retornaram em outro dia" valor={especificas.retornaramEmMaisDeUmDia} tema={tema} icone="repeat-outline" />
                </View>

                <Secao titulo="Presença diária" subtitulo="Cada dia é contabilizado individualmente. A mesma pessoa pode aparecer em mais de um dia." tema={tema}>
                  <SecaoPresencaDias dados={especificas} tema={tema} />
                </Secao>

                <Secao titulo="Perfil dos participantes deste evento" subtitulo="Utiliza os dados preservados na inscrição deste evento." tema={tema}>
                  {especificas.maiorFaixaEtaria ? <View style={[styles.destaqueFaixa, { backgroundColor: tema.activeBackground }]}><Ionicons name="trophy-outline" size={20} color={tema.primary} /><Text style={[styles.destaqueFaixaTexto, { color: tema.text }]}>Faixa etária predominante: <Text style={{ color: tema.primary }}>{especificas.maiorFaixaEtaria}</Text></Text></View> : null}
                  <BarrasDistribuicao itens={especificas.faixasEtarias} tema={tema} />
                  <View style={[styles.linhaMetricas, { marginTop: 18 }]}>
                    <CartaoSimNao titulo="Conhece o mercado de games?" dados={especificas.conhecimentoMercado} tema={tema} />
                    <CartaoSimNao titulo="Tem interesse profissional?" dados={especificas.interesseProfissional} tema={tema} />
                  </View>
                </Secao>

                <Secao titulo="Jogos mais jogados neste evento" subtitulo="Participações registradas por pessoa e por dia; não representa o número de partidas ou rodadas." tema={tema}>
                  <Ranking tituloVazio="Ainda não foram registrados jogos efetivamente jogados neste evento." itens={especificas.jogosJogados} tema={tema} unidade="participações" />
                </Secao>

                <Secao titulo="Jogos de maior interesse neste evento" subtitulo="Preferências registradas na inscrição para esta edição." tema={tema}>
                  <Ranking tituloVazio="Não há preferências de jogos registradas." itens={especificas.jogosInteresse} tema={tema} unidade="participantes" />
                </Secao>

                <Secao titulo="Operação das filas" subtitulo="Indicadores de uso das filas do evento." tema={tema}>
                  <View style={styles.gradeIndicadores}>
                    <CartaoIndicador titulo="Filas criadas" valor={especificas.filas.total} tema={tema} icone="list-outline" />
                    <CartaoIndicador titulo="Entradas nas filas" valor={especificas.filas.entradas} tema={tema} icone="people-outline" />
                    <CartaoIndicador titulo="Atendimentos" valor={especificas.filas.atendimentos} tema={tema} icone="checkmark-circle-outline" />
                    <CartaoIndicador titulo="Aguardando" valor={especificas.filas.aguardando} tema={tema} icone="time-outline" />
                  </View>
                </Secao>

                <Secao titulo="Avaliação dos participantes" subtitulo="Resultados dos feedbacks enviados após a participação." tema={tema}>
                  <BlocoFeedback dados={especificas.feedback} inscritos={especificas.inscritos} tema={tema} />
                </Secao>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={modalEventos} transparent animationType="fade" onRequestClose={() => setModalEventos(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalEventos(false)}>
          <Pressable style={[styles.modalConteudo, { backgroundColor: tema.surface, borderColor: tema.border }]} onPress={() => undefined}>
            <View style={styles.modalCabecalho}>
              <Text style={[styles.modalTitulo, { color: tema.text }]}>Selecionar evento</Text>
              <Pressable onPress={() => setModalEventos(false)}><Ionicons name="close" size={24} color={tema.textSecondary} /></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {eventos.length === 0 ? <Text style={[styles.vazio, { color: tema.textSecondary }]}>Nenhum evento cadastrado.</Text> : eventos.map((evento) => (
                <Pressable key={evento.id} onPress={() => selecionarEvento(evento.id)} style={[styles.eventoOpcao, { backgroundColor: evento.id === eventoIdSelecionado ? tema.activeBackground : tema.surfaceSecondary, borderColor: evento.id === eventoIdSelecionado ? tema.primary : tema.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventoOpcaoNome, { color: tema.text }]}>{evento.nome}</Text>
                    <Text style={[styles.miniLegenda, { color: tema.textSecondary }]}>{intervaloEvento(evento)} • {evento.situacao === 'encerrado' ? 'Encerrado' : evento.situacao === 'em_andamento' ? 'Em andamento' : 'Agendado'}</Text>
                  </View>
                  <Text style={[styles.eventoOpcaoPresentes, { color: tema.primary }]}>{evento.presentes} presentes</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  conteudo: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 17, paddingBottom: 40 },
  cabecalho: { marginBottom: 18 },
  tituloPrincipal: { fontSize: 24, fontWeight: '900' },
  descricaoPrincipal: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  abas: { flexDirection: 'row', padding: 4, borderRadius: 13, borderWidth: 1, marginBottom: 20 },
  aba: { flex: 1, minHeight: 43, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  abaTexto: { fontSize: 13, fontWeight: '800' },
  carregando: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  caixaErro: { borderWidth: 1, borderRadius: 14, padding: 18, alignItems: 'center', gap: 10 },
  erroTexto: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  rotuloGrupo: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 9, marginTop: 2 },
  gradeIndicadores: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 9 },
  cardIndicador: { width: '48.5%', minHeight: 112, borderRadius: 14, borderWidth: 1, padding: 13, flexGrow: 1, flexBasis: '45%' },
  cardIndicadorTopo: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  cardIndicadorTitulo: { flex: 1, fontSize: 11, fontWeight: '700', lineHeight: 15 },
  cardIndicadorValor: { fontSize: 25, fontWeight: '900', marginTop: 9 },
  cardIndicadorDetalhe: { fontSize: 10, lineHeight: 14, marginTop: 4 },
  secao: { borderWidth: 1, borderRadius: 15, padding: 15, marginTop: 12, marginBottom: 4 },
  secaoTitulo: { fontSize: 16, fontWeight: '900' },
  secaoSubtitulo: { fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 15 },
  destaqueFaixa: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 11, marginBottom: 16 },
  destaqueFaixaTexto: { flex: 1, fontSize: 12, fontWeight: '700' },
  linhaBarraTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  textoBarra: { fontSize: 12, fontWeight: '700' },
  textoBarraValor: { fontSize: 11, fontWeight: '800' },
  trilho: { height: 9, borderRadius: 8, overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 8 },
  linhaMetricas: { flexDirection: 'row', gap: 9 },
  cardPequeno: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 11, minWidth: 0 },
  cardPequenoTitulo: { fontSize: 11, fontWeight: '800', lineHeight: 15 },
  simNaoLinha: { flexDirection: 'row', gap: 18, marginTop: 8 },
  simNaoItem: { flex: 1 },
  simNaoValor: { fontSize: 21, fontWeight: '900', marginTop: 7 },
  simNaoLegenda: { fontSize: 10, marginTop: 1 },
  cardPequenoRodape: { fontSize: 10, lineHeight: 14, marginTop: 5 },
  vazio: { fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  rankingPosicao: { fontSize: 12, fontWeight: '900', width: 16 },
  miniLegenda: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  notasLinha: { flexDirection: 'row', gap: 9, height: 105, alignItems: 'flex-end', marginTop: 9 },
  notaItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  notaQuantidade: { fontSize: 10, fontWeight: '800', marginBottom: 4 },
  notaTrilho: { width: '68%', flex: 1, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end' },
  notaPreenchimento: { width: '100%', borderRadius: 5 },
  notaRotulo: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  feedbackCabecalho: { flexDirection: 'row', padding: 13, borderRadius: 12, backgroundColor: 'rgba(128, 0, 255, 0.07)', marginBottom: 13 },
  feedbackNumero: { fontSize: 24, fontWeight: '900' },
  subtituloInterno: { fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 11 },
  linhaCrescimento: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  nomeEventoDestaque: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  botaoVerEvento: { padding: 14, borderRadius: 11, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  botaoVerEventoTexto: { fontSize: 12, fontWeight: '900' },
  seletorEvento: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 13, padding: 14, marginBottom: 13 },
  seletorRotulo: { fontSize: 9, letterSpacing: 1, fontWeight: '900' },
  seletorNome: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 18 },
  modalConteudo: { borderWidth: 1, borderRadius: 16, padding: 16, maxWidth: 650, width: '100%', alignSelf: 'center' },
  modalCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitulo: { fontSize: 17, fontWeight: '900' },
  eventoOpcao: { borderWidth: 1, borderRadius: 11, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventoOpcaoNome: { fontSize: 13, fontWeight: '800' },
  eventoOpcaoPresentes: { fontSize: 10, fontWeight: '800' },
});

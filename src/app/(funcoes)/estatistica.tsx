import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarraJogo } from '../../components/BarraJogo';
import { useEvento, type Evento } from '../../context/eventocontexto';
import { useTema } from '../../context/temaContexto';

type JogoInteresse = {
  nome: string;
  quantidade: number;
  porcentagem: number;
};

export default function EstatisticaScreen() {
  const db = useSQLiteContext();
  const { evento: eventoEmAndamento, eventos } = useEvento();
  const { tema } = useTema();

  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  const [totalParticipantes, setTotalParticipantes] = useState(0);
  const [totalPartidas, setTotalPartidas] = useState(0);
  const [jogosInteresse, setJogosInteresse] = useState<JogoInteresse[]>([]);
  const [consoleMaisUsado, setConsoleMaisUsado] = useState({ nome: 'N/A', porcentagem: 0 });

  // Define o evento inicial (prioriza o evento em andamento ou o primeiro da lista)
  useEffect(() => {
    if (!eventoSelecionado) {
      if (eventoEmAndamento) {
        setEventoSelecionado(eventoEmAndamento);
      } else if (eventos.length > 0) {
        setEventoSelecionado(eventos[0]);
      }
    } else {
      const atualizado = eventos.find((e) => e.id === eventoSelecionado.id);
      if (atualizado) setEventoSelecionado(atualizado);
    }
  }, [eventoEmAndamento, eventos]);

  const carregarEstatisticasReais = useCallback(async () => {
    // Se não há evento selecionado ou se ele é agendado para o futuro, zera tudo
    if (!eventoSelecionado || eventoSelecionado.situacao === 'agendado') {
      setTotalParticipantes(0);
      setTotalPartidas(0);
      setJogosInteresse([]);
      setConsoleMaisUsado({ nome: 'N/A', porcentagem: 0 });
      return;
    }

    try {
      // 1. Conta participantes únicos em todas as filas do evento (sem repetir a mesma pessoa)
      const resParticipantes = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(DISTINCT ep.participant_id) AS total
           FROM queue_entries qe
           INNER JOIN event_queues eq ON eq.id = qe.queue_id
           INNER JOIN event_participants ep ON ep.id = qe.event_participant_id
          WHERE eq.event_id = ?`,
        eventoSelecionado.id
      );
      const participantesUnicos = resParticipantes?.total ?? 0;
      setTotalParticipantes(participantesUnicos);

      // 2. Conta o total de entradas/partidas nas filas desse evento
      const resPartidas = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(qe.id) AS total
           FROM queue_entries qe
           INNER JOIN event_queues eq ON eq.id = qe.queue_id
          WHERE eq.event_id = ?`,
        eventoSelecionado.id
      );
      setTotalPartidas(resPartidas?.total ?? 0);

      // 3. Jogos com maior interesse (busca primeiro nos participantes presentes nas filas do evento;
      // se o evento ainda não tiver jogos vinculados na inscrição do evento, usa o catálogo geral de participantes)
      let listaJogos: JogoInteresse[] = [];

      if (participantesUnicos > 0) {
        const rowsJogosEvento = await db.getAllAsync<{ nome: string; total: number }>(
          `SELECT g.nome AS nome, COUNT(DISTINCT ep.participant_id) AS total
             FROM queue_entries qe
             INNER JOIN event_queues eq ON eq.id = qe.queue_id
             INNER JOIN event_participants ep ON ep.id = qe.event_participant_id
             INNER JOIN participant_games pg ON pg.participant_id = ep.participant_id
             INNER JOIN games g ON g.id = pg.game_id
            WHERE eq.event_id = ?
            GROUP BY g.id, g.nome
            ORDER BY total DESC, g.nome COLLATE NOCASE ASC
            LIMIT 6`,
          eventoSelecionado.id
        );

        listaJogos = rowsJogosEvento.map((item) => ({
          nome: item.nome,
          quantidade: item.total,
          porcentagem: Math.round((item.total / participantesUnicos) * 100),
        }));
      } else {
        // Caso o evento esteja em andamento/encerrado mas ninguém entrou em fila ainda,
        // mostra o interesse geral dos participantes cadastrados no app
        const totalCadastradosRow = await db.getFirstAsync<{ total: number }>(
          `SELECT COUNT(id) AS total FROM participants`
        );
        const totalCadastrados = totalCadastradosRow?.total ?? 0;

        if (totalCadastrados > 0) {
          const rowsJogosGeral = await db.getAllAsync<{ nome: string; total: number }>(
            `SELECT g.nome AS nome, COUNT(DISTINCT pg.participant_id) AS total
               FROM participant_games pg
               INNER JOIN games g ON g.id = pg.game_id
              GROUP BY g.id, g.nome
              ORDER BY total DESC, g.nome COLLATE NOCASE ASC
              LIMIT 6`
          );

          listaJogos = rowsJogosGeral.map((item) => ({
            nome: item.nome,
            quantidade: item.total,
            porcentagem: Math.round((item.total / totalCadastrados) * 100),
          }));
        }
      }

      setJogosInteresse(listaJogos);

      // Define o destaque na rosca (fila mais movimentada do evento ou N/A)
      const filaMaisMovimentada = await db.getFirstAsync<{ nome: string; total: number }>(
        `SELECT eq.nome AS nome, COUNT(qe.id) AS total
           FROM event_queues eq
           LEFT JOIN queue_entries qe ON qe.queue_id = eq.id
          WHERE eq.event_id = ?
          GROUP BY eq.id, eq.nome
          ORDER BY total DESC
          LIMIT 1`,
        eventoSelecionado.id
      );

      const totalEntradas = resPartidas?.total ?? 0;
      if (filaMaisMovimentada && totalEntradas > 0) {
        setConsoleMaisUsado({
          nome: filaMaisMovimentada.nome,
          porcentagem: Math.round((filaMaisMovimentada.total / totalEntradas) * 100),
        });
      } else {
        setConsoleMaisUsado({ nome: 'N/A', porcentagem: 0 });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do SQLite:', error);
    }
  }, [db, eventoSelecionado]);

  // Recarrega sempre que o evento selecionado mudar ou quando o usuário abrir a aba de Estatísticas
  useEffect(() => {
    void carregarEstatisticasReais();
  }, [carregarEstatisticasReais]);

  useFocusEffect(
    useCallback(() => {
      void carregarEstatisticasReais();
    }, [carregarEstatisticasReais])
  );

  function formatarSituacao(situacao: Evento['situacao']) {
    if (situacao === 'em_andamento') return 'Em andamento';
    if (situacao === 'agendado') return 'Agendado';
    return 'Encerrado';
  }

  return (
    <SafeAreaView style={[estilosBase.container, { backgroundColor: tema.background }]}>
      <ScrollView contentContainerStyle={estilosBase.scrollContent}>
        
        {/* Seletor de Evento */}
        <View style={estilosBase.section}>
          <Text style={[estilosBase.label, { color: tema.text }]}>Selecionar Evento</Text>
          <TouchableOpacity
            style={[
              estilosBase.dropdown,
              { backgroundColor: tema.surface, borderColor: tema.border },
            ]}
            onPress={() => setModalVisivel(true)}
            activeOpacity={0.8}
          >
            <View style={estilosBase.dropdownInfo}>
              <Text style={[estilosBase.dropdownText, { color: tema.text }]} numberOfLines={1}>
                {eventoSelecionado ? eventoSelecionado.nomeEvento : 'Nenhum evento cadastrado'}
              </Text>
              {eventoSelecionado && (
                <Text style={[estilosBase.dropdownSubtext, { color: tema.primary }]}>
                  {formatarSituacao(eventoSelecionado.situacao)} • {eventoSelecionado.dataInicio}
                </Text>
              )}
            </View>
            <Text style={[estilosBase.dropdownArrow, { color: tema.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Cards de Resumo */}
        <View style={estilosBase.cardsRow}>
          <View
            style={[
              estilosBase.card,
              { backgroundColor: tema.surface, borderColor: tema.border },
            ]}
          >
            <Text style={[estilosBase.cardNumber, { color: tema.primary }]}>
              {totalParticipantes}
            </Text>
            <Text style={[estilosBase.cardLabel, { color: tema.textSecondary }]}>
              Participantes
            </Text>
          </View>

          <View
            style={[
              estilosBase.card,
              { backgroundColor: tema.surface, borderColor: tema.border },
            ]}
          >
            <Text style={[estilosBase.cardNumber, { color: tema.primary }]}>
              {totalPartidas}
            </Text>
            <Text style={[estilosBase.cardLabel, { color: tema.textSecondary }]}>
              Partidas nas Filas
            </Text>
          </View>
        </View>

        {/* Jogos com maior interesse */}
        <View
          style={[
            estilosBase.sectionCard,
            { backgroundColor: tema.surface, borderColor: tema.border },
          ]}
        >
          <Text style={[estilosBase.sectionTitle, { color: tema.text }]}>
            Jogos com maior interesse
          </Text>
          {eventoSelecionado?.situacao === 'agendado' ? (
            <Text style={[estilosBase.emptyText, { color: tema.textSecondary }]}>
              Este evento está agendado para o futuro e ainda não possui dados registrados.
            </Text>
          ) : jogosInteresse.length === 0 ? (
            <Text style={[estilosBase.emptyText, { color: tema.textSecondary }]}>
              Nenhum jogo de interesse registrado para este evento ainda.
            </Text>
          ) : (
            jogosInteresse.map((item, index) => (
              <BarraJogo key={index} jogo={item.nome} porcentagem={item.porcentagem} />
            ))
          )}
        </View>

        {/* Fila / Console mais procurado no evento */}
        <View
          style={[
            estilosBase.sectionCard,
            { backgroundColor: tema.surface, borderColor: tema.border },
          ]}
        >
          <Text style={[estilosBase.sectionTitle, { color: tema.text }]}>
            Fila Mais Movimentada
          </Text>
          <View
            style={[
              estilosBase.donutChart,
              { borderColor: tema.primary, backgroundColor: tema.surfaceSecondary },
            ]}
          >
            <Text
              style={[estilosBase.donutText, { color: tema.textSecondary }]}
              numberOfLines={1}
            >
              {consoleMaisUsado.nome}
            </Text>
            <Text style={[estilosBase.donutTextStrong, { color: tema.text }]}>
              {consoleMaisUsado.porcentagem}%
            </Text>
          </View>
        </View>

        {/* Botão de Exportação */}
        <TouchableOpacity
          style={[estilosBase.exportButton, { backgroundColor: tema.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[estilosBase.exportButtonText, { color: tema.primaryText }]}>
            Exportar Relatório
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal para Selecionar Eventos (Em andamento, Agendados e Passados) */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableOpacity
          style={estilosBase.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisivel(false)}
        >
          <View
            style={[
              estilosBase.modalContent,
              { backgroundColor: tema.surface, borderColor: tema.border },
            ]}
          >
            <Text style={[estilosBase.modalTitle, { color: tema.text }]}>
              Selecionar Evento
            </Text>

            <ScrollView style={{ maxHeight: 340 }}>
              {eventos.length === 0 ? (
                <Text style={[estilosBase.emptyText, { color: tema.textSecondary }]}>
                  Nenhum evento encontrado.
                </Text>
              ) : (
                eventos.map((item) => {
                  const selecionado = eventoSelecionado?.id === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        estilosBase.eventoItem,
                        {
                          backgroundColor: selecionado
                            ? tema.activeBackground
                            : tema.surfaceSecondary,
                          borderColor: selecionado ? tema.primary : tema.border,
                        },
                      ]}
                      onPress={() => {
                        setEventoSelecionado(item);
                        setModalVisivel(false);
                      }}
                    >
                      <Text style={[estilosBase.eventoNome, { color: tema.text }]}>
                        {item.nomeEvento}
                      </Text>
                      <Text style={[estilosBase.eventoMeta, { color: tema.textSecondary }]}>
                        {formatarSituacao(item.situacao)} • {item.dataInicio} • {item.localEvento}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[estilosBase.fecharBtn, { borderColor: tema.border }]}
              onPress={() => setModalVisivel(false)}
            >
              <Text style={[estilosBase.fecharBtnTexto, { color: tema.textSecondary }]}>
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const estilosBase = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  dropdownInfo: {
    flex: 1,
    paddingRight: 10,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownSubtext: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
  },
  cardNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  donutChart: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  donutText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  donutTextStrong: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  exportButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 30,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  eventoItem: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  eventoNome: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  eventoMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  fecharBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  fecharBtnTexto: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
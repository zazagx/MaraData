import {
  buscarParticipantes,
  type Participante
} from '@/features/armazenamentoParticipantes';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';
import {
  buscarParticipantesDoEvento,
  registrarParticipanteNoEvento,
} from '../../../features/armazenamentoEvento';

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';


function calcularIdade(dataNascimento: string) {
  const [ano, mes, dia] = dataNascimento.split('-').map(Number)

  const hoje = new Date()

  let idade = hoje.getFullYear() - ano

  if (
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
  ) {
    idade--
  }

  return idade
}
function formatarData(dataNascimento: string) {
  const [ano, mes, dia] = dataNascimento.split('-')
  return `${dia}/${mes}/${ano}`
}


function obterIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}


export default function ParticipantesCadastrados() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);

  const router = useRouter()
  const params = useLocalSearchParams<{ eventId?: string; situacao?: string }>();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  const eventoEncerrado = Boolean(eventId && params.situacao === 'encerrado');

  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [todosParticipantes, setTodosParticipantes] = useState<Participante[]>([])
  const [busca, setBusca] = useState('')
  const [buscaVincular, setBuscaVincular] = useState('')
  const [modalVincularVisivel, setModalVincularVisivel] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [participantesNoEvento, setParticipantesNoEvento] = useState<Set<string>>(new Set());


  // Reconsulta o SQLite sempre que a tela volta a ficar ativa.
  // Quando há eventId, a lista principal contém somente participantes inscritos
  // naquele evento. A lista global é mantida separadamente para permitir novos vínculos.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      setErroCarregamento('');

      Promise.all([
        eventId
          ? buscarParticipantesDoEvento(db, eventId)
          : buscarParticipantes(db),
        eventId
          ? buscarParticipantes(db)
          : Promise.resolve([] as Participante[]),
      ])
        .then(([dadosVisiveis, todos]) => {
          if (ativo) {
            setParticipantes(dadosVisiveis);
            setTodosParticipantes(todos);
            setParticipantesNoEvento(
              new Set(eventId ? dadosVisiveis.map((item) => item.id) : [])
            );
          }
        })
        .catch((erro: unknown) => {
          console.error('Erro ao consultar participantes:', erro);
          if (ativo) setErroCarregamento('Não foi possível carregar os participantes salvos.');
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });

      return () => {
        ativo = false;
      };
    }, [db, eventId])
  )


  // Filters participants by name.
  const participantesFiltrados = participantes.filter((participante) =>
    participante.nome
      .toLocaleLowerCase('pt-BR')
      .includes(busca.trim().toLocaleLowerCase('pt-BR'))
  )

  // Na tela de um evento, permite localizar pessoas do cadastro geral que
  // ainda não foram vinculadas a ele, sem misturá-las à lista de participantes.
  const participantesDisponiveis = todosParticipantes.filter(
    (participante) => !participantesNoEvento.has(participante.id)
  );

  const participantesDisponiveisFiltrados = participantesDisponiveis.filter(
    (participante) =>
      participante.nome
        .toLocaleLowerCase('pt-BR')
        .includes(buscaVincular.trim().toLocaleLowerCase('pt-BR'))
  );

  //Setinha de detalhes do respectivo participante ああああ
  const [participanteSelecionado, setParticipanteSelecionado] =
  useState<Participante | null>(null)

  async function adicionarParticipanteSelecionadoAoEvento() {
    if (!eventId || !participanteSelecionado) return;

    try {
      const resultado = await registrarParticipanteNoEvento(
        db,
        eventId,
        participanteSelecionado.id
      );

      const inscritosAtualizados = await buscarParticipantesDoEvento(db, eventId);
      setParticipantes(inscritosAtualizados);
      setParticipantesNoEvento(
        new Set(inscritosAtualizados.map((item) => item.id))
      );
      setModalVincularVisivel(false);
      setParticipanteSelecionado(null);

      Alert.alert(
        resultado.jaExistia ? 'Participante já vinculado' : 'Participante adicionado',
        resultado.jaExistia
          ? 'Este participante já está registrado neste evento.'
          : 'O participante foi vinculado ao evento. Os dados desta inscrição foram registrados para as estatísticas.'
      );
    } catch (erro) {
      Alert.alert(
        'Não foi possível vincular',
        erro instanceof Error ? erro.message : 'Ocorreu um erro ao vincular o participante ao evento.'
      );
    }
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <Stack.Screen
        options={{
          title: 'Participantes',
          headerStyle: {
            backgroundColor: tema.header,
          },
          headerTintColor: tema.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',

          headerRight: () => (
            !eventoEncerrado ? (
              <Pressable
                style={styles.botaoAdicionar}
                onPress={() => router.push(eventId ? { pathname: '/novoparticipante', params: { eventId } } : '/novoparticipante')}
              >
                <Text style={styles.iconeMais}>+</Text>
              </Pressable>
            ) : null
          ),
        }}
      />


      {/* PARTICIPANT LIST */}

      <FlatList
        data={participantesFiltrados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.lista}

        ListHeaderComponent={
          <View>
            <View style={styles.buscaContainer}>
              <Text style={styles.iconeBusca}>⌕</Text>
              <TextInput
                style={styles.campoBusca}
                placeholder="Buscar participante..."
                placeholderTextColor={tema.textSecondary}
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            {eventId && !eventoEncerrado && (
              <Pressable
                style={styles.botaoVincularExistente}
                onPress={() => {
                  setBuscaVincular('');
                  setModalVincularVisivel(true);
                }}
              >
                <Text style={styles.textoBotaoVincularExistente}>
                  + Vincular participante já cadastrado
                </Text>
              </Pressable>
            )}
          </View>
        }

        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Text style={styles.textoVazio}>
              {carregando
                ? 'Carregando participantes...'
                : erroCarregamento || (busca
                  ? 'Nenhum participante encontrado.'
                  : eventId
                    ? 'Nenhum participante vinculado a este evento ainda.'
                    : 'Nenhum participante cadastrado ainda.')}
            </Text>

            {!carregando && !erroCarregamento && !busca && (
              <Text style={styles.textoAjuda}>
                {eventId
                  ? eventoEncerrado
                    ? 'Este evento foi encerrado; a lista está disponível somente para consulta.'
                    : 'Use as opções acima para cadastrar uma pessoa nova ou vincular alguém já cadastrado.'
                  : 'Toque no botão + para cadastrar o primeiro participante.'}
              </Text>
            )}
          </View>
        }

        renderItem={({ item }) => {

          const idade = calcularIdade(item.dataNascimento)
          

          return (
            <View style={styles.card}>

              {/* NAME AND AVATAR */}

              <View style={styles.cabecalhoCard}>

                <View style={styles.avatar}>
                  <Text style={styles.iniciais}>
                    {obterIniciais(item.nome)}
                  </Text>
                </View>

                <View style={styles.identificacao}>

                  <Text style={styles.nome} numberOfLines={1}>
                    {item.nome}
                  </Text>

                  <Text style={styles.subtitulo}>
                    {idade} {idade === 1 ? 'ano' : 'anos'} • {item.genero}
                  </Text>

                </View>

                <Pressable
                style={styles.botaoSeta}
                onPress={() => setParticipanteSelecionado(item)}
                hitSlop={10}
                >
                  <Text style={styles.seta}>›</Text>
                </Pressable>

              </View>


              {/* ADDITIONAL INFORMATION */}

            </View>
          )
        }}
      />
      <Modal
  visible={participanteSelecionado !== null}
  transparent
  animationType="fade"
  onRequestClose={() => setParticipanteSelecionado(null)}
>
  <View style={styles.fundoModal}>

    {/* Fundo escuro clicável */}
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => setParticipanteSelecionado(null)}
    />

    {/* Card de informações */}
    <View style={styles.modalCard}>

      {participanteSelecionado && (
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.modalCabecalho}>

            <View style={styles.avatar}>
              <Text style={styles.iniciais}>
                {obterIniciais(participanteSelecionado.nome)}
              </Text>
            </View>

            <View style={styles.identificacaoModal}>
              <Text style={styles.nomeModal}>
                {participanteSelecionado.nome}
              </Text>

              <Text style={styles.subtitulo}>
                {calcularIdade(participanteSelecionado.dataNascimento)} anos
                {' • '}
                {participanteSelecionado.genero}
              </Text>
            </View>

            <Pressable
              style={styles.botaoFechar}
              onPress={() => setParticipanteSelecionado(null)}
            >
              <Text style={styles.textoFechar}>×</Text>
            </Pressable>

          </View>

          <View style={styles.separador} />

          <Text style={styles.rotuloModal}>
            Data de nascimento
          </Text>
          <Text style={styles.valorModal}>
            {formatarData(participanteSelecionado.dataNascimento)}
          </Text>

          <Text style={styles.rotuloModal}>
            Escolaridade
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.escolaridade}
          </Text>

          <Text style={styles.rotuloModal}>
            Jogos de interesse
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.jogos.join(', ')}
          </Text>

          <Text style={styles.rotuloModal}>
            Conhece o mercado de games?
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.mercadoGames}
          </Text>

          <Text style={styles.rotuloModal}>
            Interesse profissional no mercado de games
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.interesseProfissionalGames}
          </Text>

        </ScrollView>
      )}

      {eventId && participanteSelecionado && (
        <View style={styles.acoesModal}>
          {participantesNoEvento.has(participanteSelecionado.id) ? (
            <Text style={styles.participanteVinculado}>Este participante já está vinculado a este evento.</Text>
          ) : (
            <Pressable style={styles.botaoAdicionarEvento} onPress={adicionarParticipanteSelecionadoAoEvento}>
              <Text style={styles.textoBotaoAdicionarEvento}>Adicionar participante a este evento</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  </View>
</Modal>

      {/* Modal separado: procura no cadastro global sem poluir a lista do evento. */}
      <Modal
        visible={modalVincularVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVincularVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVincularVisivel(false)}
          />
          <View style={styles.modalVincularCard}>
            <View style={styles.modalCabecalho}>
              <View style={styles.identificacaoModal}>
                <Text style={styles.nomeModal}>Vincular participante</Text>
                <Text style={styles.subtitulo}>
                  Escolha alguém já cadastrado que ainda não participa deste evento.
                </Text>
              </View>
              <Pressable
                style={styles.botaoFechar}
                onPress={() => setModalVincularVisivel(false)}
              >
                <Text style={styles.textoFechar}>×</Text>
              </Pressable>
            </View>

            <View style={styles.buscaContainer}>
              <Text style={styles.iconeBusca}>⌕</Text>
              <TextInput
                style={styles.campoBusca}
                placeholder="Buscar participante..."
                placeholderTextColor={tema.textSecondary}
                value={buscaVincular}
                onChangeText={setBuscaVincular}
              />
            </View>

            <FlatList
              data={participantesDisponiveisFiltrados}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.listaVincular}
              ListEmptyComponent={
                <Text style={styles.textoVazioVincular}>
                  {participantesDisponiveis.length === 0
                    ? 'Todos os participantes cadastrados já estão vinculados a este evento.'
                    : 'Nenhum participante encontrado.'}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.itemModal}
                  onPress={() => {
                    setParticipanteSelecionado(item);
                    setModalVincularVisivel(false);
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.iniciais}>{obterIniciais(item.nome)}</Text>
                  </View>
                  <View style={styles.identificacaoModal}>
                    <Text style={styles.nomeItemModal}>{item.nome}</Text>
                    <Text style={styles.jogosItemModal}>
                      {item.jogos.join(', ') || 'Sem jogos informados'}
                    </Text>
                  </View>
                  <Text style={styles.iconeAdicionarVinculo}>+</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  )
}


const estilosBase = StyleSheet.create({
  botaoVincularExistente: {
    backgroundColor: '#EEE5FF',
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  textoBotaoVincularExistente: {
    color: '#6500CC',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalVincularCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
  },
  listaVincular: {
    flexGrow: 0,
    minHeight: 100,
    maxHeight: 380,
  },
  textoVazioVincular: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    padding: 22,
  },
  iconeAdicionarVinculo: {
    color: '#8000FF',
    fontSize: 25,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },

  acoesModal: {
    paddingTop: 12,
  },
  botaoAdicionarEvento: {
    backgroundColor: '#8000ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  textoBotaoAdicionarEvento: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  participanteVinculado: {
    color: '#23865A',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },

  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },

  lista: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 25,
    flexGrow: 1,
  },

  botaoAdicionar: {
    backgroundColor: '#fff',
    width: 34,
    height: 34,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },

  iconeMais: {
    fontSize: 26,
    color: '#8000ff',
    lineHeight: 30,
  },

  buscaContainer: {
    height: 48,
    backgroundColor: '#e7e7f5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  iconeBusca: {
    fontSize: 25,
    color: '#342a80',
    marginRight: 10,
  },

  campoBusca: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 25,
    backgroundColor: '#ded8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iniciais: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8000ff',
  },

  identificacao: {
    flex: 1,
  },

  nome: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#17152b',
  },

  subtitulo: {
    fontSize: 13,
    color: '#62627a',
    marginTop: 4,
  },

  seta: {
    fontSize: 28,
    color: '#342a80',
    marginHorizontal: 5,
  },

  detalhes: {
    backgroundColor: '#f1efff',
    borderRadius: 10,
    padding: 11,
  },

  informacao: {
    fontSize: 12,
    color: '#25234c',
    marginBottom: 8,
  },

  simbolo: {
    color: '#8000ff',
    fontWeight: 'bold',
  },

  listaVazia: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 25,
  },

  textoVazio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },

  textoAjuda: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  botaoSeta: {
  paddingHorizontal: 8,
  paddingVertical: 4,
},

fundoModal: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.60)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

modalCard: {
  backgroundColor: '#fff',
  width: '100%',
  maxWidth: 480,
  maxHeight: '80%',
  borderRadius: 18,
  padding: 20,
  elevation: 10,
},

modalCabecalho: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},

identificacaoModal: {
  flex: 1,
},

nomeModal: {
  fontSize: 17,
  fontWeight: 'bold',
  color: '#17152b',
},

botaoFechar: {
  width: 32,
  height: 32,
  borderRadius: 20,
  backgroundColor: '#eee',
  alignItems: 'center',
  justifyContent: 'center',
},

textoFechar: {
  fontSize: 25,
  color: '#555',
  lineHeight: 28,
},

separador: {
  height: 1,
  backgroundColor: '#ddd',
  marginBottom: 15,
},

rotuloModal: {
  fontSize: 13,
  fontWeight: 'bold',
  color: '#8000ff',
  marginTop: 12,
  marginBottom: 4,
},

valorModal: {
  fontSize: 14,
  color: '#333',
  lineHeight: 21,
},

})
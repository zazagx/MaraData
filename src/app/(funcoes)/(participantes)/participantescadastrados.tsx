import {
  buscarParticipantes,
  type Participante
} from '@/features/armazenamentoParticipantes'

import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'


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

  const router = useRouter()

  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [busca, setBusca] = useState('')


  // Updates the list whenever this screen becomes active.
  useFocusEffect(
    useCallback(() => {
      setParticipantes(buscarParticipantes())
    }, [])
  )


  // Filters participants by name.
  const participantesFiltrados = participantes.filter((participante) =>
    participante.nome
      .toLocaleLowerCase('pt-BR')
      .includes(busca.trim().toLocaleLowerCase('pt-BR'))
  )

  //Setinha de detalhes do respectivo participante ああああ
  const [participanteSelecionado, setParticipanteSelecionado] =
  useState<Participante | null>(null)


  return (
    <View style={styles.container}>

      {/* HEADER */}

      <Stack.Screen
        options={{
          title: 'Participantes',
          headerStyle: {
            backgroundColor: '#8000ff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',

          headerRight: () => (
            <Pressable
              style={styles.botaoAdicionar}
              onPress={() => router.push('/novoparticipante')}
            >
              <Text style={styles.iconeMais}>+</Text>
            </Pressable>
          ),
        }}
      />


      {/* PARTICIPANT LIST */}

      <FlatList
        data={participantesFiltrados}
        keyExtractor={(_item, index) => index.toString()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.lista}

        ListHeaderComponent={
          <View style={styles.buscaContainer}>

            <Text style={styles.iconeBusca}>⌕</Text>

            <TextInput
              style={styles.campoBusca}
              placeholder="Buscar participante..."
              placeholderTextColor="#777"
              value={busca}
              onChangeText={setBusca}
            />

          </View>
        }

        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Text style={styles.textoVazio}>
              {busca
                ? 'Nenhum participante encontrado.'
                : 'Nenhum participante cadastrado ainda.'}
            </Text>

            {!busca && (
              <Text style={styles.textoAjuda}>
                Toque no botão + para cadastrar o primeiro participante.
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

    </View>
  </View>
</Modal>

    </View>
  )
}


const styles = StyleSheet.create({

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
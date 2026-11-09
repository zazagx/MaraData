import {
  buscarParticipantes,
  type Participante
} from '@/features/armazenamentoParticipantes'

import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import {
  FlatList,
  Pressable,
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

                <Text style={styles.seta}>›</Text>

              </View>


              {/* ADDITIONAL INFORMATION */}

              <View style={styles.detalhes}>

                <Text style={styles.informacao}>
                  <Text style={styles.simbolo}>◆ </Text>
                  Escolaridade: {item.escolaridade}
                </Text>

                <Text style={styles.informacao}>
                  🎮 Jogos: {item.jogos.join(', ')}
                </Text>

                <Text style={styles.informacao}>
                  <Text style={styles.simbolo}>◆ </Text>
                  Mercado de games: {item.mercadoGames}
                </Text>

                <Text style={styles.informacao}>
                  <Text style={styles.simbolo}>★ </Text>
                  Interesse profissional: {item.interesseProfissionalGames}
                </Text>

              </View>

            </View>
          )
        }}
      />

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

})
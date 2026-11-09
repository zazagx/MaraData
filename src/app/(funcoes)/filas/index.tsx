import { buscarFilas, type Fila } from '../../../features/armazenamentofilas'

import { Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'


export default function ListaFilas() {

  const router = useRouter()

  const [filas, setFilas] = useState<Fila[]>([])


  // Atualiza a lista sempre que a tela fica ativa.
  useFocusEffect(
    useCallback(() => {
      setFilas(buscarFilas())
    }, [])
  )


  return (
    <View style={styles.container}>

      {/* HEADER */}

      <Stack.Screen
        options={{
          title: 'Filas',

          headerStyle: {
            backgroundColor: '#8000ff',
          },

          headerTintColor: '#ffffff',
          headerTitleAlign: 'center',

          // Botão para voltar à Home.
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/')}
              style={{ marginLeft: 8 }}
            >
              <Image
                source={require('../../../components/icons/arrow_left.png')}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
          ),

          // Botão para criar uma nova fila.
          headerRight: () => (
            <Pressable
              style={styles.botaoAdicionar}
              onPress={() => router.push('/filas/criarfilas')}
            >
              <Text style={styles.iconeMais}>+</Text>
            </Pressable>
          ),
        }}
      />


      {/* LISTA DE FILAS */}

      <FlatList

        data={filas}

        keyExtractor={(item) => item.id}

        contentContainerStyle={styles.lista}

        ListHeaderComponent={
          <Text style={styles.tituloSecao}>
            Filas do evento
          </Text>
        }

        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Text style={styles.textoVazio}>
              Nenhuma fila criada ainda.
            </Text>

            <Text style={styles.textoAjuda}>
              Toque no botão + para criar sua primeira fila.
            </Text>
          </View>
        }

        // Cada cartão representa uma fila.
        renderItem={({ item }) => (

          <Pressable
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: '/filas/gerenciarfilas',
                params: {
                  filaId: item.id,
                },
              })
            }}
          >

            <View style={styles.cabecalhoCard}>

              <Text style={styles.iconeControle}>
                🎮
              </Text>

              <Text style={styles.nomeFila}>
                {item.nome}
              </Text>

              <Text style={styles.seta}>
                ›
              </Text>

            </View>


            <Text style={styles.evento}>
              {item.evento}
            </Text>


            <View style={styles.rodapeCard}>

              <View style={styles.statusContainer}>

                <View
                  style={[
                    styles.indicadorStatus,
                    item.status === 'encerrada' && styles.statusEncerrado
                  ]}
                />

                <Text style={styles.statusTexto}>
                  {item.status === 'ativa' ? 'Ativa' : 'Encerrada'}
                </Text>

              </View>


              {item.status === 'ativa' && (
                <Text style={styles.quantidade}>
                  {item.quantidadeAguardando} aguardando
                </Text>
              )}

            </View>

          </Pressable>

        )}

        // Logo da empresa.
        ListFooterComponent={
          <View style={styles.mascoteContainer}>

            <Image
              source={require('../../../components/icons/LoboIcone.png')}
              style={styles.logoFundo}
              resizeMode="contain"
            />

          </View>
        }

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
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    flexGrow: 1,
  },


  // BOTÃO DO HEADER

  botaoAdicionar: {
    backgroundColor: '#ffffff',
    width: 34,
    height: 34,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  iconeMais: {
    color: '#8000ff',
    fontSize: 26,
    lineHeight: 30,
  },


  // TÍTULO DA SEÇÃO

  tituloSecao: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#25234c',
    marginBottom: 18,
  },


  // CARTÃO DA FILA

  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 14,
  },

  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconeControle: {
    fontSize: 24,
    marginRight: 12,
  },

  nomeFila: {
    flex: 1,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#25234c',
  },

  seta: {
    fontSize: 27,
    color: '#8000ff',
  },

  evento: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginLeft: 36,
  },

  rodapeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  indicadorStatus: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#35b879',
    marginRight: 6,
  },

  statusEncerrado: {
    backgroundColor: '#999999',
  },

  statusTexto: {
    fontSize: 13,
    color: '#444',
  },

  quantidade: {
    fontSize: 13,
    color: '#555',
    fontWeight: 'bold',
  },


  // LISTA VAZIA

  listaVazia: {
    alignItems: 'center',
    marginTop: 60,
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
    marginTop: 8,
  },


  // LOGO DA EMPRESA

  mascoteContainer: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 10,
  },

  logoFundo: {
    width: 150,
    height: 150,
    opacity: 0.10,
  },

})
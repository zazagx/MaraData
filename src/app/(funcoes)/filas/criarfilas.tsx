import { salvarFila } from '../../../features/armazenamentofilas'

import { useRouter } from 'expo-router'
import { useState } from 'react'

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'


export default function CriarFila() {

  const router = useRouter()

  const [nome, setNome] = useState('')
  const [evento, setEvento] = useState('')

  const [erros, setErros] = useState({
    nome: '',
    evento: '',
  })


  function cadastrarFila() {

    const novosErros = {
      nome: '',
      evento: '',
    }

    if (nome.trim() === '') {
      novosErros.nome = 'Digite o nome da fila.'
    }

    if (evento.trim() === '') {
      novosErros.evento = 'Informe o evento relacionado à fila.'
    }

    setErros(novosErros)

    const temErro = Object.values(novosErros).some(
      (erro) => erro !== ''
    )

    if (temErro) return


    // Saves the new queue in shared memory.
    salvarFila({
      nome: nome.trim(),
      evento: evento.trim(),
      status: 'ativa',
      quantidadeAguardando: 0,
    })

    // Returns to the queue list.
    router.replace('/filas')

  }


  return (

    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >

      <View style={styles.formulario}>

        <Text style={styles.titulo}>
          Nova fila
        </Text>

        <Text style={styles.descricao}>
          Preencha as informações para criar uma nova fila.
        </Text>


        {/* QUEUE NAME */}

        <Text style={styles.label}>
          Nome da fila
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Console, Just Dance..."
          placeholderTextColor="#888"
          value={nome}
          onChangeText={(texto) => {
            setNome(texto)
            setErros({ ...erros, nome: '' })
          }}
        />

        {erros.nome !== '' && (
          <Text style={styles.textoErro}>
            {erros.nome}
          </Text>
        )}


        {/* EVENT */}

        <Text style={styles.label}>
          Evento relacionado
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ex.: Arena Games 2026"
          placeholderTextColor="#888"
          value={evento}
          onChangeText={(texto) => {
            setEvento(texto)
            setErros({ ...erros, evento: '' })
          }}
        />

        {erros.evento !== '' && (
          <Text style={styles.textoErro}>
            {erros.evento}
          </Text>
        )}


        {/* INFORMATION */}

        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            A nova fila será criada com o status Ativa e estará disponível
            para receber participantes.
          </Text>
        </View>


        {/* CREATE BUTTON */}

        <Pressable
          style={styles.botao}
          onPress={cadastrarFila}
        >
          <Text style={styles.textoBotao}>
            Criar fila
          </Text>
        </Pressable>


        {/* CANCEL BUTTON */}

        <Pressable
          style={styles.botaoCancelar}
          onPress={() => router.back()}
        >
          <Text style={styles.textoCancelar}>
            Cancelar
          </Text>
        </Pressable>

      </View>

    </ScrollView>

  )
}


const styles = StyleSheet.create({

  conteudo: {
    flexGrow: 1,
    backgroundColor: '#f1f1f1',
    padding: 20,
  },

  formulario: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingVertical: 15,
  },

  titulo: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#25234c',
    marginBottom: 8,
  },

  descricao: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },

  label: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#25234c',
    marginBottom: 10,
    marginTop: 15,
  },

  input: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
    fontSize: 15,
    color: '#222222',
  },

  textoErro: {
    color: '#ff002f',
    fontSize: 13,
    marginTop: 5,
  },

  aviso: {
    backgroundColor: '#eee5ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
  },

  avisoTexto: {
    color: '#5c3290',
    fontSize: 13,
    lineHeight: 20,
  },

  botao: {
    backgroundColor: '#8000ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },

  textoBotao: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  botaoCancelar: {
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },

  textoCancelar: {
    color: '#666666',
    fontSize: 15,
    fontWeight: 'bold',
  },

})
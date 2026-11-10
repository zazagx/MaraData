import {
  adicionarJogo,
  buscarJogos,
  salvarParticipante,
  type Participante
} from '@/features/armazenamentoParticipantes'

import { useRouter } from 'expo-router'
import { useState } from 'react'

import { adicionarParticipanteAFila } from '@/features/armazenamentofilas'
import { useLocalSearchParams } from 'expo-router'
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'

// Load the native date picker only on mobile platforms.
// The web version will use a regular text field instead.
const DatePickerModule = Platform.OS === 'web'
  ? null
  : require('@react-native-community/datetimepicker')

const DateTimePicker = DatePickerModule?.default
const DateTimePickerAndroid = DatePickerModule?.DateTimePickerAndroid


const OPCOES_GENERO = [
  'Masculino',
  'Feminino',
  'Prefiro não informar'
]

const OPCOES_ESCOLARIDADE = [
  'Não Alfabetizado',
  'Ensino Fundamental',
  'Ensino Médio',
  'Ensino Superior',
  'Pós-graduação',
  'Outro'
]


// Converts a Date into YYYY-MM-DD.
function dataParaISO(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}


// Converts YYYY-MM-DD into a Date.
function ISOParaData(valor: string) {
  const [ano, mes, dia] = valor.split('-').map(Number)

  return new Date(ano, mes - 1, dia)
}


// Checks whether a birthday is valid and not in the future.
function dataNascimentoValida(valor: string) {
  if (!valor) return false

  const [ano, mes, dia] = valor.split('-').map(Number)

  const data = new Date(ano, mes - 1, dia)

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia &&
    data <= hoje
  )
}


// Converts YYYY-MM-DD into DD/MM/YYYY for display.
function formatarData(valor: string) {
  if (!valor) return ''

  const [ano, mes, dia] = valor.split('-')

  return `${dia}/${mes}/${ano}`
}


// Reusable selection field.
function CampoSelecao({
  titulo,
  valor,
  placeholder,
  opcoes,
  aberto,
  erro,
  aoAbrir,
  aoSelecionar
}: {
  titulo: string
  valor: string
  placeholder: string
  opcoes: string[]
  aberto: boolean
  erro: string
  aoAbrir: () => void
  aoSelecionar: (valor: string) => void
}) {
  return (
    <View style={styles.campo}>

      <Text style={styles.textDesing}>
        {titulo}
      </Text>

      <Pressable
        style={styles.seletor}
        onPress={aoAbrir}
      >
        <Text style={valor ? styles.textoSelecionado : styles.placeholder}>
          {valor || placeholder}
        </Text>

        <Text style={styles.seta}>
          {aberto ? '▲' : '▼'}
        </Text>
      </Pressable>

      {aberto && (
        <View style={styles.listaOpcoes}>

          {opcoes.map((opcao) => (
            <Pressable
              key={opcao}
              style={styles.opcao}
              onPress={() => aoSelecionar(opcao)}
            >
              <Text style={styles.textoOpcao}>
                {opcao}
              </Text>
            </Pressable>
          ))}

        </View>
      )}

      {erro !== '' && (
        <Text style={styles.textoErro}>
          {erro}
        </Text>
      )}

    </View>
  )
}


// Reusable Yes/No field.
function CampoSimNao({
  titulo,
  valor,
  erro,
  aoSelecionar
}: {
  titulo: string
  valor: string
  erro: string
  aoSelecionar: (valor: string) => void
}) {
  return (
    <View style={styles.campo}>

      <Text style={styles.textDesing}>
        {titulo}
      </Text>

      <View style={styles.opcoesSimNao}>

        {['Sim', 'Não'].map((opcao) => (
          <Pressable
            key={opcao}
            style={[
              styles.botaoOpcao,
              valor === opcao && styles.botaoOpcaoSelecionado
            ]}
            onPress={() => aoSelecionar(opcao)}
          >
            <Text
              style={[
                styles.textoBotaoOpcao,
                valor === opcao && styles.textoBotaoOpcaoSelecionado
              ]}
            >
              {opcao}
            </Text>
          </Pressable>
        ))}

      </View>

      {erro !== '' && (
        <Text style={styles.textoErro}>
          {erro}
        </Text>
      )}

    </View>
  )
}


export default function novoparticipante() {

  const router = useRouter()
  const params = useLocalSearchParams<{ origem?: string; filaId?: string }>()

  const [participante, setParticipante] = useState<Participante>({
    nome: '',
    dataNascimento: '',
    genero: '',
    escolaridade: '',
    jogos: [],
    mercadoGames: '',
    interesseProfissionalGames: '',
  })


  const [erros, setErros] = useState({
    nome: '',
    dataNascimento: '',
    genero: '',
    escolaridade: '',
    jogos: '',
    mercadoGames: '',
    interesseProfissionalGames: '',
  })


  // Controls which dropdown is currently open.
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null)


  // Games catalogue and search.
  const [jogosDisponiveis, setJogosDisponiveis] = useState(buscarJogos())
  const [buscaJogo, setBuscaJogo] = useState('')


  // Birthday picker.
  const [seletorDataVisivel, setSeletorDataVisivel] = useState(false)
  const [dataTemporaria, setDataTemporaria] = useState(new Date(2000, 0, 1))

  // Used only by the web version.
  const [dataNascimentoWeb, setDataNascimentoWeb] = useState('')


  // Updates participant information.
  function alterarCampo(
    campo: keyof Participante,
    valor: string | string[]
  ) {
    setParticipante((anterior) => ({
      ...anterior,
      [campo]: valor
    }) as Participante)

    setErros((anterior) => ({
      ...anterior,
      [campo]: ''
    }))
  }


  // Opens the native date picker.
  function abrirSeletorData() {

    if (Platform.OS === 'android' && DateTimePickerAndroid) {

      DateTimePickerAndroid.open({
        value: participante.dataNascimento
          ? ISOParaData(participante.dataNascimento)
          : new Date(2000, 0, 1),

        mode: 'date',
        display: 'default',
        maximumDate: new Date(),

        onChange: (evento: { type: string }, dataSelecionada?: Date) => {

          if (evento.type === 'set' && dataSelecionada) {
            alterarCampo('dataNascimento', dataParaISO(dataSelecionada))
          }

        }
      })

      return
    }


    if (Platform.OS === 'ios') {

      setDataTemporaria(
        participante.dataNascimento
          ? ISOParaData(participante.dataNascimento)
          : new Date(2000, 0, 1)
      )

      setSeletorDataVisivel(true)
    }

  }


  // Formats the birthday entered manually on the web.
  function alterarDataWeb(texto: string) {

    const numeros = texto.replace(/\D/g, '').slice(0, 8)

    let formatado = numeros

    if (numeros.length > 4) {
      formatado = `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`
    } else if (numeros.length > 2) {
      formatado = `${numeros.slice(0, 2)}/${numeros.slice(2)}`
    }

    setDataNascimentoWeb(formatado)


    if (numeros.length === 8) {

      const dia = Number(numeros.slice(0, 2))
      const mes = Number(numeros.slice(2, 4))
      const ano = Number(numeros.slice(4, 8))

      const data = new Date(ano, mes - 1, dia)
      const dataISO = dataParaISO(data)

      if (dataNascimentoValida(dataISO)) {
        alterarCampo('dataNascimento', dataISO)
      } else {
        alterarCampo('dataNascimento', '')
      }

    } else {
      alterarCampo('dataNascimento', '')
    }

  }


  // Selects or unselects a game.
  function alternarJogo(jogo: string) {

    setParticipante((anterior) => {

      const jaSelecionado = anterior.jogos.includes(jogo)

      return {
        ...anterior,

        jogos: jaSelecionado
          ? anterior.jogos.filter((item) => item !== jogo)
          : [...anterior.jogos, jogo]
      }

    })

    setErros((anterior) => ({
      ...anterior,
      jogos: ''
    }))

  }


  // Adds a new game to the shared catalogue.
  function adicionarNovoJogo() {

    const novoJogo = adicionarJogo(buscaJogo)

    if (novoJogo === '') return

    setJogosDisponiveis(buscarJogos())

    setParticipante((anterior) => ({
      ...anterior,

      jogos: anterior.jogos.includes(novoJogo)
        ? anterior.jogos
        : [...anterior.jogos, novoJogo]
    }))

    setErros((anterior) => ({
      ...anterior,
      jogos: ''
    }))

    setBuscaJogo('')

  }


  // Validates the form.
  function validarCadastro() {

    const novosErros = {
      nome: '',
      dataNascimento: '',
      genero: '',
      escolaridade: '',
      jogos: '',
      mercadoGames: '',
      interesseProfissionalGames: '',
    }


    if (participante.nome.trim() === '') {
      novosErros.nome = 'Digite o nome do participante.'
    } else if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(participante.nome.trim())) {
      novosErros.nome = 'Digite um nome válido.'
    }


    if (!dataNascimentoValida(participante.dataNascimento)) {
      novosErros.dataNascimento = 'Informe uma data de nascimento válida.'
    }


    if (participante.genero === '') {
      novosErros.genero = 'Selecione o gênero.'
    }


    if (participante.escolaridade === '') {
      novosErros.escolaridade = 'Selecione a escolaridade.'
    }


    if (participante.jogos.length === 0) {
      novosErros.jogos = 'Selecione pelo menos um jogo.'
    }


    if (participante.mercadoGames === '') {
      novosErros.mercadoGames = 'Responda à pergunta.'
    }


    if (participante.interesseProfissionalGames === '') {
      novosErros.interesseProfissionalGames = 'Responda à pergunta.'
    }


    setErros(novosErros)


    const temErro = Object.values(novosErros).some(
      (erro) => erro !== ''
    )


if (!temErro) {

  const participanteSalvo = {
    ...participante,
    nome: participante.nome.trim()
  }

  salvarParticipante(participanteSalvo)

  // Se o cadastro começou pela tela de filas,
  // adiciona o participante diretamente à fila.
  if (params.origem === 'fila' && params.filaId) {

    adicionarParticipanteAFila(params.filaId, {
      nome: participanteSalvo.nome,
      dataNascimento: participanteSalvo.dataNascimento,
      jogos: participanteSalvo.jogos,
    })

    router.replace({
      pathname: '/confirmacaoCadastroParticipante',
      params: {
        origem: 'fila',
        filaId: params.filaId
      },
    })

  } else {

    // Cadastro realizado pela tela normal de participantes.
    router.replace('/confirmacaoCadastroParticipante')

  }

}

  }


  // Filters the game catalogue.
  const jogosFiltrados = jogosDisponiveis.filter((jogo) =>
    jogo.toLocaleLowerCase('pt-BR').includes(buscaJogo.trim().toLocaleLowerCase('pt-BR'))
  )

  const jogoJaExiste = jogosDisponiveis.some((jogo) =>
    jogo.toLocaleLowerCase('pt-BR') === buscaJogo.trim().toLocaleLowerCase('pt-BR')
  )


  return (
    <>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.cadastroParticipante}>


          {/* NAME */}

          <Text style={styles.textDesing}>
            Nome do participante
          </Text>

          <TextInput
            placeholder="Digite o nome"
            value={participante.nome}
            onChangeText={(texto) => alterarCampo('nome', texto)}
            style={styles.inputBox}
          />

          {erros.nome !== '' && (
            <Text style={styles.textoErro}>{erros.nome}</Text>
          )}


          {/* BIRTHDAY */}

          <Text style={styles.textDesing}>
            Data de nascimento
          </Text>

          {Platform.OS === 'web' ? (

            <TextInput
              placeholder="DD/MM/AAAA"
              value={dataNascimentoWeb}
              onChangeText={alterarDataWeb}
              keyboardType="numeric"
              maxLength={10}
              style={styles.inputBox}
            />

          ) : (

            <Pressable
              style={styles.seletor}
              onPress={abrirSeletorData}
            >
              <Text style={participante.dataNascimento
                ? styles.textoSelecionado
                : styles.placeholder}
              >
                {participante.dataNascimento
                  ? formatarData(participante.dataNascimento)
                  : 'Selecione a data de nascimento'}
              </Text>

              <Text style={styles.seta}>▣</Text>
            </Pressable>

          )}

          {erros.dataNascimento !== '' && (
            <Text style={styles.textoErro}>{erros.dataNascimento}</Text>
          )}


          {/* GENDER */}

          <CampoSelecao
            titulo="Gênero"
            valor={participante.genero}
            placeholder="Selecione o gênero"
            opcoes={OPCOES_GENERO}
            aberto={dropdownAberto === 'genero'}
            erro={erros.genero}
            aoAbrir={() => setDropdownAberto(
              dropdownAberto === 'genero' ? null : 'genero'
            )}
            aoSelecionar={(valor) => {
              alterarCampo('genero', valor)
              setDropdownAberto(null)
            }}
          />


          {/* EDUCATION */}

          <CampoSelecao
            titulo="Escolaridade"
            valor={participante.escolaridade}
            placeholder="Selecione a escolaridade"
            opcoes={OPCOES_ESCOLARIDADE}
            aberto={dropdownAberto === 'escolaridade'}
            erro={erros.escolaridade}
            aoAbrir={() => setDropdownAberto(
              dropdownAberto === 'escolaridade' ? null : 'escolaridade'
            )}
            aoSelecionar={(valor) => {
              alterarCampo('escolaridade', valor)
              setDropdownAberto(null)
            }}
          />


          {/* GAMES */}

          <View style={styles.campo}>

            <Text style={styles.textDesing}>
              Quais jogos você tem mais interesse?
            </Text>

            <TextInput
              placeholder="Buscar um jogo ou adicionar um novo"
              value={buscaJogo}
              onChangeText={setBuscaJogo}
              style={styles.inputBox}
            />


            <View style={styles.listaJogos}>

              {jogosFiltrados.map((jogo) => {

                const selecionado = participante.jogos.includes(jogo)

                return (
                  <Pressable
                    key={jogo}
                    style={[
                      styles.jogoOpcao,
                      selecionado && styles.jogoSelecionado
                    ]}
                    onPress={() => alternarJogo(jogo)}
                  >
                    <Text
                      style={[
                        styles.textoJogo,
                        selecionado && styles.textoJogoSelecionado
                      ]}
                    >
                      {selecionado ? '✓ ' : '+ '}
                      {jogo}
                    </Text>
                  </Pressable>
                )

              })}

            </View>


            {buscaJogo.trim() !== '' && !jogoJaExiste && (

              <Pressable
                style={styles.botaoAdicionarJogo}
                onPress={adicionarNovoJogo}
              >
                <Text style={styles.textoAdicionarJogo}>
                  + Adicionar "{buscaJogo.trim()}" ao catálogo
                </Text>
              </Pressable>

            )}


            <Text style={styles.jogosSelecionados}>
              Selecionados: {participante.jogos.length > 0
                ? participante.jogos.join(', ')
                : 'Nenhum jogo'}
            </Text>


            {erros.jogos !== '' && (
              <Text style={styles.textoErro}>{erros.jogos}</Text>
            )}

          </View>


          {/* YES / NO QUESTIONS */}

          <CampoSimNao
            titulo="Já conhece sobre o mercado de games?"
            valor={participante.mercadoGames}
            erro={erros.mercadoGames}
            aoSelecionar={(valor) => alterarCampo('mercadoGames', valor)}
          />


          <CampoSimNao
            titulo="Tem interesse pelo mercado profissional de games?"
            valor={participante.interesseProfissionalGames}
            erro={erros.interesseProfissionalGames}
            aoSelecionar={(valor) => alterarCampo('interesseProfissionalGames', valor)}
          />


          {/* REGISTER BUTTON */}

          <Pressable
            style={styles.botao}
            onPress={validarCadastro}
          >
            <Text style={styles.textoBotao}>
              Cadastrar
            </Text>
          </Pressable>


        </View>

      </ScrollView>


      {/* IOS DATE PICKER MODAL */}

      <Modal
        visible={seletorDataVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setSeletorDataVisivel(false)}
      >

        <View style={styles.fundoModal}>

          <View style={styles.caixaModal}>

            <View style={styles.cabecalhoModal}>

              <Pressable
                onPress={() => setSeletorDataVisivel(false)}
              >
                <Text style={styles.acaoModal}>Cancelar</Text>
              </Pressable>

              <Text style={styles.tituloModal}>
                Data de nascimento
              </Text>

              <Pressable
                onPress={() => {
                  alterarCampo('dataNascimento', dataParaISO(dataTemporaria))
                  setSeletorDataVisivel(false)
                }}
              >
                <Text style={styles.acaoModal}>Confirmar</Text>
              </Pressable>

            </View>


            {DateTimePicker && (
              <DateTimePicker
                value={dataTemporaria}
                mode="date"
                display="spinner"
                locale="pt-BR"
                maximumDate={new Date()}

                themeVariant="light"
                textColor="#222222"
                
                onChange={(_evento: any, dataSelecionada?: Date) => {
                  if (dataSelecionada) {
                    setDataTemporaria(dataSelecionada)
                  }
                }}
              />
            )}

          </View>

        </View>

      </Modal>

    </>
  )

}


const styles = StyleSheet.create({

  conteudo: {
    flexGrow: 1,
  },

  cadastroParticipante: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  campo: {
    width: '100%',
    marginBottom: 10,
  },

  textDesing: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 12,
    textAlign: 'left',
    width: '100%',
  },

  inputBox: {
    backgroundColor: '#d0d0d1b1',
    padding: 15,
    width: '100%',
    borderRadius: 10,
  },

  seletor: {
    backgroundColor: '#d0d0d1b1',
    padding: 15,
    width: '100%',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  textoSelecionado: {
    color: '#222',
    fontSize: 15,
  },

  placeholder: {
    color: '#777',
    fontSize: 15,
  },

  seta: {
    color: '#8000ff',
    fontSize: 14,
  },

  listaOpcoes: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  opcao: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  textoOpcao: {
    fontSize: 15,
    color: '#333',
  },

  opcoesSimNao: {
    flexDirection: 'row',
    gap: 12,
  },

  botaoOpcao: {
    flex: 1,
    backgroundColor: '#d0d0d1b1',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  botaoOpcaoSelecionado: {
    backgroundColor: '#8000ff',
  },

  textoBotaoOpcao: {
    color: '#333',
    fontWeight: 'bold',
  },

  textoBotaoOpcaoSelecionado: {
    color: '#fff',
  },

  listaJogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  jogoOpcao: {
    backgroundColor: '#e5e5e5',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 20,
  },

  jogoSelecionado: {
    backgroundColor: '#8000ff',
  },

  textoJogo: {
    color: '#333',
    fontSize: 13,
  },

  textoJogoSelecionado: {
    color: '#fff',
    fontWeight: 'bold',
  },

  botaoAdicionarJogo: {
    backgroundColor: '#eee5ff',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },

  textoAdicionarJogo: {
    color: '#6500cc',
    fontWeight: 'bold',
  },

  jogosSelecionados: {
    color: '#666',
    fontSize: 13,
    marginTop: 12,
  },

  textoErro: {
    color: '#ff002f',
    width: '100%',
    marginTop: 5,
  },

  botao: {
    backgroundColor: '#8000ff',
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
    width: '100%',
  },

  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  fundoModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  caixaModal: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  cabecalhoModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },

  tituloModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  acaoModal: {
    color: '#8000ff',
    fontWeight: 'bold',
    padding: 8,
  },

})
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

export default function novoparticipante() {
  const router = useRouter()

   const [participante, setParticipante] = useState(
  {
  nome: "",
  idade: "",
  genero: "",
  escolaridade: "",
  jogos: "",
  mercadoGames: "",
  interesseProfissionalGames: "",

 })

 const [erros, setErros] = useState({
   nome: "",
   idade: "",
   genero: "",
   escolaridade: "",
   jogos: "",
   mercadoGames: "",
   interesseProfissionalGames: "",
 })

 function alterarCampo(campo: string, valor: string){
    setParticipante({
      ...participante,
      [campo]: valor
    })

    setErros({
      ...erros,
      [campo]: ""
    })
 }
 function validarCadastro() {
    const novosErros = {
      nome: "",
      idade: "",
      genero: "",
      escolaridade: "",
      jogos: "",
      mercadoGames: "",
      interesseProfissionalGames: "",
    }

    if (participante.nome.trim() === "") {
      novosErros.nome = "Digite o nome do participante."
    } else if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(participante.nome.trim())) {
      novosErros.nome = "Digite um nome que seja válido."
    }

    if (participante.idade.trim() === "") {
      novosErros.idade = "Digite a idade."
    } else {
      const idade = Number(participante.idade)

      if (!Number.isInteger(idade) || idade < 1 || idade > 120) {
        novosErros.idade = "A idade deve estar entre os números 1 e 120."
      }
    }

    if (participante.genero.trim() === "") {
      novosErros.genero = "Preencha o gênero."
    }

    if (participante.escolaridade.trim() === "") {
      novosErros.escolaridade = "Preencha a escolaridade."
    }

    if (participante.jogos.trim() === "") {
      novosErros.jogos = "Informe pelo menos um jogo do seu interesse."
    }

    if (participante.mercadoGames.trim() === "") {
      novosErros.mercadoGames = "Responda se conhece o mercado de games."
    }

    if (participante.interesseProfissionalGames.trim() === "") {
      novosErros.interesseProfissionalGames =
        "Informe se tem interesse profissional em games."
    }

    setErros(novosErros)

      const temErro = Object.values(novosErros).some(
      (erro) => erro !== ""
    )

    if (!temErro) {
      router.push("/participantescadastrados")
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cadastroParticipante}>
        <Text style={styles.textDesing}>
           Nome do participante
        </Text>
         
        <TextInput 
      
        placeholder="Digite o nome" 
          value={participante.nome}
          onChangeText={(texto)=> alterarCampo("nome", texto)}
          style={styles.inputBox}
        />
        {erros.nome !== "" && <Text style={styles.textoErro}>{erros.nome}</Text>}
        <Text style={styles.textDesing}>Idade </Text>
        <TextInput placeholder="idade" 
          value={participante.idade}
          onChangeText={(texto) => alterarCampo("idade", texto)}
          style={styles.inputBox}
        />
        {erros.idade !== "" && <Text style={styles.textoErro}>{erros.idade}</Text>}
        <Text style={styles.textDesing}>Gênero </Text>
        <TextInput placeholder="Gênero" 
          value={participante.genero}
          onChangeText={(texto) => alterarCampo("genero", texto)}
          style={styles.inputBox}
        />
        {erros.genero !== "" && <Text style={styles.textoErro}>{erros.genero}</Text>}
        <Text style={styles.textDesing}>Escolaridade </Text>
        <TextInput placeholder="escolaridade" 
          value={participante.escolaridade}
          onChangeText={(texto) => alterarCampo("escolaridade", texto)}
          style={styles.inputBox}
        />
        {erros.escolaridade !== "" && <Text style={styles.textoErro}>{erros.escolaridade}</Text>}
        <Text style={styles.textDesing}>Quais jogos você tem mais interesse? </Text>
        <TextInput placeholder="jogos" 
          value={participante.jogos}
          onChangeText={(texto) => alterarCampo("jogos", texto)}
          style={styles.inputBox}
        />
        {erros.jogos !== "" && <Text style={styles.textoErro}>{erros.jogos}</Text>}
        <Text style={styles.textDesing}>Já conhece sobre o mercado de games? </Text>
        <TextInput placeholder="Opniao" 
          value={participante.mercadoGames}
          onChangeText={(texto) => alterarCampo("mercadoGames", texto)}
          style={styles.inputBox}
        />
        {erros.mercadoGames !== "" && <Text style={styles.textoErro}>{erros.mercadoGames}</Text>}
        <Text style={styles.textDesing}>Tem interesse pelo mercado profissional de games? </Text>
        <TextInput placeholder="Opniao" 
          value={participante.interesseProfissionalGames}
          onChangeText={(texto) => alterarCampo("interesseProfissionalGames", texto)}
          style={styles.inputBox}
        />
        {erros.interesseProfissionalGames !== "" && (
          <Text style={styles.textoErro}>{erros.interesseProfissionalGames}</Text>
        )}

        <Pressable
          style={styles.botao}
          onPress={validarCadastro}
        >
          <Text style={styles.textoBotao}>Cadastrar</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

  
const styles = StyleSheet.create({
  inputBox:{
    backgroundColor: "#d0d0d1b1",
    padding: 15,
    marginTop: 0,
    width:"80%",
    borderRadius: 10,
    flexDirection: "row"
  },
  textDesing:{
    fontSize:16,
    fontWeight:"bold",
    padding: 12,
    textAlign: "left",
    width: "85%"
  },

  cadastroParticipante:{
    alignItems: "center",
    paddingBottom: 24,
  },

  conteudo: {
    flexGrow: 1,
  },

  textoErro: {
    color: "#ff002f",
    width: "80%",
    marginTop: 4,
  },

botao: {
  backgroundColor: "#8000ff",
  padding: 15,
  marginTop: 20,
  borderRadius: 10,
},
textoBotao: {
  color: "#fff",
  fontWeight: "bold",
  textAlign: "center"

},

})

import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'


export default function novoparticipante() {
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

 function alterarCampo(campo: string, valor: string){
    setParticipante({
      ...participante,
      [campo]: valor
    })
 }
  return (
    <View>
      <View>
        <Text>Nome do participante </Text>
        <TextInput placeholder="Digite o nome" 
          value={participante.nome}
          onChangeText={(texto)=> alterarCampo("nome", texto)}
          style={styles.inputBox}
        />
        <Text>Idade </Text>
        <TextInput placeholder="idade" 
          value={participante.idade}
          onChangeText={(texto) => alterarCampo("idade", texto)}
          style={styles.inputBox}
        />
        <Text>Gênero </Text>
        <TextInput placeholder="Gênero" 
          value={participante.genero}
          onChangeText={(texto) => alterarCampo("genero", texto)}
          style={styles.inputBox}
        />
        <Text>Escolaridade </Text>
        <TextInput placeholder="escolaridade" 
          value={participante.escolaridade}
          onChangeText={(texto) => alterarCampo("escolaridade", texto)}
          style={styles.inputBox}
        />
        <Text>Quais jogos você tem mais interesse? </Text>
        <TextInput placeholder="jogos" 
          value={participante.jogos}
          onChangeText={(texto) => alterarCampo("jogos", texto)}
          style={styles.inputBox}
        />
        <Text>Já conhece sobre o mercado de games? </Text>
        <TextInput placeholder="Opniao" 
          value={participante.mercadoGames}
          onChangeText={(texto) => alterarCampo("mercadoGames", texto)}
          style={styles.inputBox}
        />
        <Text>Tem interesse pelo mercado profissional de games? </Text>
        <TextInput placeholder="Opniao" 
          value={participante.interesseProfissionalGames}
          onChangeText={(texto) => alterarCampo("interesseProfissionalGames", texto)}
          style={styles.inputBox}
        />
      </View>
      
    </View>
  )
}



  
const styles = StyleSheet.create({
  inputBox:{
    backgroundColor: "gray"
  }
})
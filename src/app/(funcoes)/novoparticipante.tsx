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
    <View style={styles.container}>
      <View style={styles.cadastroParticipante}>
        <Text style={styles.textDesing}>Nome do participante </Text>
        <TextInput placeholder="Digite o nome" 
          value={participante.nome}
          onChangeText={(texto)=> alterarCampo("nome", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Idade </Text>
        <TextInput placeholder="idade" 
          value={participante.idade}
          onChangeText={(texto) => alterarCampo("idade", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Gênero </Text>
        <TextInput placeholder="Gênero" 
          value={participante.genero}
          onChangeText={(texto) => alterarCampo("genero", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Escolaridade </Text>
        <TextInput placeholder="escolaridade" 
          value={participante.escolaridade}
          onChangeText={(texto) => alterarCampo("escolaridade", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Quais jogos você tem mais interesse? </Text>
        <TextInput placeholder="jogos" 
          value={participante.jogos}
          onChangeText={(texto) => alterarCampo("jogos", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Já conhece sobre o mercado de games? </Text>
        <TextInput placeholder="Opniao" 
          value={participante.mercadoGames}
          onChangeText={(texto) => alterarCampo("mercadoGames", texto)}
          style={styles.inputBox}
        />
        <Text style={styles.textDesing}>Tem interesse pelo mercado profissional de games? </Text>
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
    backgroundColor: "#d0d0d1b1",
    padding: 15,
    marginTop: 5,
    width:"50%",
    borderRadius: 10
  },
  textDesing:{
    fontSize:16,
    fontWeight:"bold",
    padding: 12
  },

  cadastroParticipante:{
  alignItems:"flex-start",
  justifyContent:"center"
},
  container:{
    


  }

})


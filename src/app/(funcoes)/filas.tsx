import { Image, StyleSheet, Text, View } from 'react-native';

export default function filas() {
  return (
    <View>
      <View style={styles.container}>
        <View style={styles.eventoCard}>
        <Text style={styles.text}>Arena Games</Text>
        <Text style={styles.text}>São Luís - MA</Text>
        <Text style={styles.text}>Ativo</Text>
      </View>
      <Text style={styles.senhaAtualText}> Senha Atual</Text>
      <View style={styles.senhaAtual}>
        <View style={styles.conteudoSenha}>
          <Image 
          style={styles.image}
          source={require('../../components/icons/controller.png')}
          resizeMode="contain"
          >
  
          </Image>

          <View>
            <Text style={styles.text}>A-001</Text>
            <Text style={styles.text}>Console</Text>
          </View>
        </View>
      </View>
      </View>
      

      <View style={styles.secaoNovoParticipante}>
        <Image source={require('../../components/icons/group.png')} style={styles.imageParticipante} ></Image>
        <Text style={styles.proximoParticipanteText}>Próximo participante</Text>



      </View>

             <View style={styles.listaParticipantes}>
            <Text> A-025 Maria</Text>
            <Text> A-026 Carlos </Text>
            <Text> A-027 José</Text>

      </View>

      <View style={button.campoButoes}>
        <Text style={button.button}> Próxima Senha</Text>
        <Text style={button.botaoAlternativo}> Encerrar Fila</Text>
      </View>


    </View>
  )
}

const styles = StyleSheet.create({

  container: {
    //flex: 2,
    alignItems: "center",
    justifyContent: "flex-start",

    },
    text:{
      fontSize: 14,
      fontWeight: "bold",
      color: "white",
      justifyContent: "center",
      alignItems: "center",
    },
    senhaAtualText:{
      fontSize: 20,
      paddingVertical: 10,
      fontWeight: "bold",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
    },
    senhaAtual:{
      backgroundColor: "#6e00fe",
      paddingVertical: 30,
      borderRadius: 20,
      //marginTop: 20,
      width: "70%",
      alignSelf: "center",
      alignItems: "center",
    },
    eventoCard:{
    backgroundColor: "#6e00fe",
    paddingVertical: 15,
    borderRadius: 20,
    marginTop: 20,
    width: "90%",
    alignSelf: "center",
    alignItems: "center",
  },
  image:{
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  conteudoSenha: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 40,
},
  secaoNovoParticipante:{
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 20,
    paddingTop: 50,
  },

  listaParticipantes:{

    borderWidth: 1,
    borderColor: "black",
    width: "90%",
    alignSelf: "center",
    borderLeftColor: "#f2f2f2",
    borderRightColor: "#f2f2f2",
    padding: 10,
    gap: 20,
   
  },
    imageParticipante:{
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  proximoParticipanteText:{
    fontSize: 20,
    fontWeight: "bold",
    
  }
})
const button = StyleSheet.create({
  button: {
    backgroundColor: "#6e00fe",
    width: "90%",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  botaoAlternativo: {
    borderWidth: 1,
    width: "90%",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",

  },
  campoButoes: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 40,
  }
});
  

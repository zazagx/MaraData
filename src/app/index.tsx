import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";


export default function Home() {
  return (

<>
    <View style={styles.container}>
      <View style={styles.eventoCard}>
        <Text style={styles.eventoCardText}>Nome do evento</Text>
        <Text style={styles.eventoCardText}>Local</Text>
        <Text style={styles.eventoCardText}>● Evento ativo</Text>
      </View>
    </View>
    
    <View style={styles.homePage}>
      <View style={styles.buttonCard} >

      {/* Primeiro botao de participantes */}
      <Pressable
      onPress={() => router.push("/novoparticipante")}
      style={button.button}
      >
        <Text style={button.buttonText}> 
          Participantes
        </Text>
      </Pressable>

      {/* Segundo botao de filas hehe */}
       <Pressable
      onPress={() => router.push("/filas")}
      style={button.button}
      >
        <Text style={button.buttonText}> 
          Filas
        </Text>
      </Pressable> 

      {/* Terceiro botao de Estatistica    */}
      <Pressable
      onPress={() => router.push("/estatistica")}
      style={button.button}
      >
        <Text style={button.buttonText}> 
          Estatisticas
        </Text>
      </Pressable> 

      <Pressable
      onPress={() => router.push("/eventos")}
      style={button.button}
      >
        <Text style={button.buttonText}> 
          Eventos
        </Text>
      </Pressable> 
      </View>
    </View>
</>


  );
}


const styles = StyleSheet.create({
  
  
  container: {
    flex: 2,
    alignItems: "center",
    justifyContent: "flex-start",

  },
  homePage: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    justifyContent: "center",
    alignItems: "center",
  },
  eventoCard:{
    backgroundColor: "#9e00fb",
    paddingVertical: 80,
    borderRadius: 20,
    marginTop: 20,
    width: "70%",
    alignSelf: "center",
    alignItems: "center",
  },
  eventoCardText:{
    color: "#e4e1e7",
    fontWeight: "bold"
  },
  buttonCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent:"center",
    gap: 50,
    marginBottom: 50,
  }
});

const button = StyleSheet.create({
  button: {
    backgroundColor: "#005bfb",
    width: "40%",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 5,

    alignItems: "center",
    textAlign: "center"
    
  },
  buttonText:{
    color: "white",
    fontSize: 16,
    fontWeight: "bold"
  }
});

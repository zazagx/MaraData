import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

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
        <Link href="/(funcoes)/novoparticipante" style={button.button}> Adicionar novo participante </Link>
        <Link href="/filas" style={button.button}> Filas</Link>
        <Link href="/estatistica" style={button.button}> Estatisticas</Link>
        <Link href="/(funcoes)/eventos" style={button.button}> Eventos </Link>
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
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center"
    
  },
});

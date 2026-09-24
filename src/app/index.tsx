import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    
    <View style={styles.container}>
      
    
      <Link href="/atalhos" style={button.button}>
        <Text style={button.buttonText}>Atalhos</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  homePage: {
    fontSize: 24,
    fontWeight: "bold",
    alignItems: "baseline",
    justifyContent: "center",
  },
});
const button = StyleSheet.create({
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

const cabecalho = StyleSheet.create({
  cabecalho: {
    backgroundColor: "#3f297d",
    padding: 20,
    
  },
});

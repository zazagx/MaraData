import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>

      <Text>
        Home Page
      </Text>
      <Link href="/about" style={button.button}>

          <Text style={button.buttonText}>
          About
          </Text>
      
      </Link>
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

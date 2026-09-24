import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function RootLayout() {

  return (
    // <SafeAreaView style={styles.container}>
    //   <View style={styles.header}>
    //     <Text style={styles.headerText}>MaraData</Text>
    //   </View>
       <Stack />
    //   <View style={styles.footer}>
    //     <Text style={styles.footerText}>Footer</Text>
    //   </View>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#3f297d",
    padding: 20,
  },
  headerText: {
    color: "#fff"}
    ,
    footer: {
      backgroundColor: "#3f297d",
    },
    footerText: {
      color: "white"
    }
  });

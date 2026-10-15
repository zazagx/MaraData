import { Drawer } from "expo-router/drawer";
import { StyleSheet } from "react-native";

export default function RootLayout() {

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8000ff",
        },
        headerTintColor: "#ffffff",
        
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Beast Maragames",
          drawerLabel: "Início",
         
        }}
      />

      <Drawer.Screen
        name="(funcoes)"
        options={{
          headerShown: false,
          drawerLabel: "Funcionalidades",
          title: "Funcionalidades",
        }}
        />
        <Drawer.Screen
        name ="about"
        options={{
          title: "Sobre",
          drawerLabel: "Sobre",
        }}
      />
    </Drawer>
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

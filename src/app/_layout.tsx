
import { Drawer } from "expo-router/drawer";
import { EventProvider } from "../context/eventocontexto";
import { Image, StyleSheet, Text, View } from 'react-native';
export default function RootLayout() {
  return (
    <EventProvider>
      <Drawer
        screenOptions={{
          headerStyle: {
            backgroundColor: "#8000ff",
          },
          headerTitleAlign: "center",
          headerTintColor: "#ffffff",
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: "HeaderTitle",
            drawerLabel: "Início",
            headerTitle: () => (
              <View style={styles.headerTitle}>
                <Image
                  source={require("../../assets/images/Logo-MaraGames.png")}
                  style={styles.headerLogo}
                  resizeMode="contain"
                />
                <Text style={styles.headerTitleText}>MaraData</Text>
              </View>
            ),
          }}
        />

        <Drawer.Screen
          name="(funcoes)"
          options={{
            headerShown: false,
            drawerItemStyle: {
              display: "none",
            },
          }}
        />

        <Drawer.Screen
          name="about"
          options={{
            title: "Sobre",
            drawerLabel: "Sobre",
          }}
        />
      </Drawer>
    </EventProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 50,
    height: 50,
  },
  headerTitleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
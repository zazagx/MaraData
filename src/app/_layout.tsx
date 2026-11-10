
import { Drawer } from "expo-router/drawer";
import { EventProvider } from "../context/eventocontexto";

export default function RootLayout() {
  return (
    <EventProvider>
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

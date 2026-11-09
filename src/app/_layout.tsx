import { Drawer } from "expo-router/drawer";

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

          // Hide this group from the Drawer menu.
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

  );
}
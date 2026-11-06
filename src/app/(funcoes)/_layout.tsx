import { Stack } from "expo-router";

export default function FuncoesLayout() {

  return (

    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8000ff",
        },

        headerTitleAlign: "center",
        headerTintColor: "#ffffff",
      }}
    >

      {/* PARTICIPANT SCREENS */}
      <Stack.Screen
        name="(participantes)"
        options={{
          headerShown: false,
        }}
      />

      {/* OTHER FUNCTIONALITIES */}

      <Stack.Screen
        name="filas"
        options={{
          headerShown: false,
        }}
      />  

      <Stack.Screen
        name="estatistica"
        options={{
          title: "Estatísticas",
        }}
      />

      <Stack.Screen
        name="eventos"
        options={{
          title: "Eventos",
        }}
      />

    </Stack>

  );

}
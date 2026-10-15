import { Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";

export default function FuncoesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8000ff",
        },
        headerTintColor: "#ffffff",

        // Botão para voltar à tela anterior.
        // Se não houver uma tela anterior, retorna à Home.
        headerLeft: () => (
          <Pressable
            onPress={() => router.replace("/")}
            style={{ marginLeft: 16 }}
          >
         
            <Text style={{ color: "#ffffff", fontSize: 28 }}>
              ‹
            </Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="novoparticipante"
        options={{
          title: "Cadastrar participante",
        }}
      />

      <Stack.Screen
        name="filas"
        options={{
          title: "Filas",
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
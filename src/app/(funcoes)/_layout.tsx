import { Stack, router } from "expo-router";
import { Image, Pressable } from "react-native";


export default function FuncoesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#8000ff",
          
        },
        headerTitleAlign: "center",
        headerTintColor: "#ffffff",
  


        // Botão para voltar à tela anterior.
        // Se não houver uma tela anterior, retorna à Home.
        headerLeft: () => (
          <Pressable
            onPress={() => router.replace("/")}
            style={{ marginLeft: 16 }}
          >

            <Image source={require("../../components/icons/arrow_left.png")} style={{ width: 24, height: 24 }} resizeMode="contain">
            </Image>

         
            {/* <Text style={{ color: "#ffffff", fontSize: 28 }}>
              ‹
            </Text> */}
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

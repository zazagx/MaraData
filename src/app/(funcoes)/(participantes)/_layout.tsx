import { Stack, router } from "expo-router";
import { Image, Pressable, Text } from "react-native";

export default function ParticipantesLayout() {

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

      {/* PARTICIPANTS LIST */}

      <Stack.Screen
        name="participantescadastrados"
        options={{
          title: "Participantes",

          // Custom back button: returns to Home.
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/")}
              style={{ marginLeft: 8 }}
            >
              <Image
                source={require("../../../components/icons/arrow_left.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
            </Pressable>
          ),

          // Button to register a new participant.
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/novoparticipante")}
              style={{
                backgroundColor: "#ffffff",
                width: 34,
                height: 34,
                borderRadius: 20,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: "#8000ff",
                  fontSize: 25,
                  lineHeight: 30,
                }}
              >
                +
              </Text>
            </Pressable>
          ),
        }}
      />

      {/* REGISTRATION FORM */}

      <Stack.Screen
        name="novoparticipante"
        options={{
          title: "Cadastrar participante",
        }}
      />

      {/* CONFIRMATION */}

      <Stack.Screen
        name="confirmacaoCadastroParticipante"
        options={{
          title: "Cadastro realizado",
        }}
      />

    </Stack>

  );
}
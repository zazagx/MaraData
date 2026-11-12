import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useTema } from '../../../context/temaContexto';

export default function ParticipantesLayout() {
  const { tema } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: tema.header,
        },
        headerTitleAlign: 'center',
        headerTintColor: tema.text,
        headerTitleStyle: {
          color: tema.text,
        },
        contentStyle: {
          backgroundColor: tema.background,
        },
      }}
    >
      <Stack.Screen
        name="participantescadastrados"
        options={{
          title: 'Participantes',
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace('/')}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Voltar para o início"
            >
              <Ionicons name="arrow-back" size={24} color={tema.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/novoparticipante')}
              style={{
                backgroundColor: tema.surfaceSecondary,
                width: 36,
                height: 36,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar participante"
            >
              <Text style={{ color: tema.primary, fontSize: 25, lineHeight: 30 }}>+</Text>
            </Pressable>
          ),
        }}
      />

      <Stack.Screen
        name="novoparticipante"
        options={{ title: 'Cadastrar participante' }}
      />

      <Stack.Screen
        name="confirmacaoCadastroParticipante"
        options={{ title: 'Cadastro realizado' }}
      />
    </Stack>
  );
}
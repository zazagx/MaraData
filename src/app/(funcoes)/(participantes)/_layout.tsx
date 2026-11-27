import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable } from 'react-native';
import { useTema } from '../../../context/temaContexto';
import BotaoTemaHeader from '../../../components/BotaoTemaHeader';

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
        headerRight: () => <BotaoTemaHeader />, 
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

      <Stack.Screen
        name="feedbacks"
        options={{ title: 'Feedbacks do evento' }}
      />

      <Stack.Screen
        name="feedback"
        options={{ title: 'Feedback do participante' }}
      />
    </Stack>
  );
}
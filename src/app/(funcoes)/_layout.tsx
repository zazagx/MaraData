import { Stack } from 'expo-router';
import { useTema } from '../../context/temaContexto';

export default function FuncoesLayout() {
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
        name="(participantes)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="eventos/detalhes"
        options={{ title: 'Detalhes do evento' }}
      />

      <Stack.Screen
        name="eventos/cadastro"
        options={{ title: 'Evento cadastrado' }}
      />

      <Stack.Screen
        name="filas"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="estatistica"
        options={{ title: 'Estatísticas' }}
      />

      <Stack.Screen
        name="eventos"
        options={{ title: 'Eventos' }}
      />

      <Stack.Screen
        name="eventos/historico/index"
        options={{ title: 'Histórico de Eventos' }}
      />
    </Stack>
  );
}
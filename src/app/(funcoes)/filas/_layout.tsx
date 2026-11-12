import { Stack } from 'expo-router';
import { useTema } from '../../../context/temaContexto';

export default function FilasLayout() {
  const { tema } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: tema.header,
        },
        headerTintColor: tema.text,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: tema.text,
        },
        contentStyle: {
          backgroundColor: tema.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Filas' }} />
      <Stack.Screen name="criarfilas" options={{ title: 'Criar fila' }} />
      <Stack.Screen name="gerenciarfilas" options={{ title: 'Gerenciar fila' }} />
    </Stack>
  );
}
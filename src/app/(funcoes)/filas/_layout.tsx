import { Stack } from 'expo-router'

export default function FilasLayout() {

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8000ff',
        },
        headerTintColor: '#ffffff',
        headerTitleAlign: 'center',
      }}
    >

      <Stack.Screen
        name="index"
        options={{ title: 'Filas' }}
      />

      <Stack.Screen
        name="criarfilas"
        options={{ title: 'Criar fila' }}
      />

      <Stack.Screen
        name="gerenciarfilas"
        options={{ title: 'Gerenciar fila' }}
      />

    </Stack>
  )
}
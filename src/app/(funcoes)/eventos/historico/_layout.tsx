import { Stack } from 'expo-router';

export default function HistoricoLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="agendados" />
      <Stack.Screen name="passados" />
    </Stack>
  );
}

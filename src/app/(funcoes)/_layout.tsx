import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable } from 'react-native';
import { useTema } from '../../context/temaContexto';

export default function FuncoesLayout() {
  const { tema } = useTema();
  const pathname = usePathname();
  const { origem } = useGlobalSearchParams<{ origem?: string }>();
  const estaEmListaDoHistorico =
    pathname.endsWith('/eventos/historico/passados') ||
    pathname.endsWith('/eventos/historico/agendados');

  // Retorno direto à Home quando a tela principal foi aberta por um atalho dela.
  // Subtelas (formulários, detalhes internos, feedback etc.) continuam com o back normal.
  const rotaPrincipalAbertaPelaHome = origem === 'home' && [
    '/eventos',
    '/eventos/detalhes',
    '/filas',
    '/participantescadastrados',
  ].includes(pathname);

  useEffect(() => {
    if (!rotaPrincipalAbertaPelaHome) return;

    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/');
      return true;
    });

    return () => assinatura.remove();
  }, [rotaPrincipalAbertaPelaHome]);

  const voltarDoHistorico = () => {
    if (estaEmListaDoHistorico && router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

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
        name="eventos/historico"
        options={{
          title: 'Histórico de Eventos',
          // Na página principal do Histórico, retorna à Home.
          // Nas listas de agendados/passados, retorna à página principal do Histórico.
          headerBackVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={voltarDoHistorico}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityRole="button"
              accessibilityLabel={estaEmListaDoHistorico ? 'Voltar ao Histórico de Eventos' : 'Voltar para o início'}
            >
              <Ionicons name="arrow-back" size={24} color={tema.text} />
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
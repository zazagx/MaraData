import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EventProvider, useEvento } from '../context/eventocontexto';
import { AutenticacaoProvider, useAutenticacao } from '../context/autenticacaoContexto';
import TelaLogin from '../components/TelaLogin';
import AberturaAnimada from '../components/AberturaAnimada';
import SincronizacaoAutomatica from '../components/SincronizacaoAutomatica';
import { TemaProvider, useTema } from '../context/temaContexto';
import { migrateDbIfNeeded } from '../database/migrations';

// Mantém a splash nativa visível até SQLite, autenticação e eventos estarem prontos.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Componente responsável pela navegação
function ConteudoLayout() {
  const { tema, modoEscuro, alternarTema } = useTema();
  const { sessao, carregandoAutenticacao, entrar } = useAutenticacao();
  const { carregandoEventos } = useEvento();

  const [splashNativaOculta, setSplashNativaOculta] = useState(false);
  const [aberturaConcluida, setAberturaConcluida] = useState(false);
  const carregandoInicial = carregandoAutenticacao || carregandoEventos;

  useEffect(() => {
    if (carregandoInicial || splashNativaOculta) return;

    let ativo = true;

    void SplashScreen.hideAsync()
      .catch((erro: unknown) => {
        console.warn('Não foi possível ocultar a splash nativa:', erro);
      })
      .finally(() => {
        if (ativo) setSplashNativaOculta(true);
      });

    return () => {
      ativo = false;
    };
  }, [carregandoInicial, splashNativaOculta]);

  const concluirAbertura = useCallback(() => {
    setAberturaConcluida(true);
  }, []);

  // A splash nativa permanece enquanto os dados iniciais são preparados.
  // Em seguida, a animação personalizada roda uma vez por abertura do app.
  if (carregandoInicial || !splashNativaOculta || !aberturaConcluida) {
    return (
      <View style={styles.telaAbertura}>
        <StatusBar style="dark" />
        {!carregandoInicial && (
          <AberturaAnimada
            iniciar={splashNativaOculta}
            onFinish={concluirAbertura}
          />
        )}
      </View>
    );
  }

  if (!sessao) {
    return <TelaLogin onEntrar={entrar} />;
  }

  return (
    <>
      <SincronizacaoAutomatica />
      <StatusBar style={modoEscuro ? 'light' : 'dark'} />

      <Drawer
        screenOptions={{
          headerLeft: () => (
            <Image
              source={require('../../assets/images/Logo-MaraGames.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          ),

          // Botão de alternância do tema
          headerRight: () => (
            <TouchableOpacity
              style={[
                styles.themeButton,
                { backgroundColor: tema.surfaceSecondary },
              ]}
              onPress={alternarTema}
              accessibilityRole="button"
              accessibilityLabel={
                modoEscuro
                  ? 'Ativar tema claro'
                  : 'Ativar tema escuro'
              }
            >
              <Ionicons
                name={modoEscuro ? 'sunny-outline' : 'moon-outline'}
                size={23}
                color={tema.primary}
              />
            </TouchableOpacity>
          ),

          // Cabeçalho
          headerStyle: {
            backgroundColor: tema.header,
          },

          headerTitleAlign: 'left',
          headerTintColor: tema.text,

          // Menu lateral
          drawerStyle: {
            backgroundColor: tema.drawer,
          },

          drawerContentStyle: {
            backgroundColor: tema.drawer,
          },

          drawerActiveTintColor: tema.primary,
          drawerInactiveTintColor: tema.textSecondary,
          drawerActiveBackgroundColor: tema.activeBackground,

          drawerLabelStyle: {
            fontSize: 15,
          },

          // Fundo da área das telas
          sceneStyle: {
            backgroundColor: tema.background,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'HeaderTitle',
            drawerLabel: 'Início',

            headerTitle: () => (
              <View style={styles.headerTitle}>
                <Text
                  style={[
                    styles.headerTitleText,
                    { color: tema.brand },
                  ]}
                >
                  MaraData
                </Text>
              </View>
            ),
          }}
        />

        <Drawer.Screen
          name="(funcoes)"
          options={{
            headerShown: false,
            drawerItemStyle: {
              display: 'none',
            },
          }}
        />
      </Drawer>
    </>
  );
}

// Layout principal: disponibiliza os contextos e inicializa o banco local.
export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="maradata.db"
      onInit={migrateDbIfNeeded}
    >
      <TemaProvider>
        <AutenticacaoProvider>
          <EventProvider>
            <ConteudoLayout />
          </EventProvider>
        </AutenticacaoProvider>
      </TemaProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  telaAbertura: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  headerLogo: {
    width: 42,
    height: 42,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { EventProvider } from "../context/eventocontexto";
import { AutenticacaoProvider, useAutenticacao } from "../context/autenticacaoContexto";
import TelaLogin from "../components/TelaLogin";
import SincronizacaoAutomatica from "../components/SincronizacaoAutomatica";
import { TemaProvider, useTema } from "../context/temaContexto";
import { migrateDbIfNeeded } from "../database/migrations";

// Componente responsável pela navegação
function ConteudoLayout() {
  const { tema, modoEscuro, alternarTema } = useTema();
  const { sessao, carregandoAutenticacao, entrar } = useAutenticacao();

  if (carregandoAutenticacao) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tema.background }}>
        <ActivityIndicator size="large" color={tema.primary} />
        <Text style={{ color: tema.textSecondary, marginTop: 12 }}>Verificando acesso...</Text>
      </View>
    );
  }

  if (!sessao) {
    return <TelaLogin onEntrar={entrar} />;
  }

  return (
    <>
      <SincronizacaoAutomatica />
      <StatusBar style={modoEscuro ? "light" : "dark"} />

      <Drawer
        screenOptions={{
          headerLeft: () => (
            <Image
              source={require("../../assets/images/Logo-MaraGames.png")}
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
                  ? "Ativar tema claro"
                  : "Ativar tema escuro"
              }
            >
              <Ionicons
                name={
                  modoEscuro ? "sunny-outline" : "moon-outline"
                }
                size={23}
                color={tema.primary}
              />
            </TouchableOpacity>
          ),

          // Cabeçalho
          headerStyle: {
            backgroundColor: tema.header,
          },

          headerTitleAlign: "left",
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
            title: "HeaderTitle",
            drawerLabel: "Início",

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
              display: "none",
            },
          }}
        />

      </Drawer>
    </>
  );
}

// Layout principal: disponibiliza os dois contextos
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
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },

  headerLogo: {
    width: 42,
    height: 42,
  },

  headerTitleText: {
    fontSize: 18,
    fontWeight: "bold",
  },

  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
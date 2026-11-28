import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import * as SQLite from 'expo-sqlite';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
import { inicializarBancoCriptografado } from '../database/bancoSeguro';
import { prepararArmazenamentoSeguroInicial } from '../services/preparacaoSegura';

// Mantém a splash nativa visível até SQLite, autenticação e eventos estarem prontos.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Componente responsável pela navegação
function ConteudoLayout() {
  const { tema, modoEscuro, alternarTema } = useTema();
  const { sessao, acessoOfflineAutorizado, carregandoAutenticacao, entrar, sair } = useAutenticacao();
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

  if (!sessao && !acessoOfflineAutorizado) {
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

          // Ações do cabeçalho: tema e encerramento explícito do acesso local.
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  { backgroundColor: tema.surfaceSecondary },
                ]}
                onPress={alternarTema}
                accessibilityRole="button"
                accessibilityLabel={modoEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
              >
                <Ionicons
                  name={modoEscuro ? 'sunny-outline' : 'moon-outline'}
                  size={23}
                  color={tema.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.logoutButton,
                  { backgroundColor: tema.surfaceSecondary },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Encerrar acesso neste dispositivo?',
                    'A próxima utilização exigirá um novo login com internet. Os registros locais criptografados serão preservados.',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Encerrar acesso',
                        style: 'destructive',
                        onPress: () => {
                          void sair().catch((erro: unknown) => {
                            Alert.alert('Não foi possível encerrar o acesso', String(erro));
                          });
                        },
                      },
                    ]
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Encerrar acesso neste dispositivo"
              >
                <Ionicons name="log-out-outline" size={22} color={tema.textSecondary} />
              </TouchableOpacity>
            </View>
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

// A versão web não possui SQLCipher no expo-sqlite. Como este produto é interno
// e móvel, ela fica bloqueada para não armazenar dados pessoais em SQLite sem cifra.
function AvisoPlataformaNaoSuportada() {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <View style={styles.erroInicializacao}>
      <Text style={styles.erroTitulo}>MaraData disponível somente no aplicativo</Text>
      <Text style={styles.erroTexto}>
        Para proteger os dados, utilize a versão Android ou iOS com banco criptografado.
      </Text>
    </View>
  );
}

function PreparacaoInicial({ onPronto, onErro }: { onPronto: () => void; onErro: (mensagem: string) => void }) {
  useEffect(() => {
    let ativo = true;
    async function preparar() {
      try {
        await prepararArmazenamentoSeguroInicial();
        if (ativo) onPronto();
      } catch (erro) {
        if (ativo) onErro(
          `Não foi possível remover com segurança os dados de teste antigos. O banco novo não será aberto. Detalhe: ${String(erro)}`
        );
      }
    }
    void preparar();
    return () => { ativo = false; };
  }, [onPronto, onErro]);

  return (
    <View style={styles.telaAbertura}>
      <ActivityIndicator size="large" color="#8000FF" />
      <Text style={styles.textoPreparacao}>Preparando armazenamento seguro...</Text>
    </View>
  );
}

function ErroPreparacao({ mensagem, tentarNovamente }: { mensagem: string; tentarNovamente: () => void }) {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <View style={styles.erroInicializacao}>
      <Text style={styles.erroTitulo}>Não foi possível proteger o banco</Text>
      <Text style={styles.erroTexto}>{mensagem}</Text>
      <TouchableOpacity style={styles.botaoTentarNovamente} onPress={tentarNovamente}>
        <Text style={styles.botaoTentarNovamenteTexto}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

// Layout principal: limpa a base de teste anterior e só então abre o novo banco SQLCipher.
export default function RootLayout() {
  const [preparacaoConcluida, setPreparacaoConcluida] = useState(false);
  const [erroPreparacao, setErroPreparacao] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const marcarPronto = useCallback(() => {
    setErroPreparacao(null);
    setPreparacaoConcluida(true);
  }, []);
  const marcarErro = useCallback((mensagem: string) => {
    setErroPreparacao(mensagem);
  }, []);

  if (Platform.OS === 'web') return <AvisoPlataformaNaoSuportada />;
  if (erroPreparacao) {
    return <ErroPreparacao mensagem={erroPreparacao} tentarNovamente={() => { setErroPreparacao(null); setPreparacaoConcluida(false); setTentativa((valor) => valor + 1); }} />;
  }
  if (!preparacaoConcluida) {
    return <PreparacaoInicial key={tentativa} onPronto={marcarPronto} onErro={marcarErro} />;
  }

  return (
    <SQLiteProvider
      databaseName="maradata-seguro.db"
      onInit={inicializarBancoCriptografado}
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  textoPreparacao: {
    marginTop: 14,
    color: '#333333',
    fontSize: 14,
  },
  erroInicializacao: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  erroTitulo: {
    color: '#8A174C',
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  erroTexto: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  botaoTentarNovamente: {
    marginTop: 22,
    backgroundColor: '#8000FF',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  botaoTentarNovamenteTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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

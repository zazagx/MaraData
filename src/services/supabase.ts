import { AppState, Platform } from 'react-native';
import { armazenamentoSeguroSupabase } from './armazenamentoSeguro';
import { obterChaveArmazenamentoSupabase } from './chavesArmazenamento';
import * as Network from 'expo-network';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase do MaraData.
 * No aplicativo nativo, a sessão fica no Android Keystore / iOS Keychain.
 * A renovação automática é pausada quando o sistema informa que não há internet,
 * evitando que uma tentativa de refresh durante o uso offline interfira no acesso local.
 */
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          storageKey: obterChaveArmazenamentoSupabase(supabaseUrl),
          ...(Platform.OS !== 'web' ? { storage: armazenamentoSeguroSupabase } : {}),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function supabaseEstaConfigurado(): boolean {
  return supabase !== null;
}

// Mantém o ciclo de renovação de tokens alinhado ao estado real da conexão.
if (supabase && Platform.OS !== 'web') {
  let aplicativoAtivo = AppState.currentState === 'active';
  let internetDisponivel = false;

  const atualizarRenovacao = () => {
    if (aplicativoAtivo && internetDisponivel) {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  const atualizarEstadoRede = (estado: Network.NetworkState) => {
    // isInternetReachable pode ser null enquanto o sistema ainda verifica a rede.
    // Com uma conexão ativa e sem indicação negativa, permitimos a renovação.
    internetDisponivel = estado.isConnected === true && estado.isInternetReachable !== false;
    atualizarRenovacao();
  };

  void Network.getNetworkStateAsync()
    .then(atualizarEstadoRede)
    .catch((erro: unknown) => {
      console.warn('Não foi possível verificar a conexão antes de renovar a sessão:', erro);
      internetDisponivel = false;
      atualizarRenovacao();
    });

  const assinaturaRede = Network.addNetworkStateListener(atualizarEstadoRede);
  const assinaturaApp = AppState.addEventListener('change', (estado) => {
    aplicativoAtivo = estado === 'active';
    if (!aplicativoAtivo) {
      atualizarRenovacao();
      return;
    }

    void Network.getNetworkStateAsync()
      .then(atualizarEstadoRede)
      .catch((erro: unknown) => {
        console.warn('Não foi possível verificar a conexão ao retomar o app:', erro);
        internetDisponivel = false;
        atualizarRenovacao();
      });
  });

  // O módulo vive durante toda a execução do app. As assinaturas são mantidas
  // intencionalmente para controlar o único cliente Supabase compartilhado.
  void assinaturaRede;
  void assinaturaApp;
}

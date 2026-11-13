import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase do MaraData.
 * No aplicativo nativo, a sessão fica salva no AsyncStorage para que a equipe
 * não precise autenticar novamente a cada abertura. A chave usada aqui é
 * exclusivamente a Publishable Key; nunca coloque uma Secret/service_role.
 */
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function supabaseEstaConfigurado(): boolean {
  return supabase !== null;
}

// Mantém a renovação do token ativa apenas enquanto o app está em primeiro plano.
// A documentação do Supabase recomenda registrar este listener uma única vez.
if (supabase && Platform.OS !== 'web') {
  if (AppState.currentState === 'active') {
    supabase.auth.startAutoRefresh();
  }
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

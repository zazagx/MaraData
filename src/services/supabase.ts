import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * O cliente é opcional durante o desenvolvimento local. Não coloque aqui
 * service_role, secret key ou qualquer credencial privilegiada.
 *
 * Este cliente ainda não realiza sincronização direta das tabelas. O acesso
 * remoto será feito por uma camada controlada, sem expor dados pessoais pela
 * role anon.
 */
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;

export function supabaseEstaConfigurado(): boolean {
  return supabase !== null;
}

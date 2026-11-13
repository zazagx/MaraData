import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type AutenticacaoContextoTipo = {
  sessao: Session | null;
  carregandoAutenticacao: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AutenticacaoContexto = createContext<AutenticacaoContextoTipo | undefined>(undefined);

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCarregandoAutenticacao(false);
      return;
    }

    let ativo = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (!ativo) return;
      setSessao(novaSessao);
      setCarregandoAutenticacao(false);
    });

    // Recupera a sessão persistida no dispositivo.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) console.warn('Não foi possível recuperar a sessão Supabase:', error.message);
      setSessao(data.session);
      setCarregandoAutenticacao(false);
    }).catch((erro: unknown) => {
      if (!ativo) return;
      console.warn('Falha ao carregar a sessão Supabase:', erro);
      setCarregandoAutenticacao(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function entrar(email: string, senha: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase não está configurado. Confira as variáveis EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) throw error;
  }

  async function sair(): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AutenticacaoContexto.Provider value={{
      sessao,
      carregandoAutenticacao,
      entrar,
      sair,
    }}>
      {children}
    </AutenticacaoContexto.Provider>
  );
}

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContexto);
  if (!contexto) {
    throw new Error('useAutenticacao deve ser utilizado dentro de AutenticacaoProvider.');
  }
  return contexto;
}

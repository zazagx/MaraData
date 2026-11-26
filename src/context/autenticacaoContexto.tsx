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

// A sessão é recuperada do armazenamento local. Se a leitura não responder,
// liberamos a abertura mostrando o login, sem bloquear o aplicativo indefinidamente.
const TEMPO_MAX_RECUPERACAO_SESSAO_MS = 10_000;

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCarregandoAutenticacao(false);
      return;
    }

    let ativo = true;
    let carregamentoConcluido = false;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const liberarAbertura = () => {
      if (!ativo || carregamentoConcluido) return;
      carregamentoConcluido = true;
      if (temporizador) clearTimeout(temporizador);
      setCarregandoAutenticacao(false);
    };

    temporizador = setTimeout(() => {
      if (!ativo || carregamentoConcluido) return;
      console.warn(
        'A recuperação da sessão Supabase excedeu o tempo limite. O aplicativo continuará para a tela de login; uma resposta posterior ainda poderá atualizar a sessão.',
      );
      liberarAbertura();
    }, TEMPO_MAX_RECUPERACAO_SESSAO_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (!ativo) return;
      setSessao(novaSessao);
      liberarAbertura();
    });

    // Recupera a sessão persistida no dispositivo. A leitura não depende de
    // uma sincronização remota para liberar a interface.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!ativo) return;
      if (error) console.warn('Não foi possível recuperar a sessão Supabase:', error.message);
      setSessao(data.session);
      liberarAbertura();
    }).catch((erro: unknown) => {
      if (!ativo) return;
      console.warn('Falha ao carregar a sessão Supabase:', erro);
      liberarAbertura();
    });

    return () => {
      ativo = false;
      if (temporizador) clearTimeout(temporizador);
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

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

type AutenticacaoContextoTipo = {
  sessao: Session | null;
  /** Permite abrir o app localmente depois de um login bem-sucedido, mesmo sem rede. */
  acessoOfflineAutorizado: boolean;
  carregandoAutenticacao: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
};

const AutenticacaoContexto = createContext<AutenticacaoContextoTipo | undefined>(undefined);
const CHAVE_ACESSO_OFFLINE = '@maradata:acesso_offline_autorizado';
const TEMPO_MAX_RECUPERACAO_SESSAO_MS = 10_000;

export function AutenticacaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [acessoOfflineAutorizado, setAcessoOfflineAutorizado] = useState(false);
  const [carregandoAutenticacao, setCarregandoAutenticacao] = useState(true);

  useEffect(() => {
    let ativo = true;

    // Mesmo que a configuração remota esteja temporariamente ausente, uma
    // autorização local já registrada continua permitindo consultar o SQLite.
    if (!supabase) {
      void AsyncStorage.getItem(CHAVE_ACESSO_OFFLINE)
        .then((idUsuario) => {
          if (ativo && idUsuario) setAcessoOfflineAutorizado(true);
        })
        .catch((erro: unknown) => {
          console.warn('Não foi possível recuperar a autorização offline:', erro);
        })
        .finally(() => {
          if (ativo) setCarregandoAutenticacao(false);
        });

      return () => {
        ativo = false;
      };
    }

    let armazenamentoCarregado = false;
    let supabaseCarregado = false;
    let aberturaLiberada = false;
    let acessoLocalEncontrado = false;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const liberarAberturaQuandoPronto = () => {
      if (!ativo || aberturaLiberada || !armazenamentoCarregado || (!acessoLocalEncontrado && !supabaseCarregado)) return;
      aberturaLiberada = true;
      if (temporizador) clearTimeout(temporizador);
      setCarregandoAutenticacao(false);
    };

    const salvarAcessoLocal = (idUsuario: string) => {
      setAcessoOfflineAutorizado(true);
      void AsyncStorage.setItem(CHAVE_ACESSO_OFFLINE, idUsuario).catch((erro) => {
        console.warn('Não foi possível salvar a autorização offline do MaraData:', erro);
      });
    };

    // Recupera primeiro a autorização local. Ela não depende da rede nem da
    // renovação do token e só é criada depois de um login válido.
    void AsyncStorage.getItem(CHAVE_ACESSO_OFFLINE)
      .then((idUsuario) => {
        if (!ativo) return;
        if (idUsuario) {
          acessoLocalEncontrado = true;
          setAcessoOfflineAutorizado(true);
        }
      })
      .catch((erro: unknown) => {
        console.warn('Não foi possível recuperar a autorização offline:', erro);
      })
      .finally(() => {
        armazenamentoCarregado = true;
        liberarAberturaQuandoPronto();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (!ativo) return;
      setSessao(novaSessao);
      if (novaSessao) {
        acessoLocalEncontrado = true;
        salvarAcessoLocal(novaSessao.user.id);
      }
      supabaseCarregado = true;
      liberarAberturaQuandoPronto();
    });

    // getSession recupera a sessão persistida. A tela também pode abrir com a
    // autorização offline se o SDK não conseguir renovar o token sem internet.
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          console.warn('Não foi possível recuperar a sessão Supabase:', error.message);
        }
        if (data.session) {
          acessoLocalEncontrado = true;
          setSessao(data.session);
          salvarAcessoLocal(data.session.user.id);
        }
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        console.warn('Falha ao carregar a sessão Supabase:', erro);
      })
      .finally(() => {
        supabaseCarregado = true;
        liberarAberturaQuandoPronto();
      });

    // Limite de segurança para falhas do armazenamento ou da inicialização do SDK.
    temporizador = setTimeout(() => {
      if (!ativo || aberturaLiberada) return;
      console.warn('A recuperação da autenticação excedeu o tempo limite. O MaraData continuará com o estado local disponível.');
      armazenamentoCarregado = true;
      supabaseCarregado = true;
      liberarAberturaQuandoPronto();
    }, TEMPO_MAX_RECUPERACAO_SESSAO_MS);

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (error) throw error;

    if (data.session) {
      setSessao(data.session);
      setAcessoOfflineAutorizado(true);
      try {
        await AsyncStorage.setItem(CHAVE_ACESSO_OFFLINE, data.session.user.id);
      } catch (erro) {
        // A falha ao gravar o marcador não desfaz um login remoto bem-sucedido.
        console.warn('Não foi possível persistir a autorização offline:', erro);
      }
    }
  }

  async function sair(): Promise<void> {
    // O logout local deve funcionar mesmo sem rede ou com token expirado.
    setAcessoOfflineAutorizado(false);
    setSessao(null);
    await AsyncStorage.removeItem(CHAVE_ACESSO_OFFLINE);
    if (!supabase) return;

    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  }

  return (
    <AutenticacaoContexto.Provider value={{
      sessao,
      acessoOfflineAutorizado,
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

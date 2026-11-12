import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipos de tema disponíveis
export type TemaNome = "claro" | "escuro";

// Estrutura das cores utilizadas pelo aplicativo
export type CoresTema = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  brand: string;
  header: string;
  drawer: string;
  activeBackground: string;
};

// Paleta de cores dos dois temas
const temas: Record<TemaNome, CoresTema> = {
  claro: {
    background: "#F7F5FA",
    surface: "#FFFFFF",
    surfaceSecondary: "#F0ECF5",
    text: "#241B2F",
    textSecondary: "#716879",
    border: "#E7E0ED",
    primary: "#6A0DAD",
    primaryText: "#FFFFFF",
    brand: "#EE0B2A",
    header: "#FEFEFF",
    drawer: "#FFFFFF",
    activeBackground: "#F1E5FA",
  },

  escuro: {
    background: "#15101B",
    surface: "#21192B",
    surfaceSecondary: "#2B2137",
    text: "#F5F0FA",
    textSecondary: "#B9ADC5",
    border: "#3B2D49",
    primary: "#B77AE6",
    primaryText: "#1B1024",
    brand: "#FF6477",
    header: "#1C1524",
    drawer: "#1C1524",
    activeBackground: "#39264A",
  },
};

// Informações disponibilizadas pelo contexto
type TemaContextoType = {
  tema: CoresTema;
  temaAtual: TemaNome;
  modoEscuro: boolean;
  carregandoTema: boolean;
  alternarTema: () => void;
};

const TemaContexto = createContext<TemaContextoType | undefined>(
  undefined
);

type TemaProviderProps = {
  children: ReactNode;
};

const CHAVE_TEMA = "@maradata:tema";

// Provider responsável por controlar o tema global
export function TemaProvider({ children }: TemaProviderProps) {
  const [temaAtual, setTemaAtual] = useState<TemaNome>("claro");
  const [carregandoTema, setCarregandoTema] = useState(true);

  // Recupera a preferência salva quando o aplicativo inicia
  useEffect(() => {
    async function carregarTema() {
      try {
        const temaSalvo = await AsyncStorage.getItem(CHAVE_TEMA);

        if (temaSalvo === "claro" || temaSalvo === "escuro") {
          setTemaAtual(temaSalvo);
        }
      } catch (erro) {
        console.warn("Não foi possível carregar o tema:", erro);
      } finally {
        setCarregandoTema(false);
      }
    }

    carregarTema();
  }, []);

  // Alterna entre os temas e salva a escolha
  function alternarTema() {
    const novoTema: TemaNome =
      temaAtual === "claro" ? "escuro" : "claro";

    setTemaAtual(novoTema);

    AsyncStorage.setItem(CHAVE_TEMA, novoTema).catch((erro) => {
      console.warn("Não foi possível salvar o tema:", erro);
    });
  }

  return (
    <TemaContexto.Provider
      value={{
        tema: temas[temaAtual],
        temaAtual,
        modoEscuro: temaAtual === "escuro",
        carregandoTema,
        alternarTema,
      }}
    >
      {children}
    </TemaContexto.Provider>
  );
}

// Hook para acessar o tema em qualquer componente
export function useTema() {
  const contexto = useContext(TemaContexto);

  if (!contexto) {
    throw new Error(
      "useTema deve ser utilizado dentro de TemaProvider"
    );
  }

  return contexto;
}
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  atualizarSituacaoEventosPorHorario,
  buscarEventos,
  encerrarEvento as encerrarEventoNoBanco,
  salvarEvento,
  type DadosEvento,
  type Evento,
} from '../features/armazenamentoEvento';

export type { Evento } from '../features/armazenamentoEvento';

type EventContextType = {
  evento: Evento | null;
  eventos: Evento[];
  carregandoEventos: boolean;
  recarregarEventos: () => Promise<void>;
  adicionarEvento: (novoEvento: DadosEvento) => Promise<Evento>;
  encerrarEvento: (eventoId: string) => Promise<Evento>;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

type EventProviderProps = {
  children: ReactNode;
};

export function EventProvider({ children }: EventProviderProps) {
  const db = useSQLiteContext();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregandoEventos, setCarregandoEventos] = useState(true);

  // Evita duas verificações simultâneas do ciclo dos eventos.
  const atualizacaoEmAndamento = useRef<Promise<void> | null>(null);

  const recarregarEventos = useCallback(async () => {
    if (atualizacaoEmAndamento.current) {
      return atualizacaoEmAndamento.current;
    }

    const tarefa = (async () => {
      // Primeiro atualiza os estados automáticos no SQLite.
      await atualizarSituacaoEventosPorHorario(db);

      // Depois carrega os dados já atualizados.
      const lista = await buscarEventos(db);

      setEventos(lista);

      // O campo evento representa exclusivamente o evento em andamento.
      setEvento(
        lista.find((item) => item.situacao === 'em_andamento') ?? null
      );
    })();

    atualizacaoEmAndamento.current = tarefa;

    try {
      await tarefa;
    } finally {
      if (atualizacaoEmAndamento.current === tarefa) {
        atualizacaoEmAndamento.current = null;
      }
    }
  }, [db]);

  // Verificação inicial ao abrir o aplicativo.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        await recarregarEventos();
      } catch (erro) {
        console.error('Erro ao carregar eventos do SQLite:', erro);
      } finally {
        if (ativo) {
          setCarregandoEventos(false);
        }
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [recarregarEventos]);

  // Verifica periodicamente enquanto o aplicativo estiver aberto
  // e imediatamente quando voltar para primeiro plano.
  useEffect(() => {
    const verificarEventos = () => {
      void recarregarEventos().catch((erro) => {
        console.error('Erro na atualização automática dos eventos:', erro);
      });
    };

    const intervalo = setInterval(verificarEventos, 15_000);

    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        verificarEventos();
      }
    });

    return () => {
      clearInterval(intervalo);
      inscricao.remove();
    };
  }, [recarregarEventos]);

  const adicionarEvento = useCallback(async (novoEvento: DadosEvento) => {
    const salvo = await salvarEvento(db, novoEvento);

    setEventos((anteriores) => {
      const semAntigo = anteriores.filter((item) => item.id !== salvo.id);
      return [salvo, ...semAntigo];
    });

    if (salvo.situacao === 'em_andamento') {
      setEvento(salvo);
    } else {
      setEvento((atual) => (atual?.id === salvo.id ? null : atual));
    }

    return salvo;
  }, [db]);

  const encerrarEvento = useCallback(async (eventoId: string) => {
    const encerrado = await encerrarEventoNoBanco(db, eventoId);

    setEventos((anteriores) =>
      anteriores.map((item) =>
        item.id === eventoId ? encerrado : item
      )
    );

    setEvento((atual) =>
      atual?.id === eventoId ? null : atual
    );

    return encerrado;
  }, [db]);

  return (
    <EventContext.Provider
      value={{
        evento,
        eventos,
        carregandoEventos,
        recarregarEventos,
        adicionarEvento,
        encerrarEvento,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvento() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error('useEvento deve ser utilizado dentro de EventProvider');
  }

  return context;
}
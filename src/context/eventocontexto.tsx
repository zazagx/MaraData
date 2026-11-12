import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
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

  const recarregarEventos = useCallback(async () => {
    const lista = await buscarEventos(db);
    setEventos(lista);
    // O campo `evento` representa exclusivamente o evento em andamento.
    // Eventos agendados/passados são acessados pela lista `eventos`.
    setEvento(lista.find((item) => item.situacao === 'em_andamento') ?? null);
  }, [db]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const lista = await buscarEventos(db);
        if (!ativo) return;
        setEventos(lista);
        setEvento(lista.find((item) => item.situacao === 'em_andamento') ?? null);
      } catch (erro) {
        console.error('Erro ao carregar eventos do SQLite:', erro);
      } finally {
        if (ativo) setCarregandoEventos(false);
      }
    }

    void carregar();
    return () => {
      ativo = false;
    };
  }, [db]);

  const adicionarEvento = useCallback(async (novoEvento: DadosEvento) => {
    const salvo = await salvarEvento(db, novoEvento);
    setEventos((anteriores) => {
      const semAntigo = anteriores.filter((item) => item.id !== salvo.id);
      return [salvo, ...semAntigo];
    });
    if (salvo.situacao === 'em_andamento') setEvento(salvo);
    else setEvento((atual) => (atual?.id === salvo.id ? null : atual));
    return salvo;
  }, [db]);

  const encerrarEvento = useCallback(async (eventoId: string) => {
    const encerrado = await encerrarEventoNoBanco(db, eventoId);
    setEventos((anteriores) => anteriores.map((item) => item.id === eventoId ? encerrado : item));
    setEvento((atual) => atual?.id === eventoId ? null : atual);
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

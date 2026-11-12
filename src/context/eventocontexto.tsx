import { createContext, ReactNode, useContext, useState } from "react";

export type Evento = {
  id?: string;
  nomeEvento: string;
  localEvento: string;
  dataInicio: string;
  dataTermino: string;
  horarioInicio: string;
  horarioTermino: string;
  descricao: string;
  situacao: "agendado" | "em_andamento" | "encerrado";
};

type EventContextType = {
  evento: Evento | null;
  setEvento: (evento: Evento | null) => void;
  eventos: Evento[];
  adicionarEvento: (novoEvento: Evento) => void;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

type EventProviderProps = {
  children: ReactNode;
};

export function EventProvider({ children }: EventProviderProps) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);

  function adicionarEvento(novoEvento: Evento) {
    const eventoComId = novoEvento.id ? novoEvento : { ...novoEvento, id: Date.now().toString() };
    
    setEventos((prev) => {
      // Se já existe um evento com esse ID, atualiza ele na lista em vez de duplicar
      const existeIndex = prev.findIndex(item => item.id === eventoComId.id);
      if (existeIndex >= 0) {
        const novaLista = [...prev];
        novaLista[existeIndex] = eventoComId;
        return novaLista;
      }
      // Senão, adiciona no topo
      return [eventoComId, ...prev];
    });

    // SÓ define como evento ativo global se for 'em_andamento'
    if (eventoComId.situacao === 'em_andamento') {
      setEvento(eventoComId);
    } else if (evento?.id === eventoComId.id) {
      // Se o evento ativo atual deixou de ser em andamento, limpa o ativo da home
      setEvento(null);
    }
  }

  return (
    <EventContext.Provider value={{ evento, setEvento, eventos, adicionarEvento }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvento() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvento deve ser utilizado dentro de EventProvider");
  }
  return context;
}

import { createContext, ReactNode, useContext, useState } from "react";

// Dados do evento
export type Evento = {
  nomeEvento: string;
  localEvento: string;
  dataInicio: string;
  dataTermino: string;
  horarioInicio: string;
  horarioTermino: string;
  descricao: string;
  situacao: "agendado" | "em_andamento" | "encerrado";
};

// Tipagem do contexto
type EventContextType = {
  evento: Evento | null;
  setEvento: (evento: Evento | null) => void;
};

// Contexto do evento
const EventContext = createContext<EventContextType | undefined>(
  undefined
);

// Provedor do contexto
type EventProviderProps = {
  children: ReactNode;
};

export function EventProvider({ children }: EventProviderProps) {
  const [evento, setEvento] = useState<Evento | null>(null);

  return (
    <EventContext.Provider value={{ evento, setEvento }}>
      {children}
    </EventContext.Provider>
  );
}

// Acesso aos dados do evento
export function useEvento() {
  const context = useContext(EventContext);

  if (!context) {
    throw new Error("useEvento deve ser utilizado dentro de EventProvider");
  }

  return context;
}

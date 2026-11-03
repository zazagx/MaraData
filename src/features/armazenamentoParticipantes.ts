export interface Participante {
  nome: string;
  dataNascimento: string;
  genero: string;
  escolaridade: string;
  jogos: string[];
  mercadoGames: string;
  interesseProfissionalGames: string;
}

const participantes: Participante[] = [];

const jogosDisponiveis: string[] = [
  "Counter-Strike 2",
  "EA Sports FC",
  "Fortnite",
  "Free Fire",
  "GTA V",
  "League of Legends",
  "Minecraft",
  "Roblox",
  "Tekken",
  "Valorant",
];

export function salvarParticipante(participante: Participante) {
  participantes.push(participante);
}

export function buscarParticipantes() {
  return [...participantes];
}

export function buscarUltimoParticipante() {
  return participantes[participantes.length - 1];
}

export function buscarJogos() {
  return [...jogosDisponiveis].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export function adicionarJogo(nome: string) {
  const nomeLimpo = nome.trim();

  if (nomeLimpo === "") {
    return "";
  }

  const jogoExistente = jogosDisponiveis.find(
    (jogo) =>
      jogo.toLocaleLowerCase("pt-BR") ===
      nomeLimpo.toLocaleLowerCase("pt-BR")
  );

  if (jogoExistente) {
    return jogoExistente;
  }

  jogosDisponiveis.push(nomeLimpo);

  return nomeLimpo;
}
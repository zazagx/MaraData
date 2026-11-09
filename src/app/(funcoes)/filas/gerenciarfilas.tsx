import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ParticipanteFila = {
  id: number;
  senha: string;
  nome: string;
  atividade: string;
};

export default function GerenciarFila() {
  const params = useLocalSearchParams<{
    nomeEvento?: string;
    localEvento?: string;
    situacao?: string;
  }>();

  // Informações do evento
  const nomeEvento = params.nomeEvento || "Nome do evento";
  const localEvento = params.localEvento || "Local não informado";

  // Dados temporários da fila
  const [participantes] = useState<ParticipanteFila[]>([
    {
      id: 1,
      senha: "A-001",
      nome: "João Silva",
      atividade: "Console 1",
    },
    {
      id: 2,
      senha: "A-002",
      nome: "Maria Souza",
      atividade: "Console 1",
    },
    {
      id: 3,
      senha: "A-003",
      nome: "Carlos Oliveira",
      atividade: "Console 2",
    },
    {
      id: 4,
      senha: "A-004",
      nome: "Ana Santos",
      atividade: "Console 2",
    },
  ]);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [filaAtiva, setFilaAtiva] = useState(true);

  const senhaAtual = participantes[indiceAtual];
  const proximoParticipante = participantes[indiceAtual + 1];

  // Avançar para a próxima senha
  function chamarProximaSenha() {
    if (!filaAtiva) return;

    if (indiceAtual >= participantes.length - 1) {
      Alert.alert(
        "Fila vazia",
        "Não existem mais participantes aguardando."
      );
      return;
    }

    setIndiceAtual(indiceAtual + 1);
  }

  // Adicionar participante
  function adicionarParticipante() {
    Alert.alert(
      "Adicionar participante",
      "A seleção de participantes será implementada nesta etapa."
    );
  }

  // Encerrar fila
  function encerrarFila() {
    Alert.alert(
      "Encerrar fila",
      "Tem certeza de que deseja encerrar esta fila?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Encerrar",
          style: "destructive",
          onPress: () => setFilaAtiva(false),
        },
      ]
    );
  }

  function obterStatus(index: number) {
    if (!filaAtiva) return "Encerrada";
    if (index < indiceAtual) return "Atendido";
    if (index === indiceAtual) return "Atual";
    if (index === indiceAtual + 1) return "Próximo";
    return "Aguardando";
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      {/* Identificação do evento */}
      <View style={styles.banner}>
        <View style={styles.bannerTopo}>
          <View style={styles.bannerIcone}>
            <Ionicons
              name="game-controller"
              size={42}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.seloStatus}>
            <View
              style={[
                styles.statusPonto,
                !filaAtiva && styles.statusPontoInativo,
              ]}
            />
            <Text style={styles.seloStatusTexto}>
              {filaAtiva ? "Fila ativa" : "Fila encerrada"}
            </Text>
          </View>
        </View>

        <Text style={styles.nomeEvento}>{nomeEvento}</Text>

        <View style={styles.localBanner}>
          <Ionicons
            name="location-outline"
            size={17}
            color="#FFFFFF"
          />
          <Text style={styles.localBannerTexto}>{localEvento}</Text>
        </View>
      </View>

      {/* Senha atual e ação de adicionar */}
      <Text style={styles.tituloSecao}>Senha atual</Text>

      <View style={styles.cardSenha}>
        <View style={styles.conteudoSenha}>
          <View style={styles.dadosSenha}>
            <Text style={styles.numeroSenha}>
              {senhaAtual ? senhaAtual.senha : "---"}
            </Text>

            <Text style={styles.nomeAtendimento}>
              {senhaAtual ? senhaAtual.nome : "Nenhum atendimento"}
            </Text>

            <Text style={styles.tipoAtendimento}>
              {senhaAtual ? senhaAtual.atividade : "Fila vazia"}
            </Text>
          </View>

          <View style={styles.divisorSenha} />

          <View style={styles.iconeSenha}>
            <Ionicons
              name="game-controller"
              size={38}
              color="#8000FF"
            />
          </View>
        </View>

        <View style={styles.divisorCardSenha} />

        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={adicionarParticipante}
          disabled={!filaAtiva}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
          <Text style={styles.textoBotaoAdicionar}>
            Adicionar participante
          </Text>
        </TouchableOpacity>
      </View>

      {/* Próximo participante */}
      <View style={styles.cardProximo}>
        <View style={styles.iconeProximo}>
          <Ionicons name="people" size={30} color="#8000FF" />
        </View>

        <View style={styles.dadosProximo}>
          <Text style={styles.rotuloProximo}>
            Próximo participante
          </Text>

          <Text style={styles.nomeProximo}>
            {proximoParticipante
              ? `${proximoParticipante.senha} • ${proximoParticipante.nome}`
              : "Nenhum participante"}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={22}
          color="#8000FF"
        />
      </View>

      {/* Lista de participantes */}
      <View style={styles.tituloLista}>
        <Text style={styles.tituloSecao}>
          Participantes na fila
        </Text>

        <View style={styles.contador}>
          <Text style={styles.textoContador}>
            {Math.max(participantes.length - indiceAtual, 0)} na fila
          </Text>
        </View>
      </View>

      <View style={styles.cardLista}>
        {participantes.map((participante, index) => {
          const status = obterStatus(index);

          return (
            <View key={participante.id}>
              <View style={styles.itemParticipante}>
                <View style={styles.iconeParticipante}>
                  <Ionicons
                    name="person"
                    size={19}
                    color="#8000FF"
                  />
                </View>

                <View style={styles.dadosParticipante}>
                  <Text style={styles.senhaParticipante}>
                    {participante.senha}
                  </Text>

                  <Text style={styles.nomeParticipante}>
                    {participante.nome}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badgeStatus,
                    status === "Atual" && styles.badgeAtual,
                    status === "Próximo" && styles.badgeProximo,
                    status === "Atendido" && styles.badgeAtendido,
                    status === "Encerrada" && styles.badgeEncerrada,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoBadge,
                      status === "Atendido" && styles.textoAtendido,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              {index !== participantes.length - 1 && (
                <View style={styles.divisorLista} />
              )}
            </View>
          );
        })}
      </View>

      {/* Ações da fila */}
      <TouchableOpacity
        style={[
          styles.botaoProximaSenha,
          !filaAtiva && styles.botaoDesabilitado,
        ]}
        onPress={chamarProximaSenha}
        disabled={!filaAtiva}
        activeOpacity={0.8}
      >
        <Ionicons name="play" size={21} color="#FFFFFF" />
        <Text style={styles.textoBotaoPrincipal}>
          Próxima senha
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.botaoEncerrar,
          !filaAtiva && styles.botaoEncerrarDesabilitado,
        ]}
        onPress={encerrarFila}
        disabled={!filaAtiva}
        activeOpacity={0.8}
      >
        <Ionicons
          name="stop-circle-outline"
          size={21}
          color="#D92D45"
        />
        <Text style={styles.textoBotaoEncerrar}>
          Encerrar fila
        </Text>
      </TouchableOpacity>

      {/* Rodapé */}
      <View style={styles.rodape}>
        <Ionicons
          name="game-controller-outline"
          size={21}
          color="#8000FF"
        />
        <Text style={styles.textoRodape}>
          MaraData • Beast MaraGames
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },

  conteudo: {
    padding: 20,
    paddingBottom: 35,
  },

  // Banner do evento
  banner: {
    backgroundColor: "#8000FF",
    borderRadius: 22,
    padding: 22,
    marginBottom: 25,
  },

  bannerTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  bannerIcone: {
    backgroundColor: "#6500CC",
    padding: 10,
    borderRadius: 14,
  },

  seloStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 7,
  },

  statusPonto: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#28B463",
  },

  statusPontoInativo: {
    backgroundColor: "#D92D45",
  },

  seloStatusTexto: {
    color: "#6500CC",
    fontSize: 12,
    fontWeight: "bold",
  },

  nomeEvento: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  localBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  localBannerTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
  },

  // Títulos
  tituloSecao: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
  },

  // Senha atual
  cardSenha: {
    backgroundColor: "#8000FF",
    borderRadius: 18,
    padding: 7,
    marginBottom: 20,
  },

  conteudoSenha: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dadosSenha: {
    flex: 1,
    alignItems: "center",
  },

  numeroSenha: {
    color: "#222222",
    fontSize: 29,
    fontWeight: "bold",
  },

  nomeAtendimento: {
    color: "#444444",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },

  tipoAtendimento: {
    color: "#888888",
    fontSize: 12,
    marginTop: 3,
  },

  divisorSenha: {
    width: 1,
    height: 65,
    backgroundColor: "#E7E1F0",
    marginHorizontal: 15,
  },

  iconeSenha: {
    width: 65,
    alignItems: "center",
    justifyContent: "center",
  },

  divisorCardSenha: {
    height: 1,
    backgroundColor: "#A85AFF",
    marginHorizontal: 10,
  },

  botaoAdicionar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 9,
  },

  textoBotaoAdicionar: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Próximo participante
  cardProximo: {
    backgroundColor: "#F1E8FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconeProximo: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  dadosProximo: {
    flex: 1,
  },

  rotuloProximo: {
    color: "#777777",
    fontSize: 12,
    marginBottom: 4,
  },

  nomeProximo: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Lista de participantes
  tituloLista: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  contador: {
    backgroundColor: "#8000FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  textoContador: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  cardLista: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E7E1F0",
    marginBottom: 25,
  },

  itemParticipante: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 10,
  },

  iconeParticipante: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1E8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  dadosParticipante: {
    flex: 1,
  },

  senhaParticipante: {
    color: "#222222",
    fontSize: 13,
    fontWeight: "bold",
  },

  nomeParticipante: {
    color: "#777777",
    fontSize: 12,
    marginTop: 2,
  },

  divisorLista: {
    height: 1,
    backgroundColor: "#EEEEEE",
  },

  badgeStatus: {
    backgroundColor: "#EEEEEE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeAtual: {
    backgroundColor: "#8000FF",
  },

  badgeProximo: {
    backgroundColor: "#D8F5DF",
  },

  badgeAtendido: {
    backgroundColor: "#F1E8FF",
  },

  badgeEncerrada: {
    backgroundColor: "#FDE7EA",
  },

  textoBadge: {
    color: "#6500CC",
    fontSize: 10,
    fontWeight: "bold",
  },

  textoAtendido: {
    color: "#777777",
  },

  // Botões
  botaoProximaSenha: {
    backgroundColor: "#8000FF",
    borderRadius: 13,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  textoBotaoPrincipal: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  botaoDesabilitado: {
    backgroundColor: "#BCA0D9",
  },

  botaoEncerrar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F2B8C0",
  },

  textoBotaoEncerrar: {
    color: "#D92D45",
    fontSize: 15,
    fontWeight: "bold",
  },

  botaoEncerrarDesabilitado: {
    opacity: 0.5,
  },

  // Rodapé
  rodape: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 28,
  },

  textoRodape: {
    color: "#888888",
    fontSize: 12,
  },
});
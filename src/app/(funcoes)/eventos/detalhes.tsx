
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DetalhesEvento() {
  const params = useLocalSearchParams<{
    nomeEvento?: string;
    localEvento?: string;
    dataInicio?: string;
    dataTermino?: string;
    horarioInicio?: string;
    horarioTermino?: string;
    descricao?: string;
    situacao?: string;
  }>();

  const nomeEvento = params.nomeEvento || "Nome do evento";
  const localEvento = params.localEvento || "Local não informado";
  const dataInicio = params.dataInicio || "Não informada";
  const dataTermino = params.dataTermino || "Não informada";
  const horarioInicio = params.horarioInicio || "Não informado";
  const horarioTermino = params.horarioTermino || "Não informado";
  const descricao = params.descricao || "Nenhuma descrição cadastrada.";
  const situacao = params.situacao || "agendado";

  const situacaoFormatada =
    situacao === "em_andamento"
      ? "Em andamento"
      : situacao === "encerrado"
      ? "Encerrado"
      : "Agendado";

  function mostrarAviso(funcionalidade: string) {
    Alert.alert(
      funcionalidade,
      "Esta funcionalidade será implementada na próxima etapa."
    );
  }

  function acessarTela(tela: string) {
  if (tela === "participantes") {
    router.push("/participantescadastrados");
  } else if (tela === "filas") {
    router.push({
      pathname: "/filas",
      params: {
        nomeEvento,
        localEvento,
        situacao,
      },
    });
  } else if (tela === "estatisticas") {
    router.push("/estatistica");
  }
}

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      {/* Identificação do evento */}
      <View style={styles.banner}>
        <View style={styles.bannerIcone}>
          <Ionicons name="game-controller" size={48} color="#FFFFFF" />
        </View>

        <View style={styles.selo}>
          <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
          <Text style={styles.seloTexto}>EVENTO CADASTRADO</Text>
        </View>

        <Text style={styles.nomeEvento}>{nomeEvento}</Text>

        <View style={styles.localBanner}>
          <Ionicons name="location-outline" size={17} color="#FFFFFF" />
          <Text style={styles.localBannerTexto}>{localEvento}</Text>
        </View>

        <View style={styles.statusBanner}>
          <View style={styles.statusPonto} />
          <Text style={styles.statusBannerTexto}>{situacaoFormatada}</Text>
        </View>
      </View>

      {/* Informações */}
      <Text style={styles.tituloSecao}>Informações do evento</Text>

      <View style={styles.card}>
        <View style={styles.informacao}>
          <View style={styles.iconeInformacao}>
            <Ionicons name="location" size={22} color="#8000FF" />
          </View>

          <View style={styles.informacaoTexto}>
            <Text style={styles.rotulo}>Local</Text>
            <Text style={styles.valor}>{localEvento}</Text>
          </View>
        </View>

        <View style={styles.divisor} />

        <View style={styles.linhaDupla}>
          <View style={styles.informacaoMetade}>
            <View style={styles.iconeInformacao}>
              <Ionicons name="calendar" size={21} color="#8000FF" />
            </View>
            <Text style={styles.rotulo}>Data de início</Text>
            <Text style={styles.valor}>{dataInicio}</Text>
          </View>

          <View style={styles.informacaoMetade}>
            <View style={styles.iconeInformacao}>
              <Ionicons name="calendar-outline" size={21} color="#8000FF" />
            </View>
            <Text style={styles.rotulo}>Data de término</Text>
            <Text style={styles.valor}>{dataTermino}</Text>
          </View>
        </View>

        <View style={styles.divisor} />

        <View style={styles.linhaDupla}>
          <View style={styles.informacaoMetade}>
            <View style={styles.iconeInformacao}>
              <Ionicons name="time" size={21} color="#8000FF" />
            </View>
            <Text style={styles.rotulo}>Horário de início</Text>
            <Text style={styles.valor}>{horarioInicio}</Text>
          </View>

          <View style={styles.informacaoMetade}>
            <View style={styles.iconeInformacao}>
              <Ionicons name="time-outline" size={21} color="#8000FF" />
            </View>
            <Text style={styles.rotulo}>Horário de término</Text>
            <Text style={styles.valor}>{horarioTermino}</Text>
          </View>
        </View>

        <View style={styles.divisor} />

        <View style={styles.informacao}>
          <View style={styles.iconeInformacao}>
            <Ionicons name="document-text" size={22} color="#8000FF" />
          </View>

          <View style={styles.informacaoTexto}>
            <Text style={styles.rotulo}>Descrição</Text>
            <Text style={styles.valor}>{descricao}</Text>
          </View>
        </View>
      </View>

      {/* Gerenciamento */}
      <Text style={styles.tituloSecao}>Gerenciamento deste evento</Text>

      <Text style={styles.subtitulo}>
        Acesse as funcionalidades para administrar o evento cadastrado.
      </Text>

      <View style={styles.grade}>
        <TouchableOpacity
          style={styles.botaoFuncao}
          onPress={() => acessarTela("participantes")}
        >
          <Ionicons name="people" size={30} color="#8000FF" />
          <Text style={styles.nomeFuncao}>Participantes</Text>
          <Text style={styles.descricaoFuncao}>Gerenciar cadastros</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoFuncao}
          onPress={() => acessarTela("filas")}
        >
          <Ionicons name="list" size={30} color="#8000FF" />
          <Text style={styles.nomeFuncao}>Filas</Text>
          <Text style={styles.descricaoFuncao}>Gerenciar acessos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoFuncao}
          onPress={() => acessarTela("estatisticas")}
        >
          <Ionicons name="bar-chart" size={30} color="#8000FF" />
          <Text style={styles.nomeFuncao}>Estatísticas</Text>
          <Text style={styles.descricaoFuncao}>Acompanhar indicadores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoFuncao}
          onPress={() => mostrarAviso("Histórico de eventos")}
        >
          <Ionicons name="calendar" size={30} color="#8000FF" />
          <Text style={styles.nomeFuncao}>Eventos</Text>
          <Text style={styles.descricaoFuncao}>Consultar histórico</Text>
        </TouchableOpacity>
      </View>

      {/* Ações administrativas */}
      <Text style={styles.tituloSecao}>Ações administrativas</Text>

      <TouchableOpacity
        style={styles.botaoEditar}
        onPress={() => mostrarAviso("Editar evento")}
      >
        <Ionicons name="create-outline" size={22} color="#FFFFFF" />
        <Text style={styles.textoBotao}>Editar evento</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botaoEncerrar}
        onPress={() => mostrarAviso("Encerrar evento")}
      >
        <Ionicons name="power-outline" size={22} color="#D92D45" />
        <Text style={styles.textoBotaoEncerrar}>Encerrar evento</Text>
      </TouchableOpacity>

      <View style={styles.rodape}>
        <Ionicons name="game-controller-outline" size={23} color="#8000FF" />
        <Text style={styles.textoRodape}>MaraData • Beast MaraGames</Text>
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

  banner: {
    backgroundColor: "#8000FF",
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
  },

  bannerIcone: {
    alignSelf: "flex-end",
    marginBottom: 12,
  },

  selo: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#6500CC",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
  },

  seloTexto: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  nomeEvento: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 10,
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

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 18,
    gap: 7,
  },

  statusPonto: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#8000FF",
  },

  statusBannerTexto: {
    color: "#6500CC",
    fontWeight: "bold",
    fontSize: 12,
  },

  tituloSecao: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 12,
  },

  subtitulo: {
    fontSize: 13,
    color: "#777777",
    marginTop: -5,
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E7E1F0",
  },

  informacao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },

  informacaoTexto: {
    flex: 1,
  },

  iconeInformacao: {
    width: 43,
    height: 43,
    borderRadius: 25,
    backgroundColor: "#F1E8FF",
    alignItems: "center",
    justifyContent: "center",
  },

  rotulo: {
    color: "#777777",
    fontSize: 12,
    marginBottom: 5,
  },

  valor: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "600",
  },

  divisor: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 12,
  },

  linhaDupla: {
    flexDirection: "row",
  },

  informacaoMetade: {
    flex: 1,
    paddingHorizontal: 5,
    gap: 5,
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
  },

  botaoFuncao: {
    width: "48%",
    minHeight: 125,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E1F0",
  },

  nomeFuncao: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 9,
  },

  descricaoFuncao: {
    color: "#777777",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },

  botaoEditar: {
    backgroundColor: "#8000FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  botaoEncerrar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F2B8C0",
  },

  textoBotaoEncerrar: {
    color: "#D92D45",
    fontWeight: "bold",
    fontSize: 15,
  },

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

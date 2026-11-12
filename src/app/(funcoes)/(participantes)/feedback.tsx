import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTema } from '../../../context/temaContexto';
import { buscarParticipantesDoEvento } from '../../../features/armazenamentoEvento';
import {
  buscarFeedbackParticipanteEvento,
  salvarFeedbackParticipanteEvento,
  type FeedbackParticipante,
} from '../../../features/armazenamentoPresencasFeedback';
import type { Participante } from '../../../features/armazenamentoParticipantes';

type RespostaSimNao = boolean | null;

function AvaliacaoEstrelas({
  valor,
  aoAlterar,
  tema,
  desabilitado = false,
}: {
  valor: number | null;
  aoAlterar: (valor: number) => void;
  tema: { primary: string; textSecondary: string };
  desabilitado?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((estrela) => (
        <Pressable key={estrela} onPress={() => aoAlterar(estrela)} disabled={desabilitado} hitSlop={6}>
          <Ionicons
            name={valor !== null && estrela <= valor ? 'star' : 'star-outline'}
            size={32}
            color={valor !== null && estrela <= valor ? '#F5B82E' : tema.textSecondary}
          />
        </Pressable>
      ))}
      <Text style={{ color: tema.textSecondary, fontSize: 12, marginLeft: 4 }}>{valor ? `${valor}/5` : 'Selecione'}</Text>
    </View>
  );
}

export default function FeedbackParticipante() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { tema } = useTema();
  const params = useLocalSearchParams<{
    eventId?: string;
    participantId?: string;
    nomeEvento?: string;
    nomeParticipante?: string;
  }>();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  const participantId = typeof params.participantId === 'string' ? params.participantId : '';

  const [participante, setParticipante] = useState<Participante | null>(null);
  const [feedbackExistente, setFeedbackExistente] = useState<FeedbackParticipante | null>(null);
  const [gostouEvento, setGostouEvento] = useState<RespostaSimNao>(null);
  const [avaliacaoArena, setAvaliacaoArena] = useState<number | null>(null);
  const [desejouOutroJogo, setDesejouOutroJogo] = useState<RespostaSimNao>(null);
  const [sugestoesTexto, setSugestoesTexto] = useState('');
  const [utilizouFila, setUtilizouFila] = useState<RespostaSimNao>(null);
  const [avaliacaoFila, setAvaliacaoFila] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (!eventId || !participantId) {
        setErro('Não foi possível identificar o participante e o evento.');
        setCarregando(false);
        return;
      }
      try {
        const [lista, feedback] = await Promise.all([
          buscarParticipantesDoEvento(db, eventId),
          buscarFeedbackParticipanteEvento(db, eventId, participantId),
        ]);
        if (!ativo) return;
        const encontrado = lista.find((item) => item.id === participantId) ?? null;
        setParticipante(encontrado);
        setFeedbackExistente(feedback);
        if (feedback) {
          setGostouEvento(feedback.gostouEvento);
          setAvaliacaoArena(feedback.avaliacaoArena);
          setDesejouOutroJogo(feedback.desejouOutroJogo);
          setSugestoesTexto(feedback.sugestoesJogos.join('\n'));
          setUtilizouFila(feedback.utilizouFila);
          setAvaliacaoFila(feedback.avaliacaoFila);
        }
        if (!encontrado) setErro('Este participante não está vinculado ao evento selecionado.');
      } catch (e) {
        console.error('Erro ao carregar formulário de feedback:', e);
        if (ativo) setErro('Não foi possível carregar os dados do feedback.');
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [db, eventId, participantId]);

  function opcaoSimNao(
    valorAtual: RespostaSimNao,
    alterar: (valor: RespostaSimNao) => void
  ) {
    return (
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        {[{ texto: 'Sim', valor: true }, { texto: 'Não', valor: false }].map((opcao) => {
          const selecionado = valorAtual === opcao.valor;
          return (
            <Pressable
              key={opcao.texto}
              onPress={() => alterar(opcao.valor)}
              style={{ flex: 1, padding: 13, alignItems: 'center', borderRadius: 11, borderWidth: 1, borderColor: selecionado ? tema.primary : tema.border, backgroundColor: selecionado ? tema.activeBackground : tema.surface }}
            >
              <Text style={{ color: selecionado ? tema.primary : tema.text, fontWeight: '700' }}>{opcao.texto}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  async function registrarFeedback() {
    if (gostouEvento === null || avaliacaoArena === null || desejouOutroJogo === null || utilizouFila === null) {
      Alert.alert('Respostas incompletas', 'Responda às perguntas obrigatórias antes de registrar o feedback.');
      return;
    }
    if (desejouOutroJogo && !sugestoesTexto.trim()) {
      Alert.alert('Informe os jogos', 'Digite pelo menos um jogo que o participante desejava jogar.');
      return;
    }
    if (utilizouFila && avaliacaoFila === null) {
      Alert.alert('Avaliação pendente', 'Avalie a experiência com a fila ou marque que o participante não a utilizou.');
      return;
    }

    const sugestoesJogos = desejouOutroJogo
      ? sugestoesTexto.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean)
      : [];

    setSalvando(true);
    try {
      await salvarFeedbackParticipanteEvento(db, eventId, participantId, {
        gostouEvento,
        avaliacaoArena,
        desejouOutroJogo,
        sugestoesJogos,
        utilizouFila,
        avaliacaoFila: utilizouFila ? avaliacaoFila : null,
      });
      Alert.alert('Feedback registrado', 'As respostas foram salvas neste dispositivo e ficarão disponíveis para sincronização quando o Supabase estiver conectado.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Não foi possível registrar', e instanceof Error ? e.message : 'Ocorreu um erro ao salvar o feedback.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <View style={[styles.centralizado, { backgroundColor: tema.background }]}><ActivityIndicator color={tema.primary} /></View>;
  }

  if (!participante) {
    return (
      <View style={[styles.centralizado, { backgroundColor: tema.background, padding: 24 }]}>
        <Text style={{ color: tema.text, textAlign: 'center' }}>{erro || 'Participante não encontrado.'}</Text>
        <Pressable onPress={() => router.back()} style={[styles.botaoPrincipal, { marginTop: 18, backgroundColor: tema.primary }]}><Text style={[styles.botaoPrincipalTexto, { color: tema.primaryText }]}>Voltar</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.background }}>
      <Stack.Screen options={{ title: feedbackExistente ? 'Editar feedback' : 'Registrar feedback', headerStyle: { backgroundColor: tema.header }, headerTintColor: tema.text }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 34 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.identificacao, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={{ color: tema.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{params.nomeEvento || 'Evento'}</Text>
          <Text style={{ color: tema.text, fontSize: 19, fontWeight: '800', marginTop: 4 }}>{participante.nome}</Text>
          <Text style={{ color: tema.textSecondary, fontSize: 12, marginTop: 4 }}>As respostas ficam vinculadas a esta participação neste evento.</Text>
        </View>

        <View style={[styles.formulario, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.pergunta, { color: tema.text }]}>1. O participante gostou do evento?</Text>
          {opcaoSimNao(gostouEvento, setGostouEvento)}

          <View style={[styles.divisor, { backgroundColor: tema.border }]} />
          <Text style={[styles.pergunta, { color: tema.text }]}>2. A Arena Itinerante da MaraGames foi satisfatória?</Text>
          <Text style={[styles.ajuda, { color: tema.textSecondary }]}>Avalie de 1 a 5 estrelas.</Text>
          <AvaliacaoEstrelas valor={avaliacaoArena} aoAlterar={setAvaliacaoArena} tema={tema} />

          <View style={[styles.divisor, { backgroundColor: tema.border }]} />
          <Text style={[styles.pergunta, { color: tema.text }]}>3. Teve algum jogo que o participante desejava jogar?</Text>
          {opcaoSimNao(desejouOutroJogo, setDesejouOutroJogo)}
          {desejouOutroJogo && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.perguntaSecundaria, { color: tema.text }]}>4. Quais jogos?</Text>
              <Text style={[styles.ajuda, { color: tema.textSecondary }]}>Informe um jogo por linha. Essas sugestões não serão adicionadas automaticamente ao catálogo oficial.</Text>
              <TextInput
                value={sugestoesTexto}
                onChangeText={setSugestoesTexto}
                placeholder="Ex.: Mario Kart 8\nThe Last of Us"
                placeholderTextColor={tema.textSecondary}
                multiline
                textAlignVertical="top"
                style={[styles.campoTexto, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
              />
            </View>
          )}

          <View style={[styles.divisor, { backgroundColor: tema.border }]} />
          <Text style={[styles.pergunta, { color: tema.text }]}>5. O participante utilizou a fila?</Text>
          {opcaoSimNao(utilizouFila, (valor) => { setUtilizouFila(valor); if (valor === false) setAvaliacaoFila(null); })}
          {utilizouFila === true && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.perguntaSecundaria, { color: tema.text }]}>A experiência com a fila foi satisfatória?</Text>
              <Text style={[styles.ajuda, { color: tema.textSecondary }]}>Avalie de 1 a 5 estrelas.</Text>
              <AvaliacaoEstrelas valor={avaliacaoFila} aoAlterar={setAvaliacaoFila} tema={tema} />
            </View>
          )}
          {utilizouFila === false && <Text style={[styles.ajuda, { color: tema.textSecondary, marginTop: 8 }]}>A avaliação da fila será registrada como “não utilizou”.</Text>}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Pressable onPress={() => router.back()} disabled={salvando} style={[styles.botaoSecundario, { borderColor: tema.border }]}>
            <Text style={{ color: tema.text, fontWeight: '700' }}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={() => void registrarFeedback()} disabled={salvando} style={[styles.botaoPrincipal, { backgroundColor: tema.primary, opacity: salvando ? 0.65 : 1 }]}>
            {salvando ? <ActivityIndicator color={tema.primaryText} /> : <Text style={[styles.botaoPrincipalTexto, { color: tema.primaryText }]}>{feedbackExistente ? 'Atualizar feedback' : 'Registrar feedback'}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  identificacao: { borderWidth: 1, borderRadius: 15, padding: 16, marginBottom: 14 },
  formulario: { borderWidth: 1, borderRadius: 15, padding: 16 },
  pergunta: { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  perguntaSecundaria: { fontSize: 14, fontWeight: '700' },
  ajuda: { fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 10 },
  divisor: { height: 1, marginVertical: 18 },
  campoTexto: { minHeight: 100, borderWidth: 1, borderRadius: 11, padding: 12, fontSize: 14 },
  botaoSecundario: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 11, borderWidth: 1 },
  botaoPrincipal: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 11, paddingHorizontal: 12 },
  botaoPrincipalTexto: { color: '#FFFFFF', fontWeight: '800' },
});

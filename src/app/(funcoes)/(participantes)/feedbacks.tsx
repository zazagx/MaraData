import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../../context/temaContexto';
import {
  buscarListaFeedbackEvento,
  type ParticipanteFeedbackLista,
} from '../../../features/armazenamentoPresencasFeedback';

export default function FeedbacksEvento() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { tema } = useTema();
  const params = useLocalSearchParams<{ eventId?: string; nomeEvento?: string }>();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  const nomeEvento = typeof params.nomeEvento === 'string' ? params.nomeEvento : 'Evento';

  const [participantes, setParticipantes] = useState<ParticipanteFeedbackLista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    let ativo = true;
    setCarregando(true);
    setErro('');
    if (!eventId) {
      setParticipantes([]);
      setErro('Não foi possível identificar o evento. Volte aos detalhes e abra os feedbacks novamente.');
      setCarregando(false);
      return () => { ativo = false; };
    }
    buscarListaFeedbackEvento(db, eventId)
      .then((dados) => { if (ativo) setParticipantes(dados); })
      .catch((e: unknown) => {
        console.error('Erro ao carregar feedbacks:', e);
        if (ativo) setErro('Não foi possível carregar os participantes deste evento.');
      })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [db, eventId]);

  useFocusEffect(carregar);

  const registrados = participantes.filter((item) => item.feedbackRegistrado).length;
  const larguraProgresso = `${participantes.length ? Math.round((registrados / participantes.length) * 100) : 0}%` as `${number}%`;

  return (
    <View style={[styles.container, { backgroundColor: tema.background }]}>
      <Stack.Screen options={{ title: 'Feedbacks do evento', headerStyle: { backgroundColor: tema.header }, headerTintColor: tema.text }} />
      <View style={[styles.resumo, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <Text style={[styles.evento, { color: tema.text }]}>{nomeEvento}</Text>
        <Text style={[styles.resumoTexto, { color: tema.textSecondary }]}>
          {registrados} de {participantes.length} participante(s) com feedback registrado.
        </Text>
        <View style={[styles.progressoFundo, { backgroundColor: tema.surfaceSecondary }]}>
          <View style={[styles.progresso, { backgroundColor: tema.primary, width: larguraProgresso }]} />
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator color={tema.primary} style={{ marginTop: 30 }} />
      ) : erro ? (
        <Text style={[styles.mensagem, { color: tema.textSecondary }]}>{erro}</Text>
      ) : (
        <FlatList
          data={participantes}
          keyExtractor={(item) => item.eventParticipantId}
          contentContainerStyle={{ padding: 16, paddingBottom: 30, flexGrow: 1 }}
          ListEmptyComponent={(
            <View style={styles.vazio}>
              <Ionicons name="people-outline" size={38} color={tema.textSecondary} />
              <Text style={[styles.vazioTitulo, { color: tema.text }]}>Nenhum participante neste evento</Text>
              <Text style={[styles.vazioTexto, { color: tema.textSecondary }]}>Vincule participantes ao evento antes de registrar feedbacks.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/feedback', params: { eventId, participantId: item.id, nomeEvento, nomeParticipante: item.nome } })}
              style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: tema.activeBackground }]}>
                <Text style={[styles.avatarTexto, { color: tema.primary }]}>{item.nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join('')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nome, { color: tema.text }]}>{item.nome}</Text>
                <Text style={[styles.status, { color: item.feedbackRegistrado ? '#15945F' : tema.textSecondary }]}>
                  {item.feedbackRegistrado ? 'Feedback registrado' : 'Pendente de feedback'}
                </Text>
                {item.feedbackRegistrado && (
                  <Text style={[styles.avaliacoes, { color: tema.textSecondary }]}>
                    Arena: {item.avaliacaoArena}/5 {item.gostouEvento ? '• Gostou do evento' : '• Não gostou do evento'}
                    {item.avaliacaoFila ? ` • Fila: ${item.avaliacaoFila}/5` : ''}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={tema.textSecondary} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  resumo: { margin: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  evento: { fontSize: 18, fontWeight: '800' },
  resumoTexto: { fontSize: 12, marginTop: 5, marginBottom: 12 },
  progressoFundo: { height: 8, borderRadius: 8, overflow: 'hidden' },
  progresso: { height: 8, borderRadius: 8 },
  mensagem: { textAlign: 'center', padding: 24 },
  vazio: { alignItems: 'center', justifyContent: 'center', padding: 28, flex: 1 },
  vazioTitulo: { fontSize: 16, fontWeight: '800', marginTop: 12 },
  vazioTexto: { textAlign: 'center', fontSize: 13, marginTop: 6, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontWeight: '800', fontSize: 13 },
  nome: { fontWeight: '800', fontSize: 14 },
  status: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  avaliacoes: { fontSize: 11, marginTop: 4 },
});

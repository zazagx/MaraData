import { buscarUltimoParticipante } from '@/features/armazenamentoParticipantes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';

export default function ConfirmacaoCadastro() {
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const router = useRouter();
  const params = useLocalSearchParams<{ origem?: string; filaId?: string }>();
  const participante = buscarUltimoParticipante();
  const veioDaFila = params.origem === 'fila' && Boolean(params.filaId);

  if (!participante) {
    return (
      <View style={styles.container}>
        <Text style={{ color: tema.text }}>Nenhum participante encontrado.</Text>
        <Pressable style={styles.botao} onPress={() => router.replace('/filas')}>
          <Text style={styles.textoBotao}>Voltar para filas</Text>
        </Pressable>
      </View>
    );
  }

  const [ano, mes, dia] = participante.dataNascimento.split('-');

  function voltar() {
    if (veioDaFila && params.filaId) {
      router.replace({ pathname: '/filas/gerenciarfilas', params: { filaId: params.filaId } });
    } else {
      router.replace('/participantescadastrados');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconeSucesso}><Text style={styles.check}>✓</Text></View>
      <Text style={styles.titulo}>Participante cadastrado com sucesso!</Text>
      <Text style={styles.descricao}>Confira as informações registradas:</Text>

      <View style={styles.card}>
        <Text style={styles.nome}>{participante.nome}</Text>
        <View style={styles.divisor} />
        <Text style={styles.informacao}>Nascimento: {dia}/{mes}/{ano}</Text>
        <Text style={styles.informacao}>Gênero: {participante.genero}</Text>
        <Text style={styles.informacao}>Escolaridade: {participante.escolaridade}</Text>
        <Text style={styles.informacao}>Jogos: {participante.jogos.join(', ')}</Text>
        <Text style={styles.informacao}>Conhece o mercado de games: {participante.mercadoGames}</Text>
        <Text style={styles.informacao}>Interesse profissional: {participante.interesseProfissionalGames}</Text>
      </View>

      <Pressable style={styles.botao} onPress={voltar}>
        <Text style={styles.textoBotao}>{veioDaFila ? 'Voltar para filas' : 'Voltar para a lista de participantes'}</Text>
      </Pressable>
    </View>
  );
}

const estilosBase = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1', padding: 20, alignItems: 'center', justifyContent: 'center' },
  iconeSucesso: { width: 85, height: 85, borderRadius: 45, backgroundColor: '#40bd91', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  check: { fontSize: 55, color: '#fff', fontWeight: 'bold' },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#25105e', textAlign: 'center', marginBottom: 10 },
  descricao: { fontSize: 14, color: '#666', marginBottom: 20 },
  card: { width: '100%', maxWidth: 600, backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 20 },
  nome: { fontSize: 19, fontWeight: 'bold', color: '#8000ff' },
  divisor: { height: 1, backgroundColor: '#ddd', marginVertical: 12 },
  informacao: { fontSize: 14, color: '#333', marginBottom: 12 },
  botao: { width: '100%', maxWidth: 600, backgroundColor: '#8000ff', padding: 16, borderRadius: 10, alignItems: 'center' },
  textoBotao: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
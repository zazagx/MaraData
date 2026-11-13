import { buscarParticipantePorId, type Participante } from '@/features/armazenamentoParticipantes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';

export default function ConfirmacaoCadastro() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const router = useRouter();
  const params = useLocalSearchParams<{
    origem?: string;
    filaId?: string;
    participantId?: string;
    queueError?: string;
    eventId?: string;
  }>();

  const [participante, setParticipante] = useState<Participante | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    if (!params.participantId || typeof params.participantId !== 'string') {
      setParticipante(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    buscarParticipantePorId(db, params.participantId)
      .then((resultado) => {
        if (ativo) setParticipante(resultado);
      })
      .catch((erro: unknown) => {
        console.error('Erro ao carregar participante cadastrado:', erro);
        if (ativo) setParticipante(null);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [db, params.participantId]);

  const veioDaFila = params.origem === 'fila' && Boolean(params.filaId);

  function voltar() {
    if (veioDaFila && params.filaId) {
      router.replace({
        pathname: '/filas/gerenciarfilas',
        params: { filaId: params.filaId, participanteNovoId: params.participantId || '' },
      });
    } else if (typeof params.eventId === 'string' && params.eventId) {
      router.replace({ pathname: '/participantescadastrados', params: { eventId: params.eventId } });
    } else {
      router.replace('/participantescadastrados');
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Text style={{ color: tema.text }}>Carregando cadastro...</Text>
      </View>
    );
  }

  if (!participante) {
    return (
      <View style={styles.container}>
        <Text style={{ color: tema.text }}>Não foi possível localizar o participante salvo.</Text>
        <Pressable style={styles.botao} onPress={voltar}>
          <Text style={styles.textoBotao}>{veioDaFila ? 'Escolher jogo e adicionar à fila' : 'Voltar para participantes'}</Text>
        </Pressable>
      </View>
    );
  }

  const [ano, mes, dia] = participante.dataNascimento.split('-');

  return (
    <View style={styles.container}>
      <View style={styles.iconeSucesso}><Text style={styles.check}>✓</Text></View>
      <Text style={styles.titulo}>Participante cadastrado com sucesso!</Text>
      <Text style={styles.descricao}>{veioDaFila ? 'Cadastro salvo. Ao continuar, escolha o jogo que ele vai utilizar na fila.' : 'Confira as informações registradas:'}</Text>

      {typeof params.queueError === 'string' && params.queueError !== '' && (
        <View style={styles.avisoFila}>
          <Text style={styles.avisoFilaTexto}>O participante foi cadastrado, mas houve um problema ao vinculá-lo ao evento/fila: {params.queueError} Ao voltar, você poderá tentar novamente pela lista de participantes.</Text>
        </View>
      )}

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
        <Text style={styles.textoBotao}>{veioDaFila ? 'Escolher jogo e adicionar à fila' : 'Voltar para a lista de participantes'}</Text>
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
  avisoFila: { width: '100%', maxWidth: 600, padding: 12, borderRadius: 10, backgroundColor: '#FFF4DB', marginBottom: 14 },
  avisoFilaTexto: { color: '#7A4B00', fontSize: 13, lineHeight: 19 },
  botao: { width: '100%', maxWidth: 600, backgroundColor: '#8000ff', padding: 16, borderRadius: 10, alignItems: 'center' },
  textoBotao: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});

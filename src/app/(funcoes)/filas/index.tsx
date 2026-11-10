import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { buscarFilas, type Fila } from '../../../features/armazenamentofilas';

export default function ListaFilas() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    nomeEvento?: string;
    localEvento?: string;
    situacao?: string;
  }>();
  const [filas, setFilas] = useState<Fila[]>([]);

const situacaoEvento = String(params.situacao || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_');

const eventoDisponivel = Boolean(
  params.nomeEvento?.trim() &&
  params.localEvento?.trim() &&
  situacaoEvento === 'em_andamento'
);  const filasExibidas = params.nomeEvento
    ? filas.filter((fila) => fila.evento === params.nomeEvento)
    : filas;

  useFocusEffect(useCallback(() => {
    setFilas(buscarFilas());
  }, []));

function abrirCriacao() {
  router.push({
    pathname: '/filas/criarfilas',
    params: {
      nomeEvento: params.nomeEvento || '',
      localEvento: params.localEvento || '',
      situacao: situacaoEvento,
    },
  });
}

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Filas',
        headerStyle: { backgroundColor: '#8000ff' },
        headerTintColor: '#ffffff',
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Pressable onPress={() => router.replace('/')} style={{ marginLeft: 8 }}>
            <Image source={require('../../../components/icons/arrow_left.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable style={[styles.botaoAdicionar, !eventoDisponivel && styles.botaoInativo]} onPress={abrirCriacao}>
            <Text style={styles.iconeMais}>+</Text>
          </Pressable>
        ),
      }} />

      <FlatList
        data={filasExibidas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={(
          <>
            <Text style={styles.tituloSecao}>Filas do evento</Text>
            {eventoDisponivel ? (
              <View style={styles.eventoAtual}>
                <Text style={styles.eventoAtualRotulo}>EVENTO EM ANDAMENTO</Text>
                <Text style={styles.eventoAtualNome}>{params.nomeEvento}</Text>
                <Text style={styles.eventoAtualLocal}>{params.localEvento}</Text>
              </View>
            ) : (
              <View style={styles.avisoEvento}>
                <Text style={styles.avisoEventoTexto}>Para criar filas, abra um evento com situação “Em andamento” e acesse a opção Filas nos detalhes dele.</Text>
              </View>
            )}
          </>
        )}
        ListEmptyComponent={(
          <View style={styles.listaVazia}>
            <Text style={styles.textoVazio}>Nenhuma fila criada para este evento.</Text>
            <Text style={styles.textoAjuda}>{eventoDisponivel ? 'Toque no botão + para criar a primeira fila.' : 'Selecione um evento em andamento para começar.'}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push({ pathname: '/filas/gerenciarfilas', params: { filaId: item.id } })}>
            <View style={styles.cabecalhoCard}>
              <Text style={styles.iconeControle}>🎮</Text>
              <Text style={styles.nomeFila}>{item.nome}</Text>
              <Text style={styles.seta}>›</Text>
            </View>
            <Text style={styles.evento}>{item.evento} • {item.localEvento}</Text>
            <View style={styles.rodapeCard}>
              <View style={styles.statusContainer}>
                <View style={[styles.indicadorStatus, item.status === 'encerrada' && styles.statusEncerrado]} />
                <Text style={styles.statusTexto}>{item.status === 'ativa' ? 'Ativa' : 'Encerrada'}</Text>
              </View>
              {item.status === 'ativa' && <Text style={styles.quantidade}>{item.quantidadeAguardando} aguardando</Text>}
            </View>
          </Pressable>
        )}
        ListFooterComponent={(
          <View style={styles.mascoteContainer}>
            <Image source={require('../../../components/icons/LoboIcone.png')} style={styles.logoFundo} resizeMode="contain" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1' },
  lista: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25, flexGrow: 1 },
  botaoAdicionar: { backgroundColor: '#ffffff', width: 34, height: 34, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  botaoInativo: { opacity: 0.45 },
  iconeMais: { color: '#8000ff', fontSize: 26, lineHeight: 30 },
  tituloSecao: { fontSize: 19, fontWeight: 'bold', color: '#25234c', marginBottom: 18 },
  eventoAtual: { backgroundColor: '#eee5ff', padding: 14, borderRadius: 12, marginBottom: 16 },
  eventoAtualRotulo: { color: '#8000ff', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  eventoAtualNome: { color: '#25234c', fontSize: 15, fontWeight: 'bold' },
  eventoAtualLocal: { color: '#666', fontSize: 12, marginTop: 4 },
  avisoEvento: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E7E1F0' },
  avisoEventoTexto: { color: '#666', fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: '#ffffff', padding: 18, borderRadius: 14, marginBottom: 14 },
  cabecalhoCard: { flexDirection: 'row', alignItems: 'center' },
  iconeControle: { fontSize: 24, marginRight: 12 },
  nomeFila: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#25234c' },
  seta: { fontSize: 27, color: '#8000ff' },
  evento: { fontSize: 13, color: '#666', marginTop: 8, marginLeft: 36 },
  rodapeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  indicadorStatus: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#35b879', marginRight: 6 },
  statusEncerrado: { backgroundColor: '#999999' },
  statusTexto: { fontSize: 13, color: '#444' },
  quantidade: { fontSize: 13, color: '#555', fontWeight: 'bold' },
  listaVazia: { alignItems: 'center', marginTop: 45, paddingHorizontal: 20 },
  textoVazio: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'center' },
  textoAjuda: { fontSize: 13, color: '#777', textAlign: 'center', marginTop: 8 },
  mascoteContainer: { height: 180, alignItems: 'center', justifyContent: 'center', marginTop: 25, marginBottom: 10 },
  logoFundo: { width: 150, height: 150, opacity: 0.10 },
});

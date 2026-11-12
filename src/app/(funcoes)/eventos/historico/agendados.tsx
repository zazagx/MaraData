import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Evento, useEvento } from '../../../../context/eventocontexto';
import { useTema } from '../../../../context/temaContexto';
import { useEstilosTema } from '../../../../context/temaEstilos';

const converterDataParaObjeto = (dataStr: string) => {
  if (!dataStr || dataStr.length < 10) return new Date(9999, 11, 31);
  const [dia, mes, ano] = dataStr.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
};

export default function AgendadosScreen() {
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const { eventos, recarregarEventos } = useEvento();

  useFocusEffect(useCallback(() => {
    void recarregarEventos().catch((erro) => console.error('Erro ao atualizar eventos agendados:', erro));
  }, [recarregarEventos]));

  // Filtra e ordena por data mais próxima
  const listaAgendados = eventos
    .filter((item: Evento) => item.situacao === 'agendado')
    .sort((a, b) => converterDataParaObjeto(a.dataInicio).getTime() - converterDataParaObjeto(b.dataInicio).getTime());

  const abrirDetalhesEvento = (item: Evento) => {
    // O detalhe recupera o evento pelo ID diretamente do contexto/SQLite.
    router.push({
      pathname: '/(funcoes)/eventos/detalhes',
      params: {
        eventId: item.id,
        nomeEvento: item.nomeEvento,
        localEvento: item.localEvento,
        dataInicio: item.dataInicio,
        dataTermino: item.dataTermino,
        horarioInicio: item.horarioInicio,
        horarioTermino: item.horarioTermino,
        descricao: item.descricao,
        situacao: item.situacao,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={20} color={tema.text} />
        </Pressable>
        <View>
          <Text style={styles.titulo}>Eventos Agendados</Text>
          <Text style={styles.subtitulo}>Próximos torneios e competições programadas</Text>
        </View>
      </View>

      {/* LISTA DINÂMICA DE EVENTOS AGENDADOS ORDENADA COM SETINHA */}
      {listaAgendados.length > 0 ? (
        listaAgendados.map((item: Evento, index: number) => (
          <Pressable 
            key={item.id || index} 
            style={styles.cardItemLista}
            onPress={() => abrirDetalhesEvento(item)}
          >
            <View style={styles.iconeMiniContainer}>
              <Ionicons name="game-controller" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.infoItemLista}>
              <Text style={styles.itemTitulo}>{item.nomeEvento}</Text>
              <Text style={styles.itemSub}>{item.dataInicio} • {item.horarioInicio}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{item.localEvento}</Text>
            </View>
            <View style={styles.badgeStatus}>
              <Text style={styles.textoStatus}>Agendado</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tema.textSecondary} style={{ marginLeft: 8 }} />
          </Pressable>
        ))
      ) : (
        <View style={styles.vazioContainer}>
          <Ionicons name="calendar-outline" size={48} color={tema.textSecondary} />
          <Text style={styles.vazioTexto}>Nenhum evento agendado no momento.</Text>
        </View>
      )}

    </ScrollView>
  );
}

const estilosBase = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F7F5FC', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 10 },
  botaoVoltar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECE6F0' },
  titulo: { fontSize: 22, fontWeight: '900', color: '#1E1B2E' },
  subtitulo: { fontSize: 13, color: '#6B7280' },
  cardItemLista: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ECE6F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  iconeMiniContainer: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoItemLista: { flex: 1, gap: 2 },
  itemTitulo: { fontSize: 15, fontWeight: 'bold', color: '#1E1B2E' },
  itemSub: { fontSize: 12, color: '#6B7280' },
  badgeStatus: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  textoStatus: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  vazioContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  vazioTexto: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});
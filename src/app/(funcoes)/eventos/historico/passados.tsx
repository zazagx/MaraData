import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEvento } from '../../../../context/eventocontexto';
import { useTema } from '../../../../context/temaContexto';
import { useEstilosTema } from '../../../../context/temaEstilos';

export default function PassadosScreen() {
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const { eventos, recarregarEventos } = useEvento();

  useFocusEffect(useCallback(() => {
    void recarregarEventos().catch((erro) => console.error('Erro ao atualizar eventos passados:', erro));
  }, [recarregarEventos]));

  // Filtra apenas os eventos que estão com a situação 'encerrado' (ou passados)
  const listaPassados = eventos.filter((item) => item.situacao === 'encerrado');

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.botaoVoltar}>
          <Ionicons name="arrow-back" size={20} color={tema.text} />
        </Pressable>
        <View>
          <Text style={styles.titulo}>Eventos Passados</Text>
          <Text style={styles.subtitulo}>Histórico de torneios e competições finalizadas</Text>
        </View>
      </View>

      {/* LISTA DINÂMICA DE PASSADOS */}
      {listaPassados.length > 0 ? (
        listaPassados.map((item, index) => (
          <Pressable
            key={item.id || index}
            style={styles.cardItemLista}
            onPress={() => router.push({ pathname: '/(funcoes)/eventos/detalhes', params: { eventId: item.id } })}
          >
            <View style={styles.iconeMiniContainerPassado}>
              <MaterialCommunityIcons name="trophy-outline" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.infoItemLista}>
              <Text style={styles.itemTitulo}>{item.nomeEvento}</Text>
              <Text style={styles.itemSub}>{item.dataInicio} • {item.horarioInicio}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{item.localEvento}</Text>
            </View>
            <View style={styles.badgeStatusFinalizado}>
              <Text style={styles.textoStatusFinalizado}>Finalizado</Text>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.vazioContainer}>
          <MaterialCommunityIcons name="history" size={48} color={tema.textSecondary} />
          <Text style={styles.vazioTexto}>Nenhum evento passado registrado.</Text>
        </View>
      )}

    </ScrollView>
  );
}

const estilosBase = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F5FC',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 10,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE6F0',
  },
  titulo: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E1B2E',
  },
  subtitulo: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardItemLista: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECE6F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconeMiniContainerPassado: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoItemLista: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E1B2E',
  },
  itemSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  badgeStatusFinalizado: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  textoStatusFinalizado: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },
  vazioContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  vazioTexto: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});
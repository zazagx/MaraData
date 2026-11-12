import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Evento, useEvento } from '../../../../context/eventocontexto';

// Função auxiliar para converter string "DD/MM/AAAA" em objeto Date para ordenação correta
const converterDataParaObjeto = (dataStr: string) => {
  if (!dataStr || dataStr.length < 10) return new Date(9999, 11, 31); // Data muito distante se inválida
  const [dia, mes, ano] = dataStr.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
};

export default function HistoricoIndex() {
  const { evento: eventoAtivo, eventos } = useEvento();

  const temEvento = eventoAtivo && eventoAtivo.nomeEvento;
  const emAndamento = temEvento && eventoAtivo.situacao === 'em_andamento';
  const agendado = temEvento && eventoAtivo.situacao === 'agendado';

  // Filtra agendados e ordena da data mais próxima para a mais distante
  const listaAgendados = eventos
    .filter((item: Evento) => item.situacao === 'agendado')
    .sort((a, b) => converterDataParaObjeto(a.dataInicio).getTime() - converterDataParaObjeto(b.dataInicio).getTime());

  // Filtra passados e ordena do mais recente para o mais antigo
  const listaPassados = eventos
    .filter((item: Evento) => item.situacao === 'encerrado')
    .sort((a, b) => converterDataParaObjeto(b.dataInicio).getTime() - converterDataParaObjeto(a.dataInicio).getTime());

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Histórico de Eventos</Text>
        <Text style={styles.subtitulo}>Acompanhe seus eventos e torneios</Text>
      </View>

      {/* SEÇÃO: EVENTO EM ANDAMENTO / ATIVO */}
      {emAndamento ? (
        <View style={styles.secaoBox}>
          <View style={styles.badgeAndamento}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
            <Text style={styles.badgeTexto}>Evento em Andamento</Text>
          </View>

          <View style={styles.cardAndamento}>
            <View style={styles.iconeTrofeuContainer}>
              <MaterialCommunityIcons name="trophy" size={40} color="#FFFFFF" />
            </View>

            <View style={styles.infoAndamento}>
              <Text style={styles.nomeEventoAndamento} numberOfLines={1}>
                {eventoAtivo.nomeEvento}
              </Text>
              
              <View style={styles.linhaDetalhe}>
                <Ionicons name="calendar-outline" size={14} color="#EDE9FE" />
                <Text style={styles.textoDetalhe}>
                  {`${eventoAtivo.dataInicio || 'Data'} • ${eventoAtivo.horarioInicio || 'Horário'}`}
                </Text>
              </View>

              <View style={styles.linhaDetalhe}>
                <Ionicons name="location-outline" size={14} color="#EDE9FE" />
                <Text style={styles.textoDetalhe} numberOfLines={1}>
                  {eventoAtivo.localEvento || 'Local não informado'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable 
            style={styles.botaoVerDetalhes}
            onPress={() => router.push('/(funcoes)/eventos/detalhes')}
          >
            <Text style={styles.textoBotaoDetalhes}>Ver Detalhes</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.secaoBoxVazio}>
          <MaterialCommunityIcons name="calendar-blank" size={32} color="#8B5CF6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.vazioTitulo}>Nenhum evento em andamento</Text>
            <Text style={styles.vazioSub}>
              {agendado ? `Próximo: ${eventoAtivo.nomeEvento}` : 'Cadastre ou inicie um evento para exibi-lo aqui.'}
            </Text>
          </View>
        </View>
      )}

      {/* SEÇÃO: EVENTOS AGENDADOS (Mostra no máximo os 3 primeiros ordenados) */}
      <View style={styles.secaoCabecalho}>
        <View style={styles.secaoTituloRow}>
          <Ionicons name="calendar" size={18} color="#7C3AED" />
          <Text style={styles.secaoTitulo}>Eventos Agendados</Text>
        </View>
        <Pressable onPress={() => router.push('/(funcoes)/eventos/historico/agendados')}>
          <Text style={styles.verTodosTexto}>Ver todos &gt;</Text>
        </Pressable>
      </View>

      {listaAgendados.length > 0 ? (
        listaAgendados.slice(0, 3).map((item: Evento, index: number) => (
          <Pressable 
            key={item.id || index}
            style={styles.cardItemLista}
            onPress={() => router.push('/(funcoes)/eventos/historico/agendados')}
          >
            <View style={styles.iconeMiniContainer}>
              <Ionicons name="game-controller" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.infoItemLista}>
              <Text style={styles.itemTitulo}>{item.nomeEvento}</Text>
              <Text style={styles.itemSub}>{item.dataInicio} • {item.horarioInicio}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{item.localEvento}</Text>
            </View>
            <View style={styles.badgeStatusAgendado}>
              <Text style={styles.textoStatusAgendado}>Agendado</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </Pressable>
        ))
      ) : (
        <Text style={styles.nenhumRegistroText}>Nenhum evento agendado.</Text>
      )}

      {/* SEÇÃO: EVENTOS PASSADOS (Mostra no máximo os 3 primeiros) */}
      <View style={[styles.secaoCabecalho, { marginTop: 20 }]}>
        <View style={styles.secaoTituloRow}>
          <Ionicons name="time" size={18} color="#7C3AED" />
          <Text style={styles.secaoTitulo}>Eventos Passados</Text>
        </View>
        <Pressable onPress={() => router.push('/(funcoes)/eventos/historico/passados')}>
          <Text style={styles.verTodosTexto}>Ver todos &gt;</Text>
        </Pressable>
      </View>

      {listaPassados.length > 0 ? (
        listaPassados.slice(0, 3).map((item: Evento, index: number) => (
          <Pressable 
            key={item.id || index}
            style={[styles.cardItemLista, index === listaPassados.slice(0, 3).length - 1 && { marginBottom: 30 }]}
            onPress={() => router.push('/(funcoes)/eventos/historico/passados')}
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
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
          </Pressable>
        ))
      ) : (
        <Text style={[styles.nenhumRegistroText, { marginBottom: 30 }]}>Nenhum evento passado.</Text>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F7F5FC', flexGrow: 1 },
  header: { marginBottom: 20, marginTop: 10 },
  titulo: { fontSize: 24, fontWeight: '900', color: '#1E1B2E', marginBottom: 4 },
  subtitulo: { fontSize: 14, color: '#6B7280' },
  secaoBox: { backgroundColor: '#8B5CF6', borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: '#7C3AED', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  secaoBoxVazio: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#EDE9FE' },
  vazioTitulo: { fontSize: 15, fontWeight: 'bold', color: '#1E1B2E' },
  vazioSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badgeAndamento: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 16 },
  badgeTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cardAndamento: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconeTrofeuContainer: { width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center' },
  infoAndamento: { flex: 1, gap: 4 },
  nomeEventoAndamento: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  linhaDetalhe: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  textoDetalhe: { fontSize: 13, color: '#EDE9FE' },
  botaoVerDetalhes: { backgroundColor: '#6D28D9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 8 },
  textoBotaoDetalhes: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  secaoTituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secaoTitulo: { fontSize: 16, fontWeight: '800', color: '#1E1B2E' },
  verTodosTexto: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  cardItemLista: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#ECE6F0', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  iconeMiniContainer: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconeMiniContainerPassado: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#6D28D9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoItemLista: { flex: 1, gap: 2 },
  itemTitulo: { fontSize: 15, fontWeight: 'bold', color: '#1E1B2E' },
  itemSub: { fontSize: 12, color: '#6B7280' },
  badgeStatusAgendado: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  textoStatusAgendado: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  badgeStatusFinalizado: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  textoStatusFinalizado: { color: '#4B5563', fontSize: 11, fontWeight: '700' },
  nenhumRegistroText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', marginBottom: 8 },
});
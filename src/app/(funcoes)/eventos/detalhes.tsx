import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEvento } from '../../../context/eventocontexto';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';

export default function DetalhesEvento() {
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const { evento: eventoSelecionado, eventos, encerrarEvento } = useEvento();
  const params = useLocalSearchParams<{
    eventId?: string;
    nomeEvento?: string;
    localEvento?: string;
    dataInicio?: string;
    dataTermino?: string;
    horarioInicio?: string;
    horarioTermino?: string;
    descricao?: string;
    situacao?: 'agendado' | 'em_andamento' | 'encerrado';
  }>();

  const eventId = typeof params.eventId === 'string' ? params.eventId : undefined;
  const eventoContexto = eventId
    ? eventos.find((item) => item.id === eventId) ?? (eventoSelecionado?.id === eventId ? eventoSelecionado : null)
    : eventoSelecionado;

  // Prioriza o registro persistido; os parâmetros servem como fallback de navegação.
  const nomeEvento = eventoContexto?.nomeEvento || params.nomeEvento || 'Evento';
  const localEvento = eventoContexto?.localEvento || params.localEvento || 'Local não informado';
  const dataInicio = eventoContexto?.dataInicio || params.dataInicio || 'Não informada';
  const dataTermino = eventoContexto?.dataTermino || params.dataTermino || '';
  const horarioInicio = eventoContexto?.horarioInicio || params.horarioInicio || 'Não informado';
  const horarioTermino = eventoContexto?.horarioTermino || params.horarioTermino || '';
  const descricao = eventoContexto?.descricao || params.descricao || '';
  const situacao = (eventoContexto?.situacao || params.situacao || 'agendado') as 'agendado' | 'em_andamento' | 'encerrado';

  // Estados dos modais de suporte[cite: 6]
  const [modalMenuVisivel, setModalMenuVisivel] = useState(false);
  const [modalEncerrarVisivel, setModalEncerrarVisivel] = useState(false);

  const situacaoFormatada =
    situacao === 'em_andamento'
      ? 'EM ANDAMENTO'
      : situacao === 'encerrado'
      ? 'ENCERRADO'
      : 'AGENDADO';

  const handleEncerrarEvento = async () => {
    setModalEncerrarVisivel(false);

    if (!eventId) {
      Alert.alert('Evento não identificado', 'Não foi possível localizar o identificador deste evento.');
      return;
    }

    try {
      await encerrarEvento(eventId);
      Alert.alert('Evento encerrado', 'O evento foi finalizado e salvo neste dispositivo.', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (erro) {
      Alert.alert(
        'Não foi possível encerrar o evento',
        erro instanceof Error ? erro.message : 'Ocorreu um erro ao atualizar o evento.'
      );
    }
  };

  // Função para abrir a tela de cadastro enviando os dados atuais para edição[cite: 6]
  const irParaEdicao = () => {
    router.push({
      pathname: '/(funcoes)/eventos',
      params: {
        editando: 'true',
        eventId: eventId || '',
        nomeEvento,
        localEvento,
        dataInicio,
        dataTermino,
        horarioInicio,
        horarioTermino,
        descricao,
        situacao,
      },
    });
  };

  const acessarNavegacao = (tela: string) => {
    if (tela === 'participantes') {
      router.push({ pathname: '/(funcoes)/(participantes)/participantescadastrados', params: { eventId: eventId || '', situacao } });
    } else if (tela === 'filas') {
      router.push({
        pathname: '/(funcoes)/filas',
        params: { eventId: eventId || '', nomeEvento, localEvento, situacao },
      });
    } else if (tela === 'estatisticas') {
      router.push('/(funcoes)/estatistica');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Botão de voltar customizado para retornar direto à Home[cite: 6] */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Detalhes do evento',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/')} 
              style={{ marginLeft: 4, marginRight: 12 }}
              accessibilityLabel="Voltar para Home"
            >
              <Ionicons name="arrow-back" size={24} color={tema.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Banner Superior Roxo Escuro[cite: 6] */}
        <View style={styles.topBanner}>
          <View style={styles.bannerHeader}>
            <View />
            <TouchableOpacity style={styles.menuIconButton} onPress={() => setModalMenuVisivel(true)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.badgeContainer}>
            <View style={[styles.badge, situacao === 'em_andamento' && styles.badgeAndamento, situacao === 'encerrado' && styles.badgeEncerrado]}>
              <Text style={styles.badgeText}>{situacaoFormatada}</Text>
            </View>
          </View>

          <View style={styles.bannerBody}>
            <View style={styles.bannerTextGroup}>
              <Text style={styles.bannerEventName}>{nomeEvento}</Text>
              <Text style={styles.bannerEventSub}>Gerenciamento e operação do evento</Text>
            </View>
            <View style={styles.gameIllustration}>
              <Ionicons name="game-controller-outline" size={54} color="rgba(255, 255, 255, 0.4)" />
            </View>
          </View>
        </View>

        {/* Card Principal de Informações[cite: 6] */}
        <View style={styles.mainCard}>
          <Text style={styles.cardSectionTitle}>Informações do evento</Text>

          {/* Local inserido pelo usuário[cite: 6] */}
          <View style={styles.infoRowBlock}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location" size={20} color={tema.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Local</Text>
              <Text style={styles.infoValueBold}>{localEvento}</Text>
            </View>
          </View>

          {/* Datas[cite: 6] */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <View style={styles.infoIconBoxSmall}>
                <Ionicons name="calendar-outline" size={18} color={tema.primary} />
              </View>
              <Text style={styles.infoLabel}>Data de início</Text>
              <Text style={styles.infoValueBold}>{dataInicio}</Text>
            </View>

            {dataTermino ? (
              <View style={styles.gridCol}>
                <View style={styles.infoIconBoxSmall}>
                  <Ionicons name="calendar" size={18} color={tema.primary} />
                </View>
                <Text style={styles.infoLabel}>Data de término</Text>
                <Text style={styles.infoValueBold}>{dataTermino}</Text>
              </View>
            ) : null}
          </View>

          {/* Horários[cite: 6] */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <View style={styles.infoIconBoxSmall}>
                <Ionicons name="time-outline" size={18} color={tema.primary} />
              </View>
              <Text style={styles.infoLabel}>Horário de início</Text>
              <Text style={styles.infoValueBold}>{horarioInicio}</Text>
            </View>

            {horarioTermino ? (
              <View style={styles.gridCol}>
                <View style={styles.infoIconBoxSmall}>
                  <Ionicons name="time" size={18} color={tema.primary} />
                </View>
                <Text style={styles.infoLabel}>Horário de término</Text>
                <Text style={styles.infoValueBold}>{horarioTermino}</Text>
              </View>
            ) : null}
          </View>

          {/* Descrição[cite: 6] */}
          {descricao ? (
            <View style={styles.infoRowBlock}>
              <View style={styles.infoIconBox}>
                <Ionicons name="document-text-outline" size={20} color={tema.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Descrição</Text>
                <Text style={styles.infoDescriptionText}>{descricao}</Text>
              </View>
            </View>
          ) : null}

          {/* Situação[cite: 6] */}
          <TouchableOpacity style={styles.situationRow} onPress={() => setModalMenuVisivel(true)}>
            <View style={styles.infoIconBoxSmall}>
              <Ionicons name="calendar" size={18} color={tema.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Situação do evento</Text>
              <Text style={styles.infoValueBold}>{situacaoFormatada.toLowerCase().replace('_', ' ')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={tema.textSecondary} />
          </TouchableOpacity>

          {/* Ações Administrativas[cite: 6] */}
          <Text style={[styles.cardSectionTitle, { marginTop: 24 }]}>Ações administrativas</Text>
          
          <View style={styles.adminButtonsRow}>
            {situacao !== 'encerrado' && (
              <TouchableOpacity style={styles.btnEditar} onPress={irParaEdicao}>
                <Ionicons name="pencil-outline" size={16} color={tema.primary} />
                <Text style={styles.btnEditarText}>Editar evento</Text>
              </TouchableOpacity>
            )}

            {situacao === 'em_andamento' && (
              <TouchableOpacity style={styles.btnEncerrar} onPress={() => setModalEncerrarVisivel(true)}>
                <Ionicons name="power-outline" size={16} color="#DC2626" />
                <Text style={styles.btnEncerrarText}>Encerrar evento</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.warningNote}>
            <Ionicons name="information-circle-outline" size={16} color={tema.textSecondary} />
            <Text style={styles.warningNoteText}>
              {situacao === 'agendado'
                ? 'O evento ainda não foi iniciado. Você pode ajustar seus dados antes de começar.'
                : situacao === 'encerrado'
                  ? 'Este evento foi encerrado. Os dados históricos permanecem disponíveis para consulta.'
                  : 'Ao encerrar o evento, todas as filas abertas também serão encerradas.'}
            </Text>
          </View>

          {/* Acesso Rápido[cite: 6] */}
          <Text style={[styles.cardSectionTitle, { marginTop: 24 }]}>Acesso rápido</Text>
          
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity style={styles.quickAccessCard} onPress={() => acessarNavegacao('participantes')}>
              <View style={styles.quickIconBox}>
                <Ionicons name="people-outline" size={22} color={tema.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickCardTitle}>Participantes</Text>
                <Text style={styles.quickCardSub}>Ver e gerenciar participantes</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C4B5FD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessCard} onPress={() => acessarNavegacao('filas')}>
              <View style={styles.quickIconBox}>
                <Ionicons name="list-outline" size={22} color={tema.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickCardTitle}>Filas</Text>
                <Text style={styles.quickCardSub}>Gerenciar filas e acesso</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C4B5FD" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessCard} onPress={() => acessarNavegacao('estatisticas')}>
              <View style={styles.quickIconBox}>
                <Ionicons name="stats-chart-outline" size={22} color={tema.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickCardTitle}>Estatísticas</Text>
                <Text style={styles.quickCardSub}>Acompanhar indicadores</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C4B5FD" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAccessCard}
              onPress={() => router.push({ pathname: '/feedbacks', params: { eventId: eventId || '', nomeEvento } })}
            >
              <View style={styles.quickIconBox}>
                <Ionicons name="chatbox-ellipses-outline" size={22} color={tema.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickCardTitle}>Feedbacks</Text>
                <Text style={styles.quickCardSub}>Registrar e consultar opiniões</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C4B5FD" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Bottom Sheet Modal: Menu de Opções[cite: 6] */}
      <Modal visible={modalMenuVisivel} transparent animationType="slide" onRequestClose={() => setModalMenuVisivel(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalMenuVisivel(false)}>
          <View style={styles.bottomSheetCard}>
            {situacao !== 'encerrado' && (
              <TouchableOpacity style={styles.sheetOption} onPress={() => { setModalMenuVisivel(false); irParaEdicao(); }}>
                <Ionicons name="pencil-outline" size={20} color={tema.primary} />
                <Text style={styles.sheetOptionText}>Editar evento</Text>
              </TouchableOpacity>
            )}

            {situacao === 'em_andamento' && (
              <TouchableOpacity style={styles.sheetOption} onPress={() => { setModalMenuVisivel(false); setModalEncerrarVisivel(true); }}>
                <Ionicons name="power-outline" size={20} color="#DC2626" />
                <Text style={[styles.sheetOptionText, { color: '#DC2626' }]}>Encerrar evento</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={() => setModalMenuVisivel(false)}>
              <Ionicons name="close-outline" size={20} color="#EF4444" />
              <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Confirmação de Encerramento[cite: 6] */}
      <Modal visible={modalEncerrarVisivel} transparent animationType="fade" onRequestClose={() => setModalEncerrarVisivel(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.alertCard}>
            <View style={styles.powerIconBadge}>
              <Ionicons name="power" size={26} color="#FFFFFF" />
            </View>

            <Text style={styles.alertTitle}>Encerrar evento?</Text>
            <Text style={styles.alertSub}>Essa ação encerrará o evento atual e não poderá ser desfeita.</Text>

            <TouchableOpacity style={styles.btnConfirmDanger} onPress={handleEncerrarEvento}>
              <Text style={styles.btnConfirmDangerText}>Sim, encerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnCancelDialog} onPress={() => setModalEncerrarVisivel(false)}>
              <Text style={styles.btnCancelDialogText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const estilosBase = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1035' },
  content: { flexGrow: 1, backgroundColor: '#1E1035' },

  topBanner: { backgroundColor: '#1E1035', paddingTop: 14, paddingHorizontal: 18, paddingBottom: 28 },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  menuIconButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' },
  
  badgeContainer: { marginBottom: 12 },
  badge: { backgroundColor: '#6D28D9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeAndamento: { backgroundColor: '#059669' },
  badgeEncerrado: { backgroundColor: '#DC2626' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  bannerBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTextGroup: { flex: 1, paddingRight: 10 },
  bannerEventName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  bannerEventSub: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 13, marginTop: 4 },
  gameIllustration: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center' },

  mainCard: { flex: 1, backgroundColor: '#F8F7FC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  cardSectionTitle: { fontSize: 17, fontWeight: '800', color: '#1F192F', marginBottom: 14 },

  infoRowBlock: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EDE8F5', marginBottom: 12 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  infoIconBoxSmall: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  infoValueBold: { fontSize: 14, color: '#1F192F', fontWeight: '700', marginTop: 2 },
  infoDescriptionText: { fontSize: 13, color: '#4B5563', lineHeight: 19, marginTop: 4 },

  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridCol: { flex: 1, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EDE8F5' },

  situationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EDE8F5', marginBottom: 12 },

  adminButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btnEditar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3E8FF', borderWidth: 1, borderColor: '#DDD6FE', height: 46, borderRadius: 12 },
  btnEditarText: { color: '#6D28D9', fontWeight: '700', fontSize: 13 },
  btnEncerrar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', height: 46, borderRadius: 12 },
  btnEncerrarText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },

  warningNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 10 },
  warningNoteText: { flex: 1, fontSize: 11, color: '#6B7280' },

  quickAccessGrid: { gap: 10 },
  quickAccessCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#EDE8F5' },
  quickIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  quickCardTitle: { fontSize: 14, fontWeight: '700', color: '#1F192F' },
  quickCardSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sheetOptionText: { fontSize: 15, fontWeight: '700', color: '#1F192F' },

  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  alertCard: { width: '100%', maxWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, alignItems: 'center' },
  powerIconBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  alertTitle: { fontSize: 18, fontWeight: '800', color: '#1F192F', marginBottom: 6 },
  alertSub: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  btnConfirmDanger: { width: '100%', height: 48, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  btnConfirmDangerText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  btnCancelDialog: { width: '100%', height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  btnCancelDialogText: { color: '#4B5563', fontWeight: '700', fontSize: 14 },
});
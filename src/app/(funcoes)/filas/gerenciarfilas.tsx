import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';

import {
  buscarParticipantes,
  type Participante,
} from '@/features/armazenamentoParticipantes';
import {
  adicionarParticipanteAFila,
  avancarSenha,
  buscarFilaPorId,
  encerrarFila as encerrarFilaStorage,
  type Fila,
} from '../../../features/armazenamentofilas';

function obterIniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]?.toUpperCase() ?? '').join('');
}

export default function GerenciarFila() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const router = useRouter();
  const { filaId } = useLocalSearchParams<{ filaId?: string }>();
  const [fila, setFila] = useState<Fila | undefined>();
  const [carregandoFila, setCarregandoFila] = useState(true);
  const [participantesCadastrados, setParticipantesCadastrados] = useState<Participante[]>([]);
  const [modalParticipantesVisivel, setModalParticipantesVisivel] = useState(false);
  const [modalEncerrarVisivel, setModalEncerrarVisivel] = useState(false);
  const [busca, setBusca] = useState('');
  const [mensagemModal, setMensagemModal] = useState('');

  const carregarParticipantesCadastrados = useCallback(async () => {
    const participantes = await buscarParticipantes(db);
    setParticipantesCadastrados(participantes);
  }, [db]);

  const atualizarTela = useCallback(async () => {
    setCarregandoFila(true);
    try {
      if (typeof filaId === 'string') {
        setFila(await buscarFilaPorId(db, filaId));
      } else {
        setFila(undefined);
      }
      await carregarParticipantesCadastrados();
    } catch (erro) {
      console.error('Erro ao carregar dados da fila:', erro);
      setMensagemModal(erro instanceof Error ? erro.message : 'Não foi possível carregar os dados desta fila.');
    } finally {
      setCarregandoFila(false);
    }
  }, [carregarParticipantesCadastrados, db, filaId]);

  useFocusEffect(useCallback(() => {
    void atualizarTela();
  }, [atualizarTela]));

  const participantesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return participantesCadastrados.filter((participante) =>
      participante.nome.toLocaleLowerCase('pt-BR').includes(termo)
    );
  }, [participantesCadastrados, busca]);

  if (carregandoFila) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.vazioTitulo}>Carregando fila...</Text>
      </View>
    );
  }

  if (!fila) {
    return (
      <View style={styles.centralizado}>
        <Ionicons name="alert-circle-outline" size={42} color={tema.primary} />
        <Text style={styles.vazioTitulo}>Fila não encontrada</Text>
        <Text style={styles.vazioDescricao}>Volte para a lista e abra uma fila existente.</Text>
        <Pressable style={styles.botaoPrincipal} onPress={() => router.replace('/filas')}>
          <Text style={styles.textoBotaoPrincipal}>Voltar para filas</Text>
        </Pressable>
      </View>
    );
  }

  // Normaliza registros antigos que possam não ter os campos da fila atual.
  const filaAtual: Fila = {
    ...fila,
    participantes: Array.isArray(fila.participantes) ? fila.participantes : [],
    indiceAtual: Number.isInteger(fila.indiceAtual) && fila.indiceAtual >= 0
      ? Math.min(fila.indiceAtual, Array.isArray(fila.participantes) ? fila.participantes.length : 0)
      : 0,
    localEvento: fila.localEvento ?? '',
    quantidadeAguardando: fila.quantidadeAguardando ?? 0,
  };

  const participanteAtual = filaAtual.participantes[filaAtual.indiceAtual];
  const proximoParticipante = filaAtual.participantes[filaAtual.indiceAtual + 1];
  const filaAtiva = filaAtual.status === 'ativa';

  async function abrirModalParticipantes() {
    setMensagemModal('');
    try {
      await carregarParticipantesCadastrados();
      setModalParticipantesVisivel(true);
    } catch (erro) {
      console.error('Erro ao atualizar participantes da fila:', erro);
      setMensagemModal('Não foi possível carregar os participantes.');
      setModalParticipantesVisivel(true);
    }
  }

  async function selecionarParticipante(participante: Participante) {
    const resultado = await adicionarParticipanteAFila(db, filaAtual.id, participante.id);

    if (resultado.sucesso && resultado.fila) {
      setFila(resultado.fila);
      setBusca('');
      setModalParticipantesVisivel(false);
    } else {
      setMensagemModal(resultado.mensagem || 'Não foi possível adicionar o participante.');
    }
  }

  async function chamarProximaSenha() {
    const resultado = await avancarSenha(db, filaAtual.id);
    if (resultado.fila) setFila(resultado.fila);
    else setMensagemModal(resultado.mensagem || 'Não foi possível avançar a fila.');
  }

  async function confirmarEncerramento() {
    const resultado = await encerrarFilaStorage(db, filaAtual.id);
    if (resultado.fila) setFila(resultado.fila);
    else setMensagemModal(resultado.mensagem || 'Não foi possível encerrar a fila.');
    setModalEncerrarVisivel(false);
  }


  function abrirCadastroParticipante() {
    setModalParticipantesVisivel(false);
    router.push({
      pathname: '/novoparticipante',
      params: { origem: 'fila', filaId: filaAtual.id },
    });
  }

  function obterStatus(index: number) {
    if (!filaAtiva && index >= filaAtual.indiceAtual) return 'Não atendido';
    if (index < filaAtual.indiceAtual) return 'Atendido';
    if (index === filaAtual.indiceAtual) return 'Atual';
    if (index === filaAtual.indiceAtual + 1) return 'Próximo';
    return 'Aguardando';
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerTopo}>
            <View style={styles.bannerIcone}>
              <Ionicons name="game-controller" size={40} color="#FFFFFF" />
            </View>
            <View style={styles.seloStatus}>
              <View style={[styles.statusPonto, !filaAtiva && styles.statusPontoInativo]} />
              <Text style={styles.seloStatusTexto}>{filaAtiva ? 'Fila ativa' : 'Fila encerrada'}</Text>
            </View>
          </View>
          <Text style={styles.nomeEvento}>{filaAtual.evento}</Text>
          <View style={styles.localBanner}>
            <Ionicons name="location-outline" size={17} color="#FFFFFF" />
            <Text style={styles.localBannerTexto}>{filaAtual.localEvento || 'Local não informado'}</Text>
          </View>
          <Text style={styles.nomeFilaBanner}>{filaAtual.nome}</Text>
        </View>

        <Text style={styles.tituloSecao}>Senha atual</Text>
        <View style={styles.cardSenha}>
          <View style={styles.conteudoSenha}>
            {participanteAtual ? (
              <>
                <View style={styles.dadosSenha}>
                  <Text style={styles.numeroSenha}>{participanteAtual.senha}</Text>
                  <Text style={styles.nomeAtendimento}>{participanteAtual.nome}</Text>
                  <Text style={styles.tipoAtendimento}>{participanteAtual.jogos.join(', ') || 'Atividade não informada'}</Text>
                </View>
                <View style={styles.divisorSenha} />
                <View style={styles.iconeSenha}><Ionicons name="game-controller" size={38} color={tema.primary} /></View>
              </>
            ) : (
              <View style={styles.semParticipantes}>
                <Ionicons name="people-outline" size={30} color={tema.primary} />
                <Text style={styles.semParticipantesTexto}>Sem participantes na fila</Text>
              </View>
            )}
          </View>
          <View style={styles.divisorCardSenha} />
          <Pressable style={[styles.botaoAdicionar, !filaAtiva && styles.botaoDesabilitado]} onPress={() => void abrirModalParticipantes()} disabled={!filaAtiva}>
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.textoBotaoAdicionar}>Adicionar participante</Text>
          </Pressable>
        </View>

        <View style={styles.cardProximo}>
          <View style={styles.iconeProximo}><Ionicons name="people" size={28} color={tema.primary} /></View>
          <View style={styles.dadosProximo}>
            <Text style={styles.rotuloProximo}>Próximo participante</Text>
            <Text style={styles.nomeProximo}>{proximoParticipante ? `${proximoParticipante.senha} • ${proximoParticipante.nome}` : 'Nenhum participante aguardando'}</Text>
          </View>
        </View>

        <View style={styles.tituloLista}>
          <Text style={styles.tituloSecao}>Participantes na fila</Text>
          <View style={styles.contador}><Text style={styles.textoContador}>{filaAtual.quantidadeAguardando} aguardando</Text></View>
        </View>

        <View style={styles.cardLista}>
          {filaAtual.participantes.length === 0 ? (
            <View style={styles.listaVazia}><Text style={styles.textoListaVazia}>Ainda não há participantes cadastrados nesta fila.</Text></View>
          ) : filaAtual.participantes.map((participante, index) => {
            const status = obterStatus(index);
            return (
              <View key={participante.id}>
                <View style={styles.itemParticipante}>
                  <View style={styles.avatar}><Text style={styles.iniciais}>{obterIniciais(participante.nome)}</Text></View>
                  <View style={styles.dadosParticipante}>
                    <Text style={styles.senhaParticipante}>{participante.senha}</Text>
                    <Text style={styles.nomeParticipante}>{participante.nome}</Text>
                  </View>
                  <View style={[styles.badgeStatus, status === 'Atual' && styles.badgeAtual, status === 'Próximo' && styles.badgeProximo, status === 'Atendido' && styles.badgeAtendido]}>
                    <Text style={[styles.textoBadge, status === 'Atendido' && styles.textoAtendido]}>{status}</Text>
                  </View>
                </View>
                {index !== filaAtual.participantes.length - 1 && <View style={styles.divisorLista} />}
              </View>
            );
          })}
        </View>

        <Pressable style={[styles.botaoPrincipal, (!filaAtiva || !participanteAtual) && styles.botaoDesabilitado]} onPress={chamarProximaSenha} disabled={!filaAtiva || !participanteAtual}>
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.textoBotaoPrincipal}>Próxima senha</Text>
        </Pressable>

        <Pressable style={[styles.botaoEncerrar, !filaAtiva && styles.botaoEncerrarDesabilitado]} onPress={() => setModalEncerrarVisivel(true)} disabled={!filaAtiva}>
          <Ionicons name="stop-circle-outline" size={21} color="#D92D45" />
          <Text style={styles.textoBotaoEncerrar}>Encerrar fila</Text>
        </Pressable>

        <View style={styles.rodape}>
          <Ionicons name="game-controller-outline" size={21} color={tema.primary} />
          <Text style={styles.textoRodape}>MaraData • Beast MaraGames</Text>
        </View>
      </ScrollView>

      {/* Janela flutuante para selecionar participantes já cadastrados */}
      <Modal visible={modalParticipantesVisivel} transparent animationType="fade" onRequestClose={() => setModalParticipantesVisivel(false)}>
        <View style={styles.fundoModal}>
          <Pressable style={styles.modalFora} onPress={() => setModalParticipantesVisivel(false)} />
          <View style={styles.caixaModal}>
            <View style={styles.modalCabecalho}>
              <View>
                <Text style={styles.modalTitulo}>Adicionar participante</Text>
                <Text style={styles.modalSubtitulo}>Selecione alguém já cadastrado.</Text>
              </View>
              <Pressable onPress={() => setModalParticipantesVisivel(false)} style={styles.fecharModal}><Ionicons name="close" size={22} color={tema.textSecondary} /></Pressable>
            </View>
            <View style={styles.buscaContainer}>
              <Ionicons name="search" size={19} color={tema.textSecondary} />
              <TextInput style={styles.campoBusca} placeholder="Buscar participante..." placeholderTextColor={tema.textSecondary} value={busca} onChangeText={setBusca} />
            </View>
            {mensagemModal !== '' && <Text style={styles.mensagemModal}>{mensagemModal}</Text>}
            <FlatList
              data={participantesFiltrados}
              keyExtractor={(item) => `${item.nome}-${item.dataNascimento}`}
              keyboardShouldPersistTaps="handled"
              style={styles.listaModal}
              ListEmptyComponent={<Text style={styles.listaModalVazia}>{busca ? 'Nenhum participante encontrado.' : 'Nenhum participante cadastrado ainda.'}</Text>}
              renderItem={({ item }) => (
                <Pressable style={styles.itemModal} onPress={() => selecionarParticipante(item)}>
                  <View style={styles.avatarModal}><Text style={styles.iniciais}>{obterIniciais(item.nome)}</Text></View>
                  <View style={styles.dadosItemModal}>
                    <Text style={styles.nomeItemModal}>{item.nome}</Text>
                    <Text style={styles.jogosItemModal}>{item.jogos.join(', ') || 'Sem jogos informados'}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={tema.primary} />
                </Pressable>
              )}
            />
            <Pressable style={styles.botaoNaoCadastrado} onPress={abrirCadastroParticipante}>
              <Ionicons name="person-add-outline" size={19} color={tema.primary} />
              <Text style={styles.textoNaoCadastrado}>Participante não cadastrado?</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Confirmação customizada para funcionar também na Web */}
      <Modal visible={modalEncerrarVisivel} transparent animationType="fade" onRequestClose={() => setModalEncerrarVisivel(false)}>
        <View style={styles.fundoConfirmacao}>
          <View style={styles.caixaConfirmacao}>
            <View style={styles.iconeConfirmacao}><Ionicons name="warning-outline" size={30} color="#D92D45" /></View>
            <Text style={styles.tituloConfirmacao}>Encerrar esta fila?</Text>
            <Text style={styles.textoConfirmacao}>A fila será marcada como encerrada e seu histórico completo ficará disponível para as estatísticas. Esta ação não poderá ser desfeita.</Text>
            <View style={styles.acoesConfirmacao}>
              <Pressable style={styles.botaoCancelarModal} onPress={() => setModalEncerrarVisivel(false)}><Text style={styles.textoCancelarModal}>Cancelar</Text></Pressable>
              <Pressable style={styles.botaoConfirmarEncerrar} onPress={confirmarEncerramento}><Text style={styles.textoConfirmarEncerrar}>Encerrar fila</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const estilosBase = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  conteudo: { padding: 20, paddingBottom: 35, width: '100%', maxWidth: 900, alignSelf: 'center' },
  banner: { backgroundColor: '#8000FF', borderRadius: 22, padding: 22, marginBottom: 25 },
  bannerTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  bannerIcone: { backgroundColor: '#6500CC', padding: 10, borderRadius: 14 },
  seloStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 7 },
  statusPonto: { width: 8, height: 8, borderRadius: 10, backgroundColor: '#28B463' },
  statusPontoInativo: { backgroundColor: '#D92D45' },
  seloStatusTexto: { color: '#6500CC', fontSize: 12, fontWeight: 'bold' },
  nomeEvento: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  nomeFilaBanner: { color: '#EFE0FF', fontSize: 13, fontWeight: '600', marginTop: 12 },
  localBanner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  localBannerTexto: { color: '#FFFFFF', fontSize: 14, flex: 1 },
  tituloSecao: { fontSize: 19, fontWeight: 'bold', color: '#222222', marginBottom: 12 },
  cardSenha: { backgroundColor: '#8000FF', borderRadius: 18, padding: 7, marginBottom: 20 },
  conteudoSenha: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 16, minHeight: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dadosSenha: { flex: 1, alignItems: 'center' },
  numeroSenha: { color: '#222222', fontSize: 29, fontWeight: 'bold' },
  nomeAtendimento: { color: '#444444', fontSize: 15, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  tipoAtendimento: { color: '#888888', fontSize: 12, marginTop: 3, textAlign: 'center' },
  divisorSenha: { width: 1, height: 65, backgroundColor: '#E7E1F0', marginHorizontal: 15 },
  iconeSenha: { width: 65, alignItems: 'center', justifyContent: 'center' },
  semParticipantes: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  semParticipantesTexto: { color: '#777', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  divisorCardSenha: { height: 1, backgroundColor: '#A85AFF', marginHorizontal: 10 },
  botaoAdicionar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 9 },
  textoBotaoAdicionar: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  cardProximo: { backgroundColor: '#F1E8FF', borderRadius: 16, padding: 14, marginBottom: 25, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeProximo: { width: 45, height: 45, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  dadosProximo: { flex: 1 },
  rotuloProximo: { color: '#777777', fontSize: 12, marginBottom: 4 },
  nomeProximo: { color: '#222222', fontSize: 14, fontWeight: 'bold' },
  tituloLista: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  contador: { backgroundColor: '#8000FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  textoContador: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  cardLista: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 5, borderWidth: 1, borderColor: '#E7E1F0', marginBottom: 25 },
  itemParticipante: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 20, backgroundColor: '#F1E8FF', alignItems: 'center', justifyContent: 'center' },
  iniciais: { fontSize: 12, fontWeight: 'bold', color: '#8000FF' },
  dadosParticipante: { flex: 1 },
  senhaParticipante: { color: '#222222', fontSize: 13, fontWeight: 'bold' },
  nomeParticipante: { color: '#777777', fontSize: 12, marginTop: 2 },
  divisorLista: { height: 1, backgroundColor: '#EEEEEE' },
  badgeStatus: { backgroundColor: '#EEEEEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeAtual: { backgroundColor: '#8000FF' },
  badgeProximo: { backgroundColor: '#D8F5DF' },
  badgeAtendido: { backgroundColor: '#F1E8FF' },
  textoBadge: { color: '#6500CC', fontSize: 10, fontWeight: 'bold' },
  textoAtendido: { color: '#777777' },
  listaVazia: { padding: 20, alignItems: 'center' },
  textoListaVazia: { color: '#777', fontSize: 13, textAlign: 'center' },
  botaoPrincipal: { backgroundColor: '#8000FF', borderRadius: 13, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 12 },
  textoBotaoPrincipal: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  botaoDesabilitado: { backgroundColor: '#BCA0D9', opacity: 0.65 },
  botaoEncerrar: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F2B8C0' },
  textoBotaoEncerrar: { color: '#D92D45', fontSize: 15, fontWeight: 'bold' },
  botaoEncerrarDesabilitado: { opacity: 0.5 },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 28 },
  textoRodape: { color: '#888888', fontSize: 12 },
  centralizado: { flex: 1, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center', padding: 25 },
  vazioTitulo: { fontSize: 19, fontWeight: 'bold', color: '#25234c', marginTop: 12 },
  vazioDescricao: { fontSize: 13, color: '#777', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  fundoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalFora: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  caixaModal: { width: '100%', maxWidth: 520, maxHeight: '82%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, overflow: 'hidden' },
  modalCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitulo: { color: '#222', fontSize: 18, fontWeight: 'bold' },
  modalSubtitulo: { color: '#777', fontSize: 12, marginTop: 4 },
  fecharModal: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F2F2F2', alignItems: 'center', justifyContent: 'center' },
  buscaContainer: { height: 46, backgroundColor: '#F1E8FF', borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9, marginBottom: 10 },
  campoBusca: { flex: 1, color: '#222', fontSize: 14 },
  listaModal: { flexGrow: 0, minHeight: 100, maxHeight: 330 },
  listaModalVazia: { textAlign: 'center', color: '#777', padding: 22, fontSize: 13 },
  itemModal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', gap: 10 },
  avatarModal: { width: 38, height: 38, borderRadius: 20, backgroundColor: '#F1E8FF', alignItems: 'center', justifyContent: 'center' },
  dadosItemModal: { flex: 1 },
  nomeItemModal: { color: '#222', fontSize: 14, fontWeight: 'bold' },
  jogosItemModal: { color: '#777', fontSize: 11, marginTop: 3 },
  mensagemModal: { color: '#D92D45', fontSize: 12, marginBottom: 8 },
  botaoNaoCadastrado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginTop: 10, backgroundColor: '#F1E8FF', borderRadius: 11 },
  textoNaoCadastrado: { color: '#6500CC', fontWeight: 'bold', fontSize: 13 },
  fundoConfirmacao: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  caixaConfirmacao: { width: '100%', maxWidth: 420, backgroundColor: '#FFF', borderRadius: 18, padding: 22, alignItems: 'center' },
  iconeConfirmacao: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#FDE7EA', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tituloConfirmacao: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  textoConfirmacao: { color: '#666', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  acoesConfirmacao: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  botaoCancelarModal: { flex: 1, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  textoCancelarModal: { color: '#555', fontWeight: 'bold', fontSize: 13 },
  botaoConfirmarEncerrar: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#D92D45', alignItems: 'center' },
  textoConfirmarEncerrar: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
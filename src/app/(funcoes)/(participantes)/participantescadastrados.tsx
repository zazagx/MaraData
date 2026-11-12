import {
  buscarParticipantes,
  type Participante
} from '@/features/armazenamentoParticipantes';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';
import {
  buscarParticipantesDoEvento,
  registrarParticipanteNoEvento,
} from '../../../features/armazenamentoEvento';
import {
  buscarDiasEvento,
  buscarIdsPresentesNoDia,
  buscarParticipantesDoDia,
  buscarResumoPresencasEvento,
  concluirDiaEvento,
  definirPresencaManual,
  iniciarDiaEvento,
  formatarDataDiaEvento,
  type DiaEvento,
  type ResumoPresencasEvento,
} from '../../../features/armazenamentoPresencasFeedback';

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';


function calcularIdade(dataNascimento: string) {
  const [ano, mes, dia] = dataNascimento.split('-').map(Number)

  const hoje = new Date()

  let idade = hoje.getFullYear() - ano

  if (
    hoje.getMonth() + 1 < mes ||
    (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
  ) {
    idade--
  }

  return idade
}
function formatarData(dataNascimento: string) {
  const [ano, mes, dia] = dataNascimento.split('-')
  return `${dia}/${mes}/${ano}`
}


function obterIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('')
}


export default function ParticipantesCadastrados() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);

  const router = useRouter()
  const params = useLocalSearchParams<{ eventId?: string; situacao?: string }>();
  const eventId = typeof params.eventId === 'string' ? params.eventId : '';
  const eventoEncerrado = Boolean(eventId && params.situacao === 'encerrado');

  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [todosParticipantes, setTodosParticipantes] = useState<Participante[]>([])
  const [busca, setBusca] = useState('')
  const [buscaVincular, setBuscaVincular] = useState('')
  const [modalVincularVisivel, setModalVincularVisivel] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [participantesNoEvento, setParticipantesNoEvento] = useState<Set<string>>(new Set());
  const [secaoEvento, setSecaoEvento] = useState<'geral' | 'dias'>('geral');
  const [diasEvento, setDiasEvento] = useState<DiaEvento[]>([]);
  const [diaSelecionadoId, setDiaSelecionadoId] = useState('');
  const [participantesDoDia, setParticipantesDoDia] = useState<Participante[]>([]);
  const [presentesNoDia, setPresentesNoDia] = useState<Set<string>>(new Set());
  const [resumoPresencas, setResumoPresencas] = useState<ResumoPresencasEvento | null>(null);
  const [modalPresencaVisivel, setModalPresencaVisivel] = useState(false);
  const [buscaPresenca, setBuscaPresenca] = useState('');

  // Reconsulta os participantes, dias e presenças sempre que a tela recebe foco.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        setCarregando(true);
        setErroCarregamento('');
        try {
          const [dadosVisiveis, todos, dias, resumo] = await Promise.all([
            eventId ? buscarParticipantesDoEvento(db, eventId) : buscarParticipantes(db),
            eventId ? buscarParticipantes(db) : Promise.resolve([] as Participante[]),
            eventId ? buscarDiasEvento(db, eventId) : Promise.resolve([] as DiaEvento[]),
            eventId ? buscarResumoPresencasEvento(db, eventId) : Promise.resolve(null),
          ]);
          if (!ativo) return;

          setParticipantes(dadosVisiveis);
          setTodosParticipantes(todos);
          setParticipantesNoEvento(new Set(eventId ? dadosVisiveis.map((item) => item.id) : []));
          setDiasEvento(dias);
          setResumoPresencas(resumo);

          const diaInicial = dias.find((dia) => dia.status === 'em_andamento') ?? dias[0];
          setDiaSelecionadoId(diaInicial?.id ?? '');
          if (diaInicial) {
            const [presentes, ids] = await Promise.all([
              buscarParticipantesDoDia(db, diaInicial.id),
              buscarIdsPresentesNoDia(db, diaInicial.id),
            ]);
            if (ativo) {
              setParticipantesDoDia(presentes);
              setPresentesNoDia(new Set(ids));
            }
          } else {
            setParticipantesDoDia([]);
            setPresentesNoDia(new Set());
          }
        } catch (erro) {
          console.error('Erro ao consultar participantes e presenças:', erro);
          if (ativo) setErroCarregamento('Não foi possível carregar os dados deste evento.');
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      void carregar();
      return () => { ativo = false; };
    }, [db, eventId])
  );

  async function atualizarDiaSelecionado(diaId: string) {
    setDiaSelecionadoId(diaId);
    const [presentes, ids, dias, resumo] = await Promise.all([
      buscarParticipantesDoDia(db, diaId),
      buscarIdsPresentesNoDia(db, diaId),
      eventId ? buscarDiasEvento(db, eventId) : Promise.resolve([] as DiaEvento[]),
      eventId ? buscarResumoPresencasEvento(db, eventId) : Promise.resolve(null),
    ]);
    setParticipantesDoDia(presentes);
    setPresentesNoDia(new Set(ids));
    setDiasEvento(dias);
    setResumoPresencas(resumo);
  }

  async function atualizarPresenca(participanteId: string, presente: boolean) {
    if (!diaSelecionadoId) return;
    try {
      await definirPresencaManual(db, diaSelecionadoId, participanteId, presente);
      await atualizarDiaSelecionado(diaSelecionadoId);
    } catch (erro) {
      Alert.alert('Não foi possível atualizar a presença', erro instanceof Error ? erro.message : 'Tente novamente.');
    }
  }

  async function alterarStatusDia(dia: DiaEvento) {
    try {
      if (dia.status === 'nao_iniciado') await iniciarDiaEvento(db, dia.id);
      else if (dia.status === 'em_andamento') await concluirDiaEvento(db, dia.id);
      await atualizarDiaSelecionado(dia.id);
    } catch (erro) {
      Alert.alert('Não foi possível atualizar o dia', erro instanceof Error ? erro.message : 'Tente novamente.');
    }
  }


  // Filters participants by name.
  const fonteParticipantes = eventId && secaoEvento === 'dias' ? participantesDoDia : participantes;
  const participantesFiltrados = fonteParticipantes.filter((participante) =>
    participante.nome
      .toLocaleLowerCase('pt-BR')
      .includes(busca.trim().toLocaleLowerCase('pt-BR'))
  )

  const diaSelecionado = diasEvento.find((dia) => dia.id === diaSelecionadoId) ?? null;

  // Na tela de um evento, permite localizar pessoas do cadastro geral que
  // ainda não foram vinculadas a ele, sem misturá-las à lista de participantes.
  const participantesDisponiveis = todosParticipantes.filter(
    (participante) => !participantesNoEvento.has(participante.id)
  );

  const participantesDisponiveisFiltrados = participantesDisponiveis.filter(
    (participante) =>
      participante.nome
        .toLocaleLowerCase('pt-BR')
        .includes(buscaVincular.trim().toLocaleLowerCase('pt-BR'))
  );

  //Setinha de detalhes do respectivo participante ああああ
  const [participanteSelecionado, setParticipanteSelecionado] =
  useState<Participante | null>(null)

  async function adicionarParticipanteSelecionadoAoEvento() {
    if (!eventId || !participanteSelecionado) return;

    try {
      const resultado = await registrarParticipanteNoEvento(
        db,
        eventId,
        participanteSelecionado.id
      );

      const inscritosAtualizados = await buscarParticipantesDoEvento(db, eventId);
      setParticipantes(inscritosAtualizados);
      setParticipantesNoEvento(
        new Set(inscritosAtualizados.map((item) => item.id))
      );
      if (diaSelecionadoId) await atualizarDiaSelecionado(diaSelecionadoId);
      setModalVincularVisivel(false);
      setParticipanteSelecionado(null);

      Alert.alert(
        resultado.jaExistia ? 'Participante já vinculado' : 'Participante adicionado',
        resultado.jaExistia
          ? 'Este participante já está registrado neste evento.'
          : 'O participante foi vinculado ao evento. Os dados desta inscrição foram registrados para as estatísticas.'
      );
    } catch (erro) {
      Alert.alert(
        'Não foi possível vincular',
        erro instanceof Error ? erro.message : 'Ocorreu um erro ao vincular o participante ao evento.'
      );
    }
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}

      <Stack.Screen
        options={{
          title: 'Participantes',
          headerStyle: {
            backgroundColor: tema.header,
          },
          headerTintColor: tema.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',

          headerRight: () => (
            !eventoEncerrado ? (
              <Pressable
                style={styles.botaoAdicionar}
                onPress={() => router.push(eventId ? { pathname: '/novoparticipante', params: { eventId } } : '/novoparticipante')}
              >
                <Text style={styles.iconeMais}>+</Text>
              </Pressable>
            ) : null
          ),
        }}
      />


      {/* PARTICIPANT LIST */}

      <FlatList
        data={participantesFiltrados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.lista}

        ListHeaderComponent={
          <View>
            {eventId && (
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', backgroundColor: tema.surfaceSecondary, borderRadius: 12, padding: 4, gap: 4 }}>
                  <Pressable
                    onPress={() => setSecaoEvento('geral')}
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center', backgroundColor: secaoEvento === 'geral' ? tema.primary : 'transparent' }}
                  >
                    <Text style={{ color: secaoEvento === 'geral' ? tema.primaryText : tema.textSecondary, fontWeight: '700' }}>Participantes gerais</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSecaoEvento('dias')}
                    style={{ flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center', backgroundColor: secaoEvento === 'dias' ? tema.primary : 'transparent' }}
                  >
                    <Text style={{ color: secaoEvento === 'dias' ? tema.primaryText : tema.textSecondary, fontWeight: '700' }}>Por dia</Text>
                  </Pressable>
                </View>

                {secaoEvento === 'dias' && (
                  <View style={{ marginTop: 14 }}>
                    {resumoPresencas && (
                      <View style={{ backgroundColor: tema.surface, borderColor: tema.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                        <Text style={{ color: tema.text, fontWeight: '800', marginBottom: 5 }}>Resumo de presença</Text>
                        <Text style={{ color: tema.textSecondary, fontSize: 12 }}>Pessoas únicas: {resumoPresencas.participantesUnicosPresentes}  •  Presenças: {resumoPresencas.totalPresencas}</Text>
                        <Text style={{ color: tema.textSecondary, fontSize: 12 }}>Retornaram em outro dia: {resumoPresencas.participantesRecorrentes}</Text>
                      </View>
                    )}

                    {diasEvento.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {diasEvento.map((dia) => (
                          <Pressable
                            key={dia.id}
                            onPress={() => void atualizarDiaSelecionado(dia.id)}
                            style={{ paddingVertical: 10, paddingHorizontal: 13, borderRadius: 11, backgroundColor: diaSelecionadoId === dia.id ? tema.primary : tema.surface, borderWidth: 1, borderColor: diaSelecionadoId === dia.id ? tema.primary : tema.border }}
                          >
                            <Text style={{ color: diaSelecionadoId === dia.id ? tema.primaryText : tema.text, fontWeight: '700', fontSize: 12 }}>Dia {dia.numero}</Text>
                            <Text style={{ color: diaSelecionadoId === dia.id ? tema.primaryText : tema.textSecondary, fontSize: 11 }}>{formatarDataDiaEvento(dia.data)}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : (
                      <Text style={{ color: tema.textSecondary, padding: 12 }}>Nenhum dia foi configurado para este evento.</Text>
                    )}

                    {diaSelecionado && (
                      <View style={{ backgroundColor: tema.surface, borderColor: tema.border, borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: tema.text, fontWeight: '800' }}>Dia {diaSelecionado.numero}</Text>
                          <Text style={{ color: diaSelecionado.status === 'em_andamento' ? '#16A36A' : tema.textSecondary, fontSize: 11, fontWeight: '700' }}>
                            {diaSelecionado.status === 'em_andamento' ? 'EM ANDAMENTO' : diaSelecionado.status === 'concluido' ? 'CONCLUÍDO' : diaSelecionado.status === 'nao_realizado' ? 'NÃO REALIZADO' : 'NÃO INICIADO'}
                          </Text>
                        </View>
                        <Text style={{ color: tema.textSecondary, fontSize: 12, marginBottom: 10 }}>{presentesNoDia.size} participante(s) com presença registrada.</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {!eventoEncerrado && diaSelecionado.status === 'nao_iniciado' && params.situacao === 'em_andamento' && (
                            <Pressable onPress={() => void alterarStatusDia(diaSelecionado)} style={{ flex: 1, backgroundColor: tema.primary, padding: 11, borderRadius: 9, alignItems: 'center' }}>
                              <Text style={{ color: tema.primaryText, fontWeight: '700' }}>Iniciar dia</Text>
                            </Pressable>
                          )}
                          {!eventoEncerrado && diaSelecionado.status === 'em_andamento' && (
                            <Pressable onPress={() => void alterarStatusDia(diaSelecionado)} style={{ flex: 1, backgroundColor: '#16865B', padding: 11, borderRadius: 9, alignItems: 'center' }}>
                              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Concluir dia</Text>
                            </Pressable>
                          )}
                          {(diaSelecionado.status === 'em_andamento' || diaSelecionado.status === 'concluido') && (
                            <Pressable onPress={() => { setBuscaPresenca(''); setModalPresencaVisivel(true); }} style={{ flex: 1, backgroundColor: tema.surfaceSecondary, padding: 11, borderRadius: 9, alignItems: 'center' }}>
                              <Text style={{ color: tema.primary, fontWeight: '700' }}>{eventoEncerrado ? 'Corrigir presenças' : 'Gerenciar presença'}</Text>
                            </Pressable>
                          )}
                        </View>
                        {diaSelecionado.status === 'nao_iniciado' && params.situacao !== 'em_andamento' && (
                          <Text style={{ color: tema.textSecondary, fontSize: 12 }}>Inicie o evento para liberar o controle de presença diária.</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.buscaContainer}>
              <Text style={styles.iconeBusca}>⌕</Text>
              <TextInput
                style={styles.campoBusca}
                placeholder="Buscar participante..."
                placeholderTextColor={tema.textSecondary}
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            {eventId && !eventoEncerrado && (
              <Pressable
                style={styles.botaoVincularExistente}
                onPress={() => {
                  setBuscaVincular('');
                  setModalVincularVisivel(true);
                }}
              >
                <Text style={styles.textoBotaoVincularExistente}>
                  + Vincular participante já cadastrado
                </Text>
              </Pressable>
            )}
          </View>
        }

        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Text style={styles.textoVazio}>
              {carregando
                ? 'Carregando participantes...'
                : erroCarregamento || (busca
                  ? 'Nenhum participante encontrado.'
                  : eventId && secaoEvento === 'dias'
                    ? 'Nenhuma presença registrada neste dia.'
                    : eventId
                      ? 'Nenhum participante vinculado a este evento ainda.'
                      : 'Nenhum participante cadastrado ainda.')}
            </Text>

            {!carregando && !erroCarregamento && !busca && (
              <Text style={styles.textoAjuda}>
                {eventId
                  ? eventoEncerrado
                    ? 'Este evento foi encerrado; a lista está disponível somente para consulta.'
                    : 'Use as opções acima para cadastrar uma pessoa nova ou vincular alguém já cadastrado.'
                  : 'Toque no botão + para cadastrar o primeiro participante.'}
              </Text>
            )}
          </View>
        }

        renderItem={({ item }) => {

          const idade = calcularIdade(item.dataNascimento)
          

          return (
            <View style={styles.card}>

              {/* NAME AND AVATAR */}

              <View style={styles.cabecalhoCard}>

                <View style={styles.avatar}>
                  <Text style={styles.iniciais}>
                    {obterIniciais(item.nome)}
                  </Text>
                </View>

                <View style={styles.identificacao}>

                  <Text style={styles.nome} numberOfLines={1}>
                    {item.nome}
                  </Text>

                  <Text style={styles.subtitulo}>
                    {idade} {idade === 1 ? 'ano' : 'anos'} • {item.genero}
                  </Text>

                </View>

                <Pressable
                style={styles.botaoSeta}
                onPress={() => setParticipanteSelecionado(item)}
                hitSlop={10}
                >
                  <Text style={styles.seta}>›</Text>
                </Pressable>

              </View>


              {/* ADDITIONAL INFORMATION */}

            </View>
          )
        }}
      />
      <Modal
  visible={participanteSelecionado !== null}
  transparent
  animationType="fade"
  onRequestClose={() => setParticipanteSelecionado(null)}
>
  <View style={styles.fundoModal}>

    {/* Fundo escuro clicável */}
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => setParticipanteSelecionado(null)}
    />

    {/* Card de informações */}
    <View style={styles.modalCard}>

      {participanteSelecionado && (
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.modalCabecalho}>

            <View style={styles.avatar}>
              <Text style={styles.iniciais}>
                {obterIniciais(participanteSelecionado.nome)}
              </Text>
            </View>

            <View style={styles.identificacaoModal}>
              <Text style={styles.nomeModal}>
                {participanteSelecionado.nome}
              </Text>

              <Text style={styles.subtitulo}>
                {calcularIdade(participanteSelecionado.dataNascimento)} anos
                {' • '}
                {participanteSelecionado.genero}
              </Text>
            </View>

            <Pressable
              style={styles.botaoFechar}
              onPress={() => setParticipanteSelecionado(null)}
            >
              <Text style={styles.textoFechar}>×</Text>
            </Pressable>

          </View>

          <View style={styles.separador} />

          <Text style={styles.rotuloModal}>
            Data de nascimento
          </Text>
          <Text style={styles.valorModal}>
            {formatarData(participanteSelecionado.dataNascimento)}
          </Text>

          <Text style={styles.rotuloModal}>
            Escolaridade
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.escolaridade}
          </Text>

          <Text style={styles.rotuloModal}>
            Jogos de interesse
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.jogos.join(', ')}
          </Text>

          <Text style={styles.rotuloModal}>
            Conhece o mercado de games?
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.mercadoGames}
          </Text>

          <Text style={styles.rotuloModal}>
            Interesse profissional no mercado de games
          </Text>
          <Text style={styles.valorModal}>
            {participanteSelecionado.interesseProfissionalGames}
          </Text>

        </ScrollView>
      )}

      {eventId && participanteSelecionado && (
        <View style={styles.acoesModal}>
          {participantesNoEvento.has(participanteSelecionado.id) ? (
            <>
              <Text style={styles.participanteVinculado}>Este participante já está vinculado a este evento.</Text>
              <Pressable
                style={[styles.botaoAdicionarEvento, { marginTop: 8, backgroundColor: tema.surfaceSecondary }]}
                onPress={() => {
                  setParticipanteSelecionado(null);
                  router.push({ pathname: '/feedback', params: { eventId, participantId: participanteSelecionado.id } });
                }}
              >
                <Text style={[styles.textoBotaoAdicionarEvento, { color: tema.primary }]}>Registrar / consultar feedback</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.botaoAdicionarEvento} onPress={adicionarParticipanteSelecionadoAoEvento}>
              <Text style={styles.textoBotaoAdicionarEvento}>Adicionar participante a este evento</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  </View>
</Modal>

      {/* Modal separado: procura no cadastro global sem poluir a lista do evento. */}
      <Modal
        visible={modalVincularVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVincularVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVincularVisivel(false)}
          />
          <View style={styles.modalVincularCard}>
            <View style={styles.modalCabecalho}>
              <View style={styles.identificacaoModal}>
                <Text style={styles.nomeModal}>Vincular participante</Text>
                <Text style={styles.subtitulo}>
                  Escolha alguém já cadastrado que ainda não participa deste evento.
                </Text>
              </View>
              <Pressable
                style={styles.botaoFechar}
                onPress={() => setModalVincularVisivel(false)}
              >
                <Text style={styles.textoFechar}>×</Text>
              </Pressable>
            </View>

            <View style={styles.buscaContainer}>
              <Text style={styles.iconeBusca}>⌕</Text>
              <TextInput
                style={styles.campoBusca}
                placeholder="Buscar participante..."
                placeholderTextColor={tema.textSecondary}
                value={buscaVincular}
                onChangeText={setBuscaVincular}
              />
            </View>

            <FlatList
              data={participantesDisponiveisFiltrados}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              style={styles.listaVincular}
              ListEmptyComponent={
                <Text style={styles.textoVazioVincular}>
                  {participantesDisponiveis.length === 0
                    ? 'Todos os participantes cadastrados já estão vinculados a este evento.'
                    : 'Nenhum participante encontrado.'}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.itemModal}
                  onPress={() => {
                    setParticipanteSelecionado(item);
                    setModalVincularVisivel(false);
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.iniciais}>{obterIniciais(item.nome)}</Text>
                  </View>
                  <View style={styles.identificacaoModal}>
                    <Text style={styles.nomeItemModal}>{item.nome}</Text>
                    <Text style={styles.jogosItemModal}>
                      {item.jogos.join(', ') || 'Sem jogos informados'}
                    </Text>
                  </View>
                  <Text style={styles.iconeAdicionarVinculo}>+</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {eventId && diaSelecionado && (
        <Modal
          visible={modalPresencaVisivel}
          transparent
          animationType="slide"
          onRequestClose={() => setModalPresencaVisivel(false)}
        >
          <View style={styles.fundoModal}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalPresencaVisivel(false)} />
            <View style={[styles.modalVincularCard, { backgroundColor: tema.surface }]}>
              <View style={styles.modalCabecalho}>
                <View style={styles.identificacaoModal}>
                  <Text style={[styles.nomeModal, { color: tema.text }]}>Presenças — Dia {diaSelecionado.numero}</Text>
                  <Text style={[styles.subtitulo, { color: tema.textSecondary }]}>Marque quem compareceu neste dia. Entradas em filas também registram presença automaticamente.</Text>
                </View>
                <Pressable style={styles.botaoFechar} onPress={() => setModalPresencaVisivel(false)}>
                  <Text style={styles.textoFechar}>×</Text>
                </Pressable>
              </View>
              <View style={styles.buscaContainer}>
                <Text style={styles.iconeBusca}>⌕</Text>
                <TextInput
                  style={styles.campoBusca}
                  placeholder="Buscar participante..."
                  placeholderTextColor={tema.textSecondary}
                  value={buscaPresenca}
                  onChangeText={setBuscaPresenca}
                />
              </View>
              <FlatList
                data={participantes.filter((item) => item.nome.toLocaleLowerCase('pt-BR').includes(buscaPresenca.trim().toLocaleLowerCase('pt-BR')))}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 380 }}
                ListEmptyComponent={<Text style={{ color: tema.textSecondary, textAlign: 'center', padding: 18 }}>Nenhum participante vinculado ao evento.</Text>}
                renderItem={({ item }) => {
                  const presente = presentesNoDia.has(item.id);
                  return (
                    <Pressable
                      onPress={() => void atualizarPresenca(item.id, !presente)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: tema.border, gap: 10 }}
                    >
                      <View style={{ width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, borderColor: presente ? tema.primary : tema.border, backgroundColor: presente ? tema.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {presente && <Ionicons name="checkmark" size={18} color={tema.primaryText} />}
                      </View>
                      <Text style={{ color: tema.text, flex: 1, fontWeight: '600' }}>{item.nome}</Text>
                      <Text style={{ color: tema.textSecondary, fontSize: 12 }}>{presente ? 'Presente' : 'Ausente'}</Text>
                    </Pressable>
                  );
                }}
              />
              <Pressable onPress={() => setModalPresencaVisivel(false)} style={[styles.botaoAdicionarEvento, { marginTop: 12 }]}>
                <Text style={styles.textoBotaoAdicionarEvento}>Concluir</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

    </View>
  )
}


const estilosBase = StyleSheet.create({
  botaoVincularExistente: {
    backgroundColor: '#EEE5FF',
    borderRadius: 11,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  textoBotaoVincularExistente: {
    color: '#6500CC',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalVincularCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
  },
  listaVincular: {
    flexGrow: 0,
    minHeight: 100,
    maxHeight: 380,
  },
  textoVazioVincular: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    padding: 22,
  },
  iconeAdicionarVinculo: {
    color: '#8000FF',
    fontSize: 25,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  },

  acoesModal: {
    paddingTop: 12,
  },
  botaoAdicionarEvento: {
    backgroundColor: '#8000ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  textoBotaoAdicionarEvento: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  participanteVinculado: {
    color: '#23865A',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
  },

  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
  },

  lista: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 25,
    flexGrow: 1,
  },

  botaoAdicionar: {
    backgroundColor: '#fff',
    width: 34,
    height: 34,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },

  iconeMais: {
    fontSize: 26,
    color: '#8000ff',
    lineHeight: 30,
  },

  buscaContainer: {
    height: 48,
    backgroundColor: '#e7e7f5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  iconeBusca: {
    fontSize: 25,
    color: '#342a80',
    marginRight: 10,
  },

  campoBusca: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 25,
    backgroundColor: '#ded8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iniciais: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8000ff',
  },

  identificacao: {
    flex: 1,
  },

  nome: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#17152b',
  },

  subtitulo: {
    fontSize: 13,
    color: '#62627a',
    marginTop: 4,
  },

  seta: {
    fontSize: 28,
    color: '#342a80',
    marginHorizontal: 5,
  },

  detalhes: {
    backgroundColor: '#f1efff',
    borderRadius: 10,
    padding: 11,
  },

  informacao: {
    fontSize: 12,
    color: '#25234c',
    marginBottom: 8,
  },

  simbolo: {
    color: '#8000ff',
    fontWeight: 'bold',
  },

  listaVazia: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 25,
  },

  textoVazio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    textAlign: 'center',
  },

  textoAjuda: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
  },
  botaoSeta: {
  paddingHorizontal: 8,
  paddingVertical: 4,
},

fundoModal: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.60)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
},

modalCard: {
  backgroundColor: '#fff',
  width: '100%',
  maxWidth: 480,
  maxHeight: '80%',
  borderRadius: 18,
  padding: 20,
  elevation: 10,
},

modalCabecalho: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
},

identificacaoModal: {
  flex: 1,
},

nomeModal: {
  fontSize: 17,
  fontWeight: 'bold',
  color: '#17152b',
},

botaoFechar: {
  width: 32,
  height: 32,
  borderRadius: 20,
  backgroundColor: '#eee',
  alignItems: 'center',
  justifyContent: 'center',
},

textoFechar: {
  fontSize: 25,
  color: '#555',
  lineHeight: 28,
},

separador: {
  height: 1,
  backgroundColor: '#ddd',
  marginBottom: 15,
},

rotuloModal: {
  fontSize: 13,
  fontWeight: 'bold',
  color: '#8000ff',
  marginTop: 12,
  marginBottom: 4,
},

valorModal: {
  fontSize: 14,
  color: '#333',
  lineHeight: 21,
},

})
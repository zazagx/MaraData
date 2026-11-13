import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTema } from '../../../context/temaContexto';
import { adicionarJogo } from '../../../features/armazenamentoParticipantes';
import { buscarEventoPorId } from '../../../features/armazenamentoEvento';
import {
  buscarJogosJaRegistrados,
  buscarOpcoesRegistroJogos,
  registrarJogosEfetivamenteJogados,
  type OpcaoDiaRegistroJogo,
  type OpcaoJogoRegistro,
  type OpcaoRegistroJogo,
} from '../../../features/armazenamentoEstatisticas';

type EventoMinimo = { id: string; nomeEvento: string; situacao: string };

function formatarData(valor: string): string {
  const iso = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return valor;
}

export default function RegistrarJogosEventoScreen() {
  const db = useSQLiteContext();
  const { tema } = useTema();
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const idEvento = typeof eventId === 'string' ? eventId : '';

  const [evento, setEvento] = useState<EventoMinimo | null>(null);
  const [dias, setDias] = useState<OpcaoDiaRegistroJogo[]>([]);
  const [participantes, setParticipantes] = useState<OpcaoRegistroJogo[]>([]);
  const [jogos, setJogos] = useState<OpcaoJogoRegistro[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const [participanteSelecionado, setParticipanteSelecionado] = useState('');
  const [jogosSelecionados, setJogosSelecionados] = useState<string[]>([]);
  const [jogosJaRegistrados, setJogosJaRegistrados] = useState<string[]>([]);
  const [buscaParticipante, setBuscaParticipante] = useState('');
  const [buscaJogo, setBuscaJogo] = useState('');
  const [novoJogo, setNovoJogo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!idEvento) {
      setErro('Evento não identificado. Volte aos detalhes e abra esta função novamente.');
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const [eventoEncontrado, opcoes] = await Promise.all([
        buscarEventoPorId(db, idEvento),
        buscarOpcoesRegistroJogos(db, idEvento),
      ]);
      setEvento(eventoEncontrado ? {
        id: eventoEncontrado.id,
        nomeEvento: eventoEncontrado.nomeEvento,
        situacao: eventoEncontrado.situacao,
      } : null);
      setDias(opcoes.dias);
      setParticipantes(opcoes.participantes);
      setJogos(opcoes.jogos);
      setDiaSelecionado((atual) => {
        if (atual && opcoes.dias.some((dia) => dia.id === atual)) return atual;
        return opcoes.dias.find((dia) => dia.status === 'em_andamento')?.id
          ?? [...opcoes.dias].reverse().find((dia) => dia.status === 'concluido')?.id
          ?? '';
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar os dados do evento.');
    } finally {
      setCarregando(false);
    }
  }, [db, idEvento]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const participantesFiltrados = useMemo(() => {
    const termo = buscaParticipante.trim().toLocaleLowerCase('pt-BR');
    return participantes.filter((p) => p.nome.toLocaleLowerCase('pt-BR').includes(termo));
  }, [participantes, buscaParticipante]);

  const jogosFiltrados = useMemo(() => {
    const termo = buscaJogo.trim().toLocaleLowerCase('pt-BR');
    return jogos.filter((j) => j.nome.toLocaleLowerCase('pt-BR').includes(termo));
  }, [jogos, buscaJogo]);

  const nomeParticipante = participantes.find((p) => p.eventParticipantId === participanteSelecionado)?.nome;
  const diaAtual = dias.find((d) => d.id === diaSelecionado);
  const jogoNovoJaExiste = jogos.some((j) => j.nome.trim().toLocaleLowerCase('pt-BR') === novoJogo.trim().toLocaleLowerCase('pt-BR'));

  async function atualizarJogosRegistrados(eventDayId: string, eventParticipantId: string) {
    if (!eventDayId || !eventParticipantId) {
      setJogosJaRegistrados([]);
      return;
    }
    setJogosJaRegistrados(await buscarJogosJaRegistrados(db, eventDayId, eventParticipantId));
  }

  function selecionarParticipante(item: OpcaoRegistroJogo) {
    setParticipanteSelecionado(item.eventParticipantId);
    setJogosSelecionados([]);
    setMensagem('');
    void atualizarJogosRegistrados(diaSelecionado, item.eventParticipantId);
  }

  function selecionarDia(dia: OpcaoDiaRegistroJogo) {
    setDiaSelecionado(dia.id);
    setJogosSelecionados([]);
    setMensagem('');
    void atualizarJogosRegistrados(dia.id, participanteSelecionado);
  }

  function alternarJogo(id: string) {
    if (jogosJaRegistrados.includes(id)) return;
    setJogosSelecionados((atuais) => atuais.includes(id)
      ? atuais.filter((item) => item !== id)
      : [...atuais, id]);
  }

  async function cadastrarNovoJogo() {
    const nome = novoJogo.trim().replace(/\s+/g, ' ');
    if (!nome || jogoNovoJaExiste) return;
    try {
      await adicionarJogo(db, nome);
      setNovoJogo('');
      setBuscaJogo('');
      await carregar();
      setMensagem(`“${nome}” foi adicionado ao catálogo. Agora selecione-o na lista.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível adicionar o jogo.');
    }
  }

  async function salvarRegistro() {
    setErro('');
    setMensagem('');
    if (!diaSelecionado) {
      setErro('Selecione o dia em que o participante jogou.');
      return;
    }
    if (!participanteSelecionado) {
      setErro('Selecione o participante.');
      return;
    }
    if (jogosSelecionados.length === 0) {
      setErro('Selecione pelo menos um jogo efetivamente utilizado.');
      return;
    }
    setSalvando(true);
    try {
      const resultado = await registrarJogosEfetivamenteJogados(
        db, idEvento, diaSelecionado, participanteSelecionado, jogosSelecionados
      );
      setJogosSelecionados([]);
      await atualizarJogosRegistrados(diaSelecionado, participanteSelecionado);
      setMensagem(
        `${resultado.registrados} jogo(s) registrado(s).` +
        (resultado.jaRegistrados ? ` ${resultado.jaRegistrados} já estavam registrados para esse participante nesse dia.` : '') +
        ' A presença no dia também foi garantida.'
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar os jogos.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <View style={[styles.centralizado, { backgroundColor: tema.background }]}><ActivityIndicator size="large" color={tema.primary} /><Text style={{ color: tema.textSecondary, marginTop: 10 }}>Carregando evento...</Text></View>;
  }

  if (!evento) {
    return <View style={[styles.centralizado, { backgroundColor: tema.background }]}><Text style={{ color: tema.text, fontSize: 17, fontWeight: '700' }}>Evento não encontrado</Text><Pressable style={[styles.botao, { backgroundColor: tema.primary }]} onPress={() => router.back()}><Text style={styles.textoBotao}>Voltar</Text></Pressable></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.background }}>
      <Stack.Screen options={{ title: 'Registrar jogos jogados' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Ionicons name="game-controller-outline" size={28} color={tema.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.eventoNome, { color: tema.text }]}>{evento.nomeEvento}</Text>
            <Text style={[styles.eventoSub, { color: tema.textSecondary }]}>Registre os títulos que cada participante realmente utilizou.</Text>
          </View>
        </View>

        <Text style={[styles.titulo, { color: tema.text }]}>1. Selecione o dia</Text>
        {dias.length === 0 ? <Text style={[styles.vazio, { color: tema.textSecondary }]}>Este evento ainda não possui dias cadastrados.</Text> : dias.map((dia) => {
          const indisponivel = dia.status === 'nao_iniciado' || dia.status === 'nao_realizado';
          const selecionado = dia.id === diaSelecionado;
          const statusTexto = dia.status === 'em_andamento' ? 'Em andamento' : dia.status === 'concluido' ? 'Concluído' : dia.status === 'nao_realizado' ? 'Não realizado' : 'Não iniciado';
          return (
            <Pressable key={dia.id} disabled={indisponivel} onPress={() => selecionarDia(dia)} style={[styles.opcao, { backgroundColor: selecionado ? tema.activeBackground : tema.surface, borderColor: selecionado ? tema.primary : tema.border, opacity: indisponivel ? 0.45 : 1 }]}>
              <View style={{ flex: 1 }}><Text style={[styles.opcaoTitulo, { color: tema.text }]}>Dia {dia.numero} • {formatarData(dia.data)}</Text><Text style={[styles.opcaoSub, { color: tema.textSecondary }]}>{statusTexto}</Text></View>
              {selecionado && <Ionicons name="checkmark-circle" size={22} color={tema.primary} />}
            </Pressable>
          );
        })}

        <Text style={[styles.titulo, { color: tema.text, marginTop: 22 }]}>2. Selecione o participante</Text>
        <TextInput value={buscaParticipante} onChangeText={setBuscaParticipante} placeholder="Buscar participante pelo nome" placeholderTextColor={tema.textSecondary} style={[styles.input, { backgroundColor: tema.surface, color: tema.text, borderColor: tema.border }]} />
        {nomeParticipante ? <Text style={[styles.selecaoAtual, { color: tema.primary }]}>Selecionado: {nomeParticipante}</Text> : null}
        <View style={styles.listaOpcoes}>
          {participantesFiltrados.slice(0, 30).map((item) => {
            const selecionado = item.eventParticipantId === participanteSelecionado;
            return <Pressable key={item.eventParticipantId} onPress={() => selecionarParticipante(item)} style={[styles.chip, { backgroundColor: selecionado ? tema.activeBackground : tema.surface, borderColor: selecionado ? tema.primary : tema.border }]}><Text style={{ color: tema.text, fontSize: 13 }}>{selecionado ? '✓ ' : ''}{item.nome}</Text></Pressable>;
          })}
          {participantesFiltrados.length === 0 && <Text style={[styles.vazio, { color: tema.textSecondary }]}>Nenhum participante encontrado.</Text>}
          {participantesFiltrados.length > 30 && <Text style={[styles.ajuda, { color: tema.textSecondary }]}>Mostrando os primeiros 30 resultados. Refine a busca pelo nome.</Text>}
        </View>

        <Text style={[styles.titulo, { color: tema.text, marginTop: 22 }]}>3. Marque os jogos que ele realmente jogou</Text>
        <TextInput value={buscaJogo} onChangeText={setBuscaJogo} placeholder="Buscar jogo no catálogo" placeholderTextColor={tema.textSecondary} style={[styles.input, { backgroundColor: tema.surface, color: tema.text, borderColor: tema.border }]} />
        <View style={styles.listaOpcoes}>
          {jogosFiltrados.map((jogo) => {
            const jaRegistrado = jogosJaRegistrados.includes(jogo.id);
            const selecionado = jogosSelecionados.includes(jogo.id);
            return <Pressable key={jogo.id} disabled={jaRegistrado} onPress={() => alternarJogo(jogo.id)} style={[styles.chip, { backgroundColor: jaRegistrado ? tema.surfaceSecondary : selecionado ? tema.activeBackground : tema.surface, borderColor: selecionado ? tema.primary : tema.border, opacity: jaRegistrado ? 0.55 : 1 }]}><Text style={{ color: tema.text, fontSize: 13 }}>{jaRegistrado ? '✓ Já registrado: ' : selecionado ? '✓ ' : '+ '}{jogo.nome}</Text></Pressable>;
          })}
          {jogosFiltrados.length === 0 && <Text style={[styles.vazio, { color: tema.textSecondary }]}>Nenhum jogo encontrado no catálogo.</Text>}
        </View>
        <View style={[styles.adicionarJogo, { borderColor: tema.border }]}>
          <Text style={[styles.ajuda, { color: tema.textSecondary }]}>O título não está no catálogo?</Text>
          <TextInput value={novoJogo} onChangeText={setNovoJogo} placeholder="Nome do novo jogo" placeholderTextColor={tema.textSecondary} style={[styles.input, { backgroundColor: tema.surface, color: tema.text, borderColor: tema.border }]} />
          <Pressable disabled={!novoJogo.trim() || jogoNovoJaExiste} onPress={() => void cadastrarNovoJogo()} style={[styles.botaoSecundario, { borderColor: tema.primary, opacity: !novoJogo.trim() || jogoNovoJaExiste ? 0.45 : 1 }]}><Text style={{ color: tema.primary, fontWeight: '700' }}>Adicionar ao catálogo</Text></Pressable>
        </View>

        {jogosSelecionados.length > 0 && <Text style={[styles.selecaoAtual, { color: tema.primary }]}>{jogosSelecionados.length} jogo(s) selecionado(s)</Text>}
        {mensagem !== '' && <Text style={[styles.mensagem, { color: '#16834A', backgroundColor: tema.surfaceSecondary }]}>{mensagem}</Text>}
        {erro !== '' && <Text style={[styles.mensagem, { color: '#D92D45', backgroundColor: tema.surfaceSecondary }]}>{erro}</Text>}
        <Text style={[styles.nota, { color: tema.textSecondary }]}>Ao registrar um jogo, o MaraData também garante que o participante esteja marcado como presente naquele dia. O mesmo jogo não pode ser registrado duas vezes para a mesma pessoa no mesmo dia.</Text>

        <Pressable disabled={salvando || !diaAtual || !participanteSelecionado || jogosSelecionados.length === 0} onPress={() => void salvarRegistro()} style={[styles.botao, { backgroundColor: tema.primary, opacity: salvando || !diaAtual || !participanteSelecionado || jogosSelecionados.length === 0 ? 0.5 : 1 }]}>
          {salvando ? <ActivityIndicator color={tema.primaryText} /> : <Ionicons name="save-outline" size={19} color={tema.primaryText} />}
          <Text style={[styles.textoBotao, { color: tema.primaryText }]}>{salvando ? 'Salvando...' : 'Salvar jogos jogados'}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.voltar}><Text style={{ color: tema.textSecondary, fontWeight: '600' }}>Voltar aos detalhes do evento</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 36, maxWidth: 760, width: '100%', alignSelf: 'center' },
  centralizado: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 22 },
  eventoNome: { fontSize: 18, fontWeight: '800' },
  eventoSub: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  titulo: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  opcao: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 8 },
  opcaoTitulo: { fontSize: 14, fontWeight: '700' },
  opcaoSub: { fontSize: 12, marginTop: 3 },
  input: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, marginBottom: 9 },
  selecaoAtual: { fontSize: 13, fontWeight: '700', marginVertical: 8 },
  listaOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, maxWidth: '100%' },
  vazio: { paddingVertical: 10, fontSize: 13 },
  ajuda: { fontSize: 12, lineHeight: 18 },
  adicionarJogo: { borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 15 },
  botaoSecundario: { borderWidth: 1, borderRadius: 10, alignItems: 'center', padding: 12 },
  mensagem: { padding: 12, borderRadius: 10, marginTop: 13, fontSize: 13, lineHeight: 19 },
  nota: { fontSize: 12, lineHeight: 18, marginTop: 17 },
  botao: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 15, borderRadius: 12, marginTop: 18 },
  textoBotao: { fontSize: 15, fontWeight: '800' },
  voltar: { alignItems: 'center', padding: 15, marginTop: 5 },
});

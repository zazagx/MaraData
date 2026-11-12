import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTema } from '../../../context/temaContexto';
import { useEstilosTema } from '../../../context/temaEstilos';
import { salvarFila } from '../../../features/armazenamentofilas';

export default function CriarFila() {
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const router = useRouter();
  const params = useLocalSearchParams<{
    nomeEvento?: string;
    localEvento?: string;
    situacao?: string;
  }>();
  const [nome, setNome] = useState('');
  const [erroNome, setErroNome] = useState('');

  const nomeEvento = params.nomeEvento || '';
  const localEvento = params.localEvento || '';
const situacaoEvento = String(params.situacao || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_');

const eventoAtivo =
  situacaoEvento === 'em_andamento' &&
  nomeEvento.trim() !== '' &&
  localEvento.trim() !== '';
  function cadastrarFila() {
    if (!eventoAtivo) return;
    if (nome.trim() === '') {
      setErroNome('Digite o nome da fila.');
      return;
    }

    const novaFila = salvarFila({
      nome: nome.trim(),
      evento: nomeEvento,
      localEvento,
    });

    router.replace({ pathname: '/filas/gerenciarfilas', params: { filaId: novaFila.id } });
  }

  return (
    <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      <View style={styles.formulario}>
        <Text style={styles.titulo}>Nova fila</Text>
        <Text style={styles.descricao}>Crie uma fila vinculada ao evento em andamento.</Text>

        <Text style={styles.label}>Evento relacionado</Text>
        <View style={styles.cardEvento}>
          <Text style={styles.nomeEvento}>{nomeEvento || 'Nenhum evento selecionado'}</Text>
          <Text style={styles.localEvento}>{localEvento || 'Abra esta tela pelos detalhes de um evento em andamento.'}</Text>
          {!eventoAtivo && <Text style={styles.erroEvento}>É necessário selecionar um evento com situação “Em andamento”.</Text>}
        </View>

        <Text style={styles.label}>Nome da fila</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: Console, Just Dance..."
          placeholderTextColor={tema.textSecondary}
          value={nome}
          onChangeText={(texto) => { setNome(texto); setErroNome(''); }}
        />
        {erroNome !== '' && <Text style={styles.textoErro}>{erroNome}</Text>}

        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>A fila será criada como ativa e poderá receber participantes cadastrados.</Text>
        </View>

        <Pressable style={[styles.botao, !eventoAtivo && styles.botaoDesabilitado]} onPress={cadastrarFila} disabled={!eventoAtivo}>
          <Text style={styles.textoBotao}>Criar fila</Text>
        </Pressable>
        <Pressable style={styles.botaoCancelar} onPress={() => router.back()}>
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const estilosBase = StyleSheet.create({
  conteudo: { flexGrow: 1, backgroundColor: '#f1f1f1', padding: 20 },
  formulario: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingVertical: 15 },
  titulo: { fontSize: 23, fontWeight: 'bold', color: '#25234c', marginBottom: 8 },
  descricao: { fontSize: 14, color: '#666', marginBottom: 25 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#25234c', marginBottom: 10, marginTop: 15 },
  cardEvento: { backgroundColor: '#eee5ff', padding: 15, borderRadius: 10 },
  nomeEvento: { color: '#25234c', fontSize: 15, fontWeight: 'bold' },
  localEvento: { color: '#666', fontSize: 13, marginTop: 5 },
  erroEvento: { color: '#D92D45', fontSize: 12, marginTop: 9, lineHeight: 18 },
  input: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#dddddd', fontSize: 15, color: '#222222' },
  textoErro: { color: '#ff002f', fontSize: 13, marginTop: 5 },
  aviso: { backgroundColor: '#eee5ff', padding: 15, borderRadius: 10, marginTop: 25 },
  avisoTexto: { color: '#5c3290', fontSize: 13, lineHeight: 20 },
  botao: { backgroundColor: '#8000ff', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 25 },
  botaoDesabilitado: { opacity: 0.45 },
  textoBotao: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  botaoCancelar: { padding: 15, alignItems: 'center', marginTop: 5 },
  textoCancelar: { color: '#666666', fontSize: 15, fontWeight: 'bold' },
});
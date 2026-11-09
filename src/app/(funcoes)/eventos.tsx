import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Use the same native date picker used in the participant form.
// On web, dates are entered manually as DD/MM/AAAA.
const DatePickerModule: any = Platform.OS === 'web'
  ? null
  : require('@react-native-community/datetimepicker');

const DateTimePicker = DatePickerModule?.default;
const DateTimePickerAndroid = DatePickerModule?.DateTimePickerAndroid;

type CampoData = 'inicio' | 'termino';

export default function Eventos() {
  // Estados dos campos do formulário
  const [nomeEvento, setNomeEvento] = useState('');
  const [localEvento, setLocalEvento] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioTermino, setHorarioTermino] = useState('');
  const [descricao, setDescricao] = useState('');
  const [situacao, setSituacao] = useState<'agendado' | 'em_andamento'>('agendado');

  // Estado para controlar os erros de validação
  const [erros, setErros] = useState<{ [key: string]: string | boolean }>({});

  // Estados do calendário visual
  const [calendarioVisivel, setCalendarioVisivel] = useState(false);
  const [campoDataAtivo, setCampoDataAtivo] = useState<CampoData>('inicio');
  const [dataTemporaria, setDataTemporaria] = useState(new Date());

  // Formatação com Máscara de Data (DD/MM/AAAA)
  const formatarData = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, '');
    const numerosLimitados = apenasNumeros.slice(0, 8);

    if (numerosLimitados.length <= 2) return numerosLimitados;
    if (numerosLimitados.length <= 4)
      return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2)}`;
    return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2, 4)}/${numerosLimitados.slice(4)}`;
  };

  // Formatação com Máscara de Horário (HH:MM)
  const formatarHorario = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, '');
    const numerosLimitados = apenasNumeros.slice(0, 4);

    if (numerosLimitados.length <= 2) return numerosLimitados;
    return `${numerosLimitados.slice(0, 2)}:${numerosLimitados.slice(2)}`;
  };

  // Ajuste do horário ao sair do campo
  const handleBlurHorario = (
    horarioAtual: string,
    setHora: (val: string) => void
  ) => {
    if (horarioAtual.length === 1 || horarioAtual.length === 2) {
      setHora(`${horarioAtual.padStart(2, '0')}:00`);
    } else if (horarioAtual.length === 3) {
      setHora(`0${horarioAtual[0]}:${horarioAtual[1]}${horarioAtual[2]}`);
    }
  };

  // Validação de horário
  const validarHorarioValido = (horarioStr: string) => {
    if (horarioStr.length < 5) return false;
    const [horas, minutos] = horarioStr.split(':').map(Number);
    return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
  };

  // Validação de Data Real
  const validarDataValida = (dataStr: string) => {
    if (dataStr.length < 10) return false;
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 2024 || ano > 2100) return false;

    const dataObj = new Date(ano, mes - 1, dia);
    return (
      dataObj.getFullYear() === ano &&
      dataObj.getMonth() === mes - 1 &&
      dataObj.getDate() === dia
    );
  };

  // Conversão de DD/MM/AAAA para Date
  const converterParaData = (dataStr: string) => {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  // Conversão de HH:MM para Minutos
  const converterParaMinutos = (horarioStr: string) => {
    const [horas, minutos] = horarioStr.split(':').map(Number);
    return horas * 60 + minutos;
  };

  // Converts a local Date to YYYY-MM-DD without timezone conversion.
  const dataParaISO = (data: Date) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  // Converts YYYY-MM-DD into a local Date.
  const ISOParaData = (valor: string) => {
    const [ano, mes, dia] = valor.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  // Converts DD/MM/YYYY into YYYY-MM-DD for reliable date comparisons.
  const converterParaFormatoCalendario = (dataStr: string) => {
    if (!validarDataValida(dataStr)) {
      return dataParaISO(new Date());
    }

    const [dia, mes, ano] = dataStr.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  // Today's date in local YYYY-MM-DD format.
  const obterHojeCalendario = () => dataParaISO(new Date());

  // Start cannot be before today. End cannot be before today or the start date.
  const obterDataMinimaISO = (campo: CampoData) => {
    const hoje = obterHojeCalendario();

    if (campo === 'inicio') return hoje;

    if (validarDataValida(dataInicio)) {
      const inicioISO = converterParaFormatoCalendario(dataInicio);
      return inicioISO > hoje ? inicioISO : hoje;
    }

    return hoje;
  };

  const obterDataMinima = (campo: CampoData) => {
    return ISOParaData(obterDataMinimaISO(campo));
  };

  // Gets the current value for the selected field, or its minimum date.
  const obterDataInicial = (campo: CampoData) => {
    const valorAtual = campo === 'inicio' ? dataInicio : dataTermino;
    const valorISO = validarDataValida(valorAtual)
      ? converterParaFormatoCalendario(valorAtual)
      : obterDataMinimaISO(campo);

    const minimoISO = obterDataMinimaISO(campo);
    return ISOParaData(valorISO < minimoISO ? minimoISO : valorISO);
  };

  // Applies a selected date to the appropriate field.
  const selecionarData = (dataSelecionada: Date) => {
    const dataISO = dataParaISO(dataSelecionada);

    // Extra check so dates before the minimum are never accepted.
    if (dataISO < obterDataMinimaISO(campoDataAtivo)) return;

    const dataFormatada = `${String(dataSelecionada.getDate()).padStart(2, '0')}/${String(
      dataSelecionada.getMonth() + 1
    ).padStart(2, '0')}/${dataSelecionada.getFullYear()}`;

    if (campoDataAtivo === 'inicio') {
      setDataInicio(dataFormatada);
      setErros((anteriores) => ({ ...anteriores, dataInicio: false }));
    } else {
      setDataTermino(dataFormatada);
      setErros((anteriores) => ({ ...anteriores, dataTermino: false }));
    }

    setCalendarioVisivel(false);
  };

  // Opens Android's native dialog or the iOS wheel picker modal.
  const abrirCalendario = (campo: CampoData) => {
    setCampoDataAtivo(campo);

    const valorInicial = obterDataInicial(campo);
    const dataMinima = obterDataMinima(campo);

    if (Platform.OS === 'android' && DateTimePickerAndroid) {
      DateTimePickerAndroid.open({
        value: valorInicial,
        mode: 'date',
        display: 'default',
        minimumDate: dataMinima,
        onChange: (evento: { type: string }, dataSelecionada?: Date) => {
          if (evento.type === 'set' && dataSelecionada) {
            selecionarData(dataSelecionada);
          }
        },
      });

      return;
    }

    if (Platform.OS === 'ios') {
      setDataTemporaria(valorInicial);
      setCalendarioVisivel(true);
    }
  };

  // Web fallback: manually type DD/MM/AAAA, just like the participant form.
  const alterarDataWeb = (campo: CampoData, texto: string) => {
    const dataFormatada = formatarData(texto);

    if (campo === 'inicio') {
      setDataInicio(dataFormatada);
      setErros((anteriores) => ({ ...anteriores, dataInicio: false }));
    } else {
      setDataTermino(dataFormatada);
      setErros((anteriores) => ({ ...anteriores, dataTermino: false }));
    }
  };

  // Validação e cadastro do evento
  const handleCadastrar = () => {
    const novosErros: { [key: string]: string | boolean } = {};

    // 1. Validação dos campos OBRIGATÓRIOS
    if (!nomeEvento.trim()) novosErros.nomeEvento = 'Campo obrigatório';
    if (!localEvento.trim()) novosErros.localEvento = 'Campo obrigatório';

    // Data de início
    if (!dataInicio) {
      novosErros.dataInicio = 'Data obrigatória';
    } else if (!validarDataValida(dataInicio)) {
      novosErros.dataInicio = 'Data inválida';
    } else if (converterParaFormatoCalendario(dataInicio) < obterHojeCalendario()) {
      novosErros.dataInicio = 'A data de início não pode ser anterior a hoje';
    }

    // Horário de início
    if (!horarioInicio) {
      novosErros.horarioInicio = 'Hora obrigatória';
    } else if (!validarHorarioValido(horarioInicio)) {
      novosErros.horarioInicio = 'Hora inválida (00:00 a 23:59)';
    }

    // 2. Validação dos campos OPCIONAIS
    if (dataTermino.length > 0) {
      if (!validarDataValida(dataTermino)) {
        novosErros.dataTermino = 'Data inválida';
      } else if (converterParaFormatoCalendario(dataTermino) < obterHojeCalendario()) {
        novosErros.dataTermino = 'A data de término não pode ser anterior a hoje';
      }
    }

    if (horarioTermino.length > 0) {
      if (!validarHorarioValido(horarioTermino)) {
        novosErros.horarioTermino = 'Hora inválida (00:00 a 23:59)';
      }
    }

    // 3. Validação de Coerência Lógica (Início vs Término)
    if (
      validarDataValida(dataInicio) &&
      dataTermino.length === 10 &&
      validarDataValida(dataTermino)
    ) {
      const dInicio = converterParaData(dataInicio);
      const dTermino = converterParaData(dataTermino);

      if (dTermino < dInicio) {
        novosErros.dataTermino = 'Término não pode ser antes do início';
      }
    }

    if (
      validarHorarioValido(horarioInicio) &&
      horarioTermino.length === 5 &&
      validarHorarioValido(horarioTermino)
    ) {
      const mesmoDia = !dataTermino || dataInicio === dataTermino;
      if (mesmoDia) {
        const mInicio = converterParaMinutos(horarioInicio);
        const mTermino = converterParaMinutos(horarioTermino);

        if (mTermino <= mInicio) {
          novosErros.horarioTermino = 'Horário deve ser após o de início';
        }
      }
    }

    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      Alert.alert(
        'Dados Incompletos ou Incorretos',
        'Por favor, corrija os campos em vermelho antes de cadastrar.'
      );
      return;
    }

    Alert.alert('Sucesso!', 'Evento cadastrado com sucesso.', [
    {
      text: 'OK',
      onPress: () => {
      router.push({
        pathname: "/(funcoes)/eventos/detalhes",
        params: {
          nomeEvento: nomeEvento,
          localEvento: localEvento,
          dataInicio: dataInicio,
          dataTermino: dataTermino,
          horarioInicio: horarioInicio,
          horarioTermino: horarioTermino,
          descricao: descricao,
          situacao: situacao,
        },
      });
    },
  },
]);
}

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Cabeçalho */}
          <View style={styles.topSection}>
            <Ionicons name="game-controller-outline" size={56} color="#000" />
            <Text style={styles.title}>Nome do Evento</Text>
            <Text style={styles.subtitle}>Preencha os dados do evento</Text>
          </View>

          {/* Campo: Nome do Evento */}
          <Text style={styles.label}>
            Nome do Evento <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, !!erros.nomeEvento && styles.inputError]}
            placeholder="Ex: Arena Gamer São Luís"
            placeholderTextColor="#999"
            value={nomeEvento}
            onChangeText={(text) => {
              setNomeEvento(text);
              if (erros.nomeEvento) setErros({ ...erros, nomeEvento: false });
            }}
          />
          {erros.nomeEvento && <Text style={styles.errorText}>{String(erros.nomeEvento)}</Text>}

          {/* Campo: Local do Evento */}
          <Text style={styles.label}>
            Local do evento <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, !!erros.localEvento && styles.inputError]}
            placeholder="Ex: Arena Gamer São Luís"
            placeholderTextColor="#999"
            value={localEvento}
            onChangeText={(text) => {
              setLocalEvento(text);
              if (erros.localEvento) setErros({ ...erros, localEvento: false });
            }}
          />
          {erros.localEvento && <Text style={styles.errorText}>{String(erros.localEvento)}</Text>}

          {/* Linha 1: Datas */}
          <View style={styles.row}>
            {/* Data de Início */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>
                Data de início <Text style={styles.requiredStar}>*</Text>
              </Text>

              {Platform.OS === 'web' ? (
                <View style={[styles.inputWithIcon, !!erros.dataInicio && styles.inputError]}>
                  <TextInput
                    style={styles.flexInput}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                    value={dataInicio}
                    onChangeText={(text) => alterarDataWeb('inicio', text)}
                  />
                  <Ionicons name="calendar-outline" size={20} color="#8000FF" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.inputWithIcon, !!erros.dataInicio && styles.inputError]}
                  onPress={() => abrirCalendario('inicio')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar data de início"
                >
                  <Text
                    style={[styles.flexInput, !dataInicio && styles.datePlaceholder]}
                    numberOfLines={1}
                  >
                    {dataInicio || 'DD/MM/AAAA'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#8000FF" />
                </TouchableOpacity>
              )}

              {erros.dataInicio && <Text style={styles.errorText}>{String(erros.dataInicio)}</Text>}
            </View>

            {/* Data de Término */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Data de término</Text>

              {Platform.OS === 'web' ? (
                <View style={[styles.inputWithIcon, !!erros.dataTermino && styles.inputError]}>
                  <TextInput
                    style={styles.flexInput}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    maxLength={10}
                    value={dataTermino}
                    onChangeText={(text) => alterarDataWeb('termino', text)}
                  />
                  <Ionicons name="calendar-outline" size={20} color="#8000FF" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.inputWithIcon, !!erros.dataTermino && styles.inputError]}
                  onPress={() => abrirCalendario('termino')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Selecionar data de término"
                >
                  <Text
                    style={[styles.flexInput, !dataTermino && styles.datePlaceholder]}
                    numberOfLines={1}
                  >
                    {dataTermino || 'DD/MM/AAAA'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#8000FF" />
                </TouchableOpacity>
              )}

              {erros.dataTermino && <Text style={styles.errorText}>{String(erros.dataTermino)}</Text>}
            </View>
          </View>

          {/* Linha 2: Horários */}
          <View style={styles.row}>
            {/* Horário de Início */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>
                Horário de início <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputWithIcon, !!erros.horarioInicio && styles.inputError]}>
                <TextInput
                  style={styles.flexInput}
                  placeholder="00:00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5}
                  value={horarioInicio}
                  onChangeText={(text) => {
                    setHorarioInicio(formatarHorario(text));
                    if (erros.horarioInicio) setErros({ ...erros, horarioInicio: false });
                  }}
                  onBlur={() => handleBlurHorario(horarioInicio, setHorarioInicio)}
                />
                <Ionicons name="time-outline" size={20} color="#555" />
              </View>
              {erros.horarioInicio && <Text style={styles.errorText}>{String(erros.horarioInicio)}</Text>}
            </View>

            {/* Horário de Término */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Horário de término</Text>
              <View style={[styles.inputWithIcon, !!erros.horarioTermino && styles.inputError]}>
                <TextInput
                  style={styles.flexInput}
                  placeholder="00:00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5}
                  value={horarioTermino}
                  onChangeText={(text) => {
                    setHorarioTermino(formatarHorario(text));
                    if (erros.horarioTermino) setErros({ ...erros, horarioTermino: false });
                  }}
                  onBlur={() => handleBlurHorario(horarioTermino, setHorarioTermino)}
                />
                <Ionicons name="time-outline" size={20} color="#555" />
              </View>
              {erros.horarioTermino && <Text style={styles.errorText}>{String(erros.horarioTermino)}</Text>}
            </View>
          </View>

          {/* Campo: Descrição */}
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Informações adicionais sobre o evento"
            placeholderTextColor="#999"
            value={descricao}
            onChangeText={setDescricao}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Seleção de Situação */}
          <Text style={styles.label}>Situação do evento</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusChip, situacao === 'agendado' && styles.statusActiveChip]}
              onPress={() => setSituacao('agendado')}
            >
              <Ionicons
                name={situacao === 'agendado' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={situacao === 'agendado' ? '#FFF' : '#666'}
              />
              <Text style={[styles.statusText, situacao === 'agendado' && styles.statusActiveText]}>
                Agendado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusChip, situacao === 'em_andamento' && styles.statusActiveChip]}
              onPress={() => setSituacao('em_andamento')}
            >
              <Ionicons
                name={situacao === 'em_andamento' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={situacao === 'em_andamento' ? '#FFF' : '#666'}
              />
              <Text style={[styles.statusText, situacao === 'em_andamento' && styles.statusActiveText]}>
                Em andamento
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar}>
            <Text style={styles.primaryButtonText}>Cadastrar evento</Text>
          </TouchableOpacity>

          {/* Botão Cancelar */}
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS native date picker modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={calendarioVisivel}
          transparent
          animationType="slide"
          onRequestClose={() => setCalendarioVisivel(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setCalendarioVisivel(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar seletor de data"
            />

            <View style={styles.calendarSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {campoDataAtivo === 'inicio' ? 'Data de início' : 'Data de término'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Selecione a data do evento
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setCalendarioVisivel(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {DateTimePicker && (
                <DateTimePicker
                  value={dataTemporaria}
                  mode="date"
                  display="spinner"
                  locale="pt-BR"
                  minimumDate={obterDataMinima(campoDataAtivo)}
                  themeVariant="light"
                  textColor="#222222"
                  onChange={(_evento: any, dataSelecionada?: Date) => {
                    if (dataSelecionada) {
                      setDataTemporaria(dataSelecionada);
                    }
                  }}
                />
              )}

              <View style={styles.acoesCalendario}>
                <TouchableOpacity
                  style={styles.calendarCancelButton}
                  onPress={() => setCalendarioVisivel(false)}
                >
                  <Text style={styles.calendarCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calendarConfirmButton}
                  onPress={() => selecionarData(dataTemporaria)}
                >
                  <Text style={styles.calendarConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 14,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  inputWithIcon: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  flexInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  datePlaceholder: {
    color: '#999999',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  statusActiveChip: {
    backgroundColor: '#8000FF',
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  statusActiveText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#8000FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do modal do seletor nativo no iOS
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  calendarSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171717',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 5,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoesCalendario: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  calendarCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8000FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8000FF',
  },
  calendarConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#8000FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarConfirmText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Eventos() {
  // Estados dos campos do formulário
  const [nomeEvento, setNomeEvento] = useState('');
  const [localEvento, setLocalEvento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [situacao, setSituacao] = useState<'agendado' | 'em_andamento'>('agendado');

  // Estados de Datas e Horários como objetos Date
  const [dataInicio, setDataInicio] = useState<Date | null>(null);
  const [dataTermino, setDataTermino] = useState<Date | null>(null);
  const [horarioInicio, setHorarioInicio] = useState<Date | null>(null);
  const [horarioTermino, setHorarioTermino] = useState<Date | null>(null);

  // Controle de visibilidade dos Pickers
  const [pickerVisible, setPickerVisible] = useState<{
    type: 'date' | 'time';
    field: 'dataInicio' | 'dataTermino' | 'horarioInicio' | 'horarioTermino';
  } | null>(null);

  // Estado para controlar os erros de validação
  const [erros, setErros] = useState<{ [key: string]: string | boolean }>({});

  // Auxiliares de Formatação para exibição na tela
  const formatarDataExibicao = (date: Date | null) => {
    if (!date) return '';
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarHorarioExibicao = (date: Date | null) => {
    if (!date) return '';
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  // Manipulador de mudança dos Pickers
  const onChangePicker = (event: any, selectedDate?: Date) => {
    const currentField = pickerVisible?.field;
    setPickerVisible(null); // Fecha o picker no Android

    if (event.type === 'set' && selectedDate && currentField) {
      if (currentField === 'dataInicio') {
        setDataInicio(selectedDate);
        if (erros.dataInicio) setErros({ ...erros, dataInicio: false });
      } else if (currentField === 'dataTermino') {
        setDataTermino(selectedDate);
        if (erros.dataTermino) setErros({ ...erros, dataTermino: false });
      } else if (currentField === 'horarioInicio') {
        setHorarioInicio(selectedDate);
        if (erros.horarioInicio) setErros({ ...erros, horarioInicio: false });
      } else if (currentField === 'horarioTermino') {
        setHorarioTermino(selectedDate);
        if (erros.horarioTermino) setErros({ ...erros, horarioTermino: false });
      }
    }
  };

  // Função de Validação e Envio
  const handleCadastrar = () => {
    const novosErros: { [key: string]: string | boolean } = {};

    // 1. Validação dos campos OBRIGATÓRIOS
    if (!nomeEvento.trim()) novosErros.nomeEvento = 'Campo obrigatório';
    if (!localEvento.trim()) novosErros.localEvento = 'Campo obrigatório';
    if (!dataInicio) novosErros.dataInicio = 'Data de início obrigatória';
    if (!horarioInicio) novosErros.horarioInicio = 'Horário de início obrigatório';

    // 2. Validação de COERÊNCIA LÓGICA (Datas)
    if (dataInicio && dataTermino) {
      // Zera as horas para comparar apenas os dias
      const dInicio = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
      const dTermino = new Date(dataTermino.getFullYear(), dataTermino.getMonth(), dataTermino.getDate());

      if (dTermino < dInicio) {
        novosErros.dataTermino = 'A data de término não pode ser anterior à de início';
      }
    }

    // 3. Validação de COERÊNCIA LÓGICA (Horários no mesmo dia)
    if (dataInicio && horarioInicio && horarioTermino) {
      const mesmoDia =
        !dataTermino ||
        (dataInicio.getFullYear() === dataTermino.getFullYear() &&
          dataInicio.getMonth() === dataTermino.getMonth() &&
          dataInicio.getDate() === dataTermino.getDate());

      if (mesmoDia) {
        const mInicio = horarioInicio.getHours() * 60 + horarioInicio.getMinutes();
        const mTermino = horarioTermino.getHours() * 60 + horarioTermino.getMinutes();

        if (mTermino <= mInicio) {
          novosErros.horarioTermino = 'O horário de término deve ser após o de início';
        }
      }
    }

    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      Alert.alert(
        'Verifique os dados',
        'Existem campos obrigatórios ou incorretos destacados em vermelho.'
      );
      return;
    }

    Alert.alert('Sucesso!', 'Evento cadastrado com sucesso.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 90 : 0}
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
              <TouchableOpacity
                style={[styles.inputWithIcon, !!erros.dataInicio && styles.inputError]}
                onPress={() => setPickerVisible({ type: 'date', field: 'dataInicio' })}
              >
                <Text style={dataInicio ? styles.inputText : styles.placeholderText}>
                  {formatarDataExibicao(dataInicio) || 'DD/MM/AAAA'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </TouchableOpacity>
              {erros.dataInicio && <Text style={styles.errorText}>{String(erros.dataInicio)}</Text>}
            </View>

            {/* Data de Término */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Data de término</Text>
              <TouchableOpacity
                style={[styles.inputWithIcon, !!erros.dataTermino && styles.inputError]}
                onPress={() => setPickerVisible({ type: 'date', field: 'dataTermino' })}
              >
                <Text style={dataTermino ? styles.inputText : styles.placeholderText}>
                  {formatarDataExibicao(dataTermino) || 'DD/MM/AAAA'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.inputWithIcon, !!erros.horarioInicio && styles.inputError]}
                onPress={() => setPickerVisible({ type: 'time', field: 'horarioInicio' })}
              >
                <Text style={horarioInicio ? styles.inputText : styles.placeholderText}>
                  {formatarHorarioExibicao(horarioInicio) || '00:00'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#555" />
              </TouchableOpacity>
              {erros.horarioInicio && <Text style={styles.errorText}>{String(erros.horarioInicio)}</Text>}
            </View>

            {/* Horário de Término */}
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Horário de término</Text>
              <TouchableOpacity
                style={[styles.inputWithIcon, !!erros.horarioTermino && styles.inputError]}
                onPress={() => setPickerVisible({ type: 'time', field: 'horarioTermino' })}
              >
                <Text style={horarioTermino ? styles.inputText : styles.placeholderText}>
                  {formatarHorarioExibicao(horarioTermino) || '00:00'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#555" />
              </TouchableOpacity>
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

      {/* RENDERIZAÇÃO DO PICKER NATIVO DE DATA E HORA */}
      {pickerVisible && (
        <DateTimePicker
          value={
            pickerVisible.field === 'dataInicio'
              ? dataInicio || new Date()
              : pickerVisible.field === 'dataTermino'
              ? dataTermino || new Date()
              : pickerVisible.field === 'horarioInicio'
              ? horarioInicio || new Date()
              : horarioTermino || new Date()
          }
          mode={pickerVisible.type}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangePicker}
        />
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
  inputText: {
    fontSize: 14,
    color: '#000',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
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
});
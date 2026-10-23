import { Ionicons } from '@expo/vector-icons';
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
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioTermino, setHorarioTermino] = useState('');
  const [descricao, setDescricao] = useState('');
  const [situacao, setSituacao] = useState<'agendado' | 'em_andamento'>('agendado');

  // Estado para controlar os erros de validação
  const [erros, setErros] = useState<{ [key: string]: boolean }>({});

  // Formatação de Data (DD/MM/AAAA)
  const formatarData = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, '');
    const numerosLimitados = apenasNumeros.slice(0, 8);

    if (numerosLimitados.length <= 2) return numerosLimitados;
    if (numerosLimitados.length <= 4)
      return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2)}`;
    return `${numerosLimitados.slice(0, 2)}/${numerosLimitados.slice(2, 4)}/${numerosLimitados.slice(4)}`;
  };

  // Formatação de Horário (HH:MM)
  const formatarHorario = (text: string) => {
    const apenasNumeros = text.replace(/\D/g, '');
    const numerosLimitados = apenasNumeros.slice(0, 4);

    if (numerosLimitados.length <= 2) return numerosLimitados;
    return `${numerosLimitados.slice(0, 2)}:${numerosLimitados.slice(2)}`;
  };

  // Função de Validação e Envio
  const handleCadastrar = () => {
    const novosErros: { [key: string]: boolean } = {};

    // 1. Validação dos campos OBRIGATÓRIOS
    if (!nomeEvento.trim()) novosErros.nomeEvento = true;
    if (!localEvento.trim()) novosErros.localEvento = true;
    if (dataInicio.length < 10) novosErros.dataInicio = true;
    if (horarioInicio.length < 5) novosErros.horarioInicio = true;

    // 2. Validação dos campos OPCIONAIS (só valida se o utilizador digitou algo)
    if (dataTermino.length > 0 && dataTermino.length < 10) {
      novosErros.dataTermino = true;
    }
    if (horarioTermino.length > 0 && horarioTermino.length < 5) {
      novosErros.horarioTermino = true;
    }

    // Atualiza o estado de erros
    setErros(novosErros);

    // Se houver algum erro, impede o cadastro e exibe alerta
    if (Object.keys(novosErros).length > 0) {
      Alert.alert(
        'Atenção',
        'Por favor, preencha corretamente todos os campos destacados em vermelho.'
      );
      return;
    }

    // Sucesso! Dados validados
    Alert.alert('Sucesso!', 'Evento cadastrado com sucesso.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleCancelar = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
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
            style={[styles.input, erros.nomeEvento && styles.inputError]}
            placeholder="Ex: Arena Gamer São Luís"
            placeholderTextColor="#999"
            value={nomeEvento}
            onChangeText={(text) => {
              setNomeEvento(text);
              if (erros.nomeEvento) setErros({ ...erros, nomeEvento: false });
            }}
          />
          {erros.nomeEvento && (
            <Text style={styles.errorText}>Campo obrigatório</Text>
          )}

          {/* Campo: Local do Evento */}
          <Text style={styles.label}>
            Local do evento <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, erros.localEvento && styles.inputError]}
            placeholder="Ex: Arena Gamer São Luís"
            placeholderTextColor="#999"
            value={localEvento}
            onChangeText={(text) => {
              setLocalEvento(text);
              if (erros.localEvento) setErros({ ...erros, localEvento: false });
            }}
          />
          {erros.localEvento && (
            <Text style={styles.errorText}>Campo obrigatório</Text>
          )}

          {/* Linha 1: Datas */}
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>
                Data de início <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWithIcon,
                  erros.dataInicio && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.flexInput}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                  value={dataInicio}
                  onChangeText={(text) => {
                    setDataInicio(formatarData(text));
                    if (erros.dataInicio)
                      setErros({ ...erros, dataInicio: false });
                  }}
                />
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </View>
              {erros.dataInicio && (
                <Text style={styles.errorText}>Data incompleta</Text>
              )}
            </View>

            <View style={styles.halfColumn}>
              <Text style={styles.label}>Data de término</Text>
              <View
                style={[
                  styles.inputWithIcon,
                  erros.dataTermino && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.flexInput}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={10}
                  value={dataTermino}
                  onChangeText={(text) => {
                    setDataTermino(formatarData(text));
                    if (erros.dataTermino)
                      setErros({ ...erros, dataTermino: false });
                  }}
                />
                <Ionicons name="calendar-outline" size={20} color="#555" />
              </View>
              {erros.dataTermino && (
                <Text style={styles.errorText}>Data incompleta</Text>
              )}
            </View>
          </View>

          {/* Linha 2: Horários */}
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>
                Horário de início <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWithIcon,
                  erros.horarioInicio && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.flexInput}
                  placeholder="00:00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5}
                  value={horarioInicio}
                  onChangeText={(text) => {
                    setHorarioInicio(formatarHorario(text));
                    if (erros.horarioInicio)
                      setErros({ ...erros, horarioInicio: false });
                  }}
                />
                <Ionicons name="time-outline" size={20} color="#555" />
              </View>
              {erros.horarioInicio && (
                <Text style={styles.errorText}>Hora incompleta</Text>
              )}
            </View>

            <View style={styles.halfColumn}>
              <Text style={styles.label}>Horário de término</Text>
              <View
                style={[
                  styles.inputWithIcon,
                  erros.horarioTermino && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.flexInput}
                  placeholder="00:00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={5}
                  value={horarioTermino}
                  onChangeText={(text) => {
                    setHorarioTermino(formatarHorario(text));
                    if (erros.horarioTermino)
                      setErros({ ...erros, horarioTermino: false });
                  }}
                />
                <Ionicons name="time-outline" size={20} color="#555" />
              </View>
              {erros.horarioTermino && (
                <Text style={styles.errorText}>Hora incompleta</Text>
              )}
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
              style={[
                styles.statusChip,
                situacao === 'agendado' && styles.statusActiveChip,
              ]}
              onPress={() => setSituacao('agendado')}
            >
              <Ionicons
                name={situacao === 'agendado' ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={situacao === 'agendado' ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.statusText,
                  situacao === 'agendado' && styles.statusActiveText,
                ]}
              >
                Agendado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusChip,
                situacao === 'em_andamento' && styles.statusActiveChip,
              ]}
              onPress={() => setSituacao('em_andamento')}
            >
              <Ionicons
                name={
                  situacao === 'em_andamento'
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={20}
                color={situacao === 'em_andamento' ? '#FFF' : '#666'}
              />
              <Text
                style={[
                  styles.statusText,
                  situacao === 'em_andamento' && styles.statusActiveText,
                ]}
              >
                Em andamento
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar}>
            <Text style={styles.primaryButtonText}>Cadastrar evento</Text>
          </TouchableOpacity>

          {/* Botão Cancelar */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelar}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
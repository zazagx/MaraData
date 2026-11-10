import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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

type CampoDataOuHora = 'dataInicio' | 'dataTermino' | 'horarioInicio' | 'horarioTermino';
type WheelColumnProps = {
  label: string;
  values: number[];
  value: number;
  onChange: (value: number) => void;
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const formatarNumero = (valor: number) => String(valor).padStart(2, '0');

// Componente para rolar e selecionar horas ou minutos
function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isInitialMount = useRef(true);

  // Posiciona a roleta no valor atual ao abrir
  useEffect(() => {
    const index = values.indexOf(value);
    if (index >= 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: index * 46, animated: !isInitialMount.current });
        isInitialMount.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [value, values]);

  // Captura o item que parou no centro após o scroll
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.y / 46);
    const safeIndex = Math.max(0, Math.min(index, values.length - 1));
    onChange(values[safeIndex]);
  };

  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelViewport}>
        <View pointerEvents="none" style={styles.wheelSelectionBand} />
        <ScrollView
          ref={scrollRef}
          style={styles.wheelScroll}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={46}
          decelerationRate="fast"
          bounces={false}
          onMomentumScrollEnd={handleScrollEnd}
          nestedScrollEnabled
        >
          {values.map((item) => (
            <View key={item} style={styles.wheelItem}>
              <Text style={[styles.wheelNumber, item === value && styles.wheelNumberSelected]}>
                {formatarNumero(item)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

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

  const [erros, setErros] = useState<{ [key: string]: string | boolean }>({});
  const [pickerVisivel, setPickerVisivel] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState<CampoDataOuHora>('dataInicio');

  // Estados auxiliares para controle do calendário e modal de hora
  const hoje = new Date();
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  
  const [tempHora, setTempHora] = useState(0);
  const [tempMinuto, setTempMinuto] = useState(0);

  // Validação simples de formato e existência da data
  const validarDataValida = (dataStr: string) => {
    if (dataStr.length < 10) return false;
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 2024 || ano > 2100) return false;
    const dataObj = new Date(ano, mes - 1, dia);
    return dataObj.getFullYear() === ano && dataObj.getMonth() === mes - 1 && dataObj.getDate() === dia;
  };

  // Validação de horário entre 00:00 e 23:59
  const validarHorarioValido = (horarioStr: string) => {
    if (horarioStr.length < 5) return false;
    const [horas, minutos] = horarioStr.split(':').map(Number);
    return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
  };

  const converterParaData = (dataStr: string) => {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const converterParaMinutos = (horarioStr: string) => {
    const [horas, minutos] = horarioStr.split(':').map(Number);
    return horas * 60 + minutos;
  };

  // Abre o modal de data ou hora conforme o campo clicado
  const abrirPicker = (campo: CampoDataOuHora) => {
    setCampoAtivo(campo);

    if (campo.includes('data')) {
      let baseDate = new Date();
      if (campo === 'dataInicio' && validarDataValida(dataInicio)) baseDate = converterParaData(dataInicio);
      else if (campo === 'dataTermino' && validarDataValida(dataTermino)) baseDate = converterParaData(dataTermino);
      setAnoAtual(baseDate.getFullYear());
      setMesAtual(baseDate.getMonth());
      setDiaSelecionado(baseDate.getDate());
    } else {
      const horarioAtual = campo === 'horarioInicio' ? horarioInicio : horarioTermino;
      if (validarHorarioValido(horarioAtual)) {
        const [hora, minuto] = horarioAtual.split(':').map(Number);
        setTempHora(hora);
        setTempMinuto(Math.round(minuto / 5) * 5 % 60);
      } else {
        setTempHora(0);
        setTempMinuto(0);
      }
    }
    setPickerVisivel(true);
  };

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();

  // Alterna os meses no calendário do modal
  const mudarMes = (delta: number) => {
    let novoMes = mesAtual + delta;
    let novoAno = anoAtual;
    if (novoMes < 0) { novoMes = 11; novoAno -= 1; }
    else if (novoMes > 11) { novoMes = 0; novoAno += 1; }
    if (novoAno < hoje.getFullYear() || (novoAno === hoje.getFullYear() && novoMes < hoje.getMonth())) return;
    setMesAtual(novoMes);
    setAnoAtual(novoAno);
  };

  // Impede selecionar dias que já passaram
  const ehDiaPassado = (dia: number) => {
    const dataVerificar = new Date(anoAtual, mesAtual, dia, 23, 59, 59);
    const dataHojeZerada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return dataVerificar < dataHojeZerada;
  };

  // Salva a seleção feita no modal (data ou hora) para o estado principal
  const confirmarSelecao = () => {
    if (campoAtivo.includes('data')) {
      const diaStr = formatarNumero(diaSelecionado);
      const mesStr = formatarNumero(mesAtual + 1);
      const dataFormatada = `${diaStr}/${mesStr}/${anoAtual}`;
      if (campoAtivo === 'dataInicio') {
        setDataInicio(dataFormatada);
        setErros((errs) => ({ ...errs, dataInicio: false }));
      } else {
        setDataTermino(dataFormatada);
        setErros((errs) => ({ ...errs, dataTermino: false }));
      }
    } else {
      const horarioFinal = `${formatarNumero(tempHora)}:${formatarNumero(tempMinuto)}`;
      if (campoAtivo === 'horarioInicio') {
        setHorarioInicio(horarioFinal);
        setErros((errs) => ({ ...errs, horarioInicio: false }));
      } else {
        setHorarioTermino(horarioFinal);
        setErros((errs) => ({ ...errs, horarioTermino: false }));
      }
    }
    setPickerVisivel(false);
  };

  // Valida todos os campos antes de concluir o cadastro
  const handleCadastrar = () => {
    const novosErros: { [key: string]: string | boolean } = {};
    if (!nomeEvento.trim()) novosErros.nomeEvento = 'Campo obrigatório';
    if (!localEvento.trim()) novosErros.localEvento = 'Campo obrigatório';
    if (!dataInicio) novosErros.dataInicio = 'Data obrigatória';
    else if (!validarDataValida(dataInicio)) novosErros.dataInicio = 'Data inválida';
    if (!horarioInicio) novosErros.horarioInicio = 'Hora obrigatória';
    else if (!validarHorarioValido(horarioInicio)) novosErros.horarioInicio = 'Hora inválida (00:00 a 23:59)';
    if (dataTermino.length > 0 && !validarDataValida(dataTermino)) novosErros.dataTermino = 'Data inválida';
    if (horarioTermino.length > 0 && !validarHorarioValido(horarioTermino)) novosErros.horarioTermino = 'Hora inválida (00:00 a 23:59)';

    if (validarDataValida(dataInicio) && validarDataValida(dataTermino)) {
      if (converterParaData(dataTermino) < converterParaData(dataInicio)) {
        novosErros.dataTermino = 'Término não pode ser antes do início';
      }
    }

    if (validarHorarioValido(horarioInicio) && validarHorarioValido(horarioTermino)) {
      const mesmoDia = !dataTermino || dataInicio === dataTermino;
      if (mesmoDia && converterParaMinutos(horarioTermino) <= converterParaMinutos(horarioInicio)) {
        novosErros.horarioTermino = 'Horário deve ser após o de início';
      }
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      Alert.alert('Dados incompletos ou incorretos', 'Por favor, corrija os campos indicados.');
      return;
    }

    Alert.alert('Sucesso!', 'Evento cadastrado com sucesso.', [
      {
        text: 'OK',
        onPress: () => {
          router.push({
            pathname: '/(funcoes)/eventos',
            params: { nomeEvento, localEvento, dataInicio, dataTermino, horarioInicio, horarioTermino, descricao, situacao },
          });
        },
      },
    ]);
  };

  const irParaHome = () => router.replace('/');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Cabeçalho da tela */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={irParaHome} accessibilityLabel="Voltar para Home">
              <Ionicons name="arrow-back" size={22} color="#6D28D9" />
            </TouchableOpacity>
            <View style={styles.brandLine}>
              <View style={styles.brandIcon}><Ionicons name="game-controller" size={22} color="#FFFFFF" /></View>
              <Text style={styles.brandText}>Mara<Text style={styles.brandAccent}>Games</Text></Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Título da seção */}
          <View style={styles.intro}>
            <View style={styles.introIcon}><Ionicons name="calendar-outline" size={27} color="#7C3AED" /></View>
            <View style={styles.introText}>
              <Text style={styles.title}>Cadastrar evento</Text>
              <Text style={styles.subtitle}>Preencha as informações do evento.</Text>
            </View>
          </View>

          {/* Formulário principal */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informações do evento</Text>

            <Text style={styles.label}>Nome do evento <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.inputContainer, !!erros.nomeEvento && styles.inputError]}>
              <Ionicons name="game-controller-outline" size={19} color="#8B5CF6" />
              <TextInput
                style={styles.inputText}
                placeholder="Ex: Torneio de FIFA"
                placeholderTextColor="#9CA3AF"
                value={nomeEvento}
                onChangeText={(text) => {
                  setNomeEvento(text);
                  if (erros.nomeEvento) setErros({ ...erros, nomeEvento: false });
                }}
              />
            </View>
            {erros.nomeEvento && <Text style={styles.errorText}>{String(erros.nomeEvento)}</Text>}

            <Text style={styles.label}>Local do evento <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.inputContainer, !!erros.localEvento && styles.inputError]}>
              <Ionicons name="location-outline" size={19} color="#8B5CF6" />
              <TextInput
                style={styles.inputText}
                placeholder="Ex: Arena Maragames"
                placeholderTextColor="#9CA3AF"
                value={localEvento}
                onChangeText={(text) => {
                  setLocalEvento(text);
                  if (erros.localEvento) setErros({ ...erros, localEvento: false });
                }}
              />
            </View>
            {erros.localEvento && <Text style={styles.errorText}>{String(erros.localEvento)}</Text>}

            {/* Linha com datas */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Data de início <Text style={styles.requiredStar}>*</Text></Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.dataInicio && styles.inputError]} onPress={() => abrirPicker('dataInicio')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !dataInicio && styles.placeholder]}>{dataInicio || 'DD/MM/AAAA'}</Text>
                    <Text style={styles.pickerHint}>Selecionar data</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                </TouchableOpacity>
                {erros.dataInicio && <Text style={styles.errorText}>{String(erros.dataInicio)}</Text>}
              </View>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Data de término</Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.dataTermino && styles.inputError]} onPress={() => abrirPicker('dataTermino')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !dataTermino && styles.placeholder]}>{dataTermino || 'DD/MM/AAAA'}</Text>
                    <Text style={styles.pickerHint}>Opcional</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                </TouchableOpacity>
                {erros.dataTermino && <Text style={styles.errorText}>{String(erros.dataTermino)}</Text>}
              </View>
            </View>

            {/* Linha com horários */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Horário de início <Text style={styles.requiredStar}>*</Text></Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.horarioInicio && styles.inputError]} onPress={() => abrirPicker('horarioInicio')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !horarioInicio && styles.placeholder]}>{horarioInicio || '--:--'}</Text>
                    <Text style={styles.pickerHint}>Selecionar hora</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color="#7C3AED" />
                </TouchableOpacity>
                {erros.horarioInicio && <Text style={styles.errorText}>{String(erros.horarioInicio)}</Text>}
              </View>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Horário de término</Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.horarioTermino && styles.inputError]} onPress={() => abrirPicker('horarioTermino')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !horarioTermino && styles.placeholder]}>{horarioTermino || '--:--'}</Text>
                    <Text style={styles.pickerHint}>Opcional</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color="#7C3AED" />
                </TouchableOpacity>
                {erros.horarioTermino && <Text style={styles.errorText}>{String(erros.horarioTermino)}</Text>}
              </View>
            </View>

            <Text style={styles.label}>Descrição <Text style={styles.optionalText}>(opcional)</Text></Text>
            <View style={[styles.inputContainer, styles.descriptionContainer]}>
              <TextInput
                style={[styles.inputText, styles.descriptionInput]}
                placeholder="Informações adicionais sobre o evento..."
                placeholderTextColor="#9CA3AF"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Seletor de status do evento */}
            <Text style={styles.label}>Situação do evento</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusOption, situacao === 'agendado' && styles.statusOptionActive]}
                onPress={() => setSituacao('agendado')}
              >
                <Ionicons name="calendar-outline" size={18} color={situacao === 'agendado' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.statusText, situacao === 'agendado' && styles.statusTextActive]}>Agendar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOption, situacao === 'em_andamento' && styles.statusOptionActive]}
                onPress={() => setSituacao('em_andamento')}
              >
                <Ionicons name="play-circle-outline" size={19} color={situacao === 'em_andamento' ? '#FFFFFF' : '#6B7280'} />
                <Text style={[styles.statusText, situacao === 'em_andamento' && styles.statusTextActive]}>Em andamento</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botões de submissão e retorno */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar}>
            <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Cadastrar evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={irParaHome}>
            <Ionicons name="home-outline" size={19} color="#6D28D9" />
            <Text style={styles.cancelButtonText}>Voltar para Home</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>* Campos obrigatórios</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal customizado para escolher datas ou horários */}
      <Modal visible={pickerVisivel} transparent animationType="fade" onRequestClose={() => setPickerVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {campoAtivo.includes('data') ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcon}><Ionicons name="calendar-outline" size={22} color="#7C3AED" /></View>
                  <Text style={styles.modalTitle}>Selecionar data</Text>
                  <TouchableOpacity onPress={() => setPickerVisivel(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity style={styles.monthArrow} onPress={() => mudarMes(-1)}>
                    <Ionicons name="chevron-back" size={21} color="#7C3AED" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>{`${MESES[mesAtual]} ${anoAtual}`}</Text>
                  <TouchableOpacity style={styles.monthArrow} onPress={() => mudarMes(1)}>
                    <Ionicons name="chevron-forward" size={21} color="#7C3AED" />
                  </TouchableOpacity>
                </View>
                <View style={styles.weekHeader}>
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => <Text key={idx} style={styles.weekDayText}>{dia}</Text>)}
                </View>
                <View style={styles.daysGrid}>
                  {Array.from({ length: primeiroDiaSemana }).map((_, idx) => <View key={`empty-${idx}`} style={styles.dayCell} />)}
                  {Array.from({ length: diasNoMes }).map((_, idx) => {
                    const dia = idx + 1;
                    const desabilitado = ehDiaPassado(dia);
                    const selecionado = dia === diaSelecionado;
                    return (
                      <TouchableOpacity
                        key={dia}
                        disabled={desabilitado}
                        style={[styles.dayCell, selecionado && styles.daySelected, desabilitado && styles.dayDisabled]}
                        onPress={() => setDiaSelecionado(dia)}
                      >
                        <Text style={[styles.dayText, selecionado && styles.dayTextSelected, desabilitado && styles.dayTextDisabled]}>{dia}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcon}><Ionicons name="time-outline" size={22} color="#7C3AED" /></View>
                  <View style={styles.modalHeadingText}>
                    <Text style={styles.modalTitle}>Escolha um horário</Text>
                    <Text style={styles.modalSubtitle}>Deslize para selecionar horas e minutos</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPickerVisivel(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <View style={styles.wheelWrapper}>
                  <WheelColumn label="HORA" values={Array.from({ length: 24 }, (_, i) => i)} value={tempHora} onChange={setTempHora} />
                  <Text style={styles.timeColon}>:</Text>
                  <WheelColumn label="MINUTOS" values={Array.from({ length: 12 }, (_, i) => i * 5)} value={tempMinuto} onChange={setTempMinuto} />
                </View>
                <View style={styles.timeSelectedPreview}>
                  <Ionicons name="checkmark-circle" size={17} color="#7C3AED" />
                  <Text style={styles.timePreviewText}>Horário selecionado: <Text style={styles.timePreviewStrong}>{formatarNumero(tempHora)}:{formatarNumero(tempMinuto)}</Text></Text>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setPickerVisivel(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmarSelecao}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Estilos visuais da tela divididos por blocos lógicos
const styles = StyleSheet.create({
  // Estrutura base e cabeçalho
  container: { flex: 1, backgroundColor: '#F7F6FB' },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F0EAFE', alignItems: 'center', justifyContent: 'center' },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  brandText: { color: '#242033', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  brandAccent: { color: '#8B5CF6' },
  headerSpacer: { width: 42 },

  // Seção de introdução
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  introIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#EEE7FF', alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#211B32', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, color: '#777184', marginTop: 4 },

  // Card do formulário e inputs
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 17, borderWidth: 1, borderColor: '#EEEAF5', shadowColor: '#33205B', shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTitle: { color: '#302744', fontSize: 15, fontWeight: '800', marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '700', color: '#393348', marginTop: 16, marginBottom: 7 },
  requiredStar: { color: '#E54868' },
  optionalText: { color: '#9691A1', fontWeight: '400' },
  inputContainer: { minHeight: 49, backgroundColor: '#FAF9FC', borderWidth: 1, borderColor: '#EAE6F1', borderRadius: 12, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { flex: 1, color: '#292438', fontSize: 14, paddingVertical: 11 },
  inputError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  errorText: { color: '#DC2626', fontSize: 11, marginTop: 4, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10 },
  halfColumn: { flex: 1, minWidth: 0 },
  
  // Campos de toque para data e hora
  pickerField: { minHeight: 57, backgroundColor: '#FAF9FC', borderWidth: 1, borderColor: '#EAE6F1', borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  pickerFieldText: { flex: 1 },
  pickerValue: { color: '#332B43', fontSize: 13, fontWeight: '700' },
  placeholder: { color: '#9A95A5', fontWeight: '500' },
  pickerHint: { color: '#9A95A5', fontSize: 10, marginTop: 3 },
  descriptionContainer: { minHeight: 100, alignItems: 'flex-start' },
  descriptionInput: { minHeight: 82, textAlignVertical: 'top' },

  // Botões de escolha de situação
  statusRow: { flexDirection: 'row', gap: 9 },
  statusOption: { flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E7E2EF', backgroundColor: '#FAF9FC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 7 },
  statusOptionActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  statusText: { color: '#625D6D', fontSize: 12, fontWeight: '700' },
  statusTextActive: { color: '#FFFFFF' },

  // Botões principais da página
  primaryButton: { minHeight: 52, marginTop: 18, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#7C3AED', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cancelButton: { minHeight: 46, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: '#DDD2F5', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cancelButtonText: { color: '#6D28D9', fontSize: 14, fontWeight: '700' },
  footerNote: { textAlign: 'center', color: '#9691A1', fontSize: 11, marginTop: 13 },

  // Estilos do modal geral
  modalOverlay: { flex: 1, backgroundColor: 'rgba(27, 20, 42, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 19, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: '#EEEAF5', shadowColor: '#24163D', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#F0EAFE', alignItems: 'center', justifyContent: 'center' },
  modalHeadingText: { flex: 1 },
  modalTitle: { flex: 1, color: '#292238', fontSize: 17, fontWeight: '800' },
  modalSubtitle: { color: '#8A8496', fontSize: 11, marginTop: 3 },
  closeButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F6F4F9', alignItems: 'center', justifyContent: 'center' },

  // Estilos do calendário
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  monthArrow: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F2EDFC', alignItems: 'center', justifyContent: 'center' },
  calendarMonthText: { fontSize: 15, fontWeight: '800', color: '#6D28D9' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 7 },
  weekDayText: { width: '13.5%', textAlign: 'center', fontWeight: '700', color: '#9B95A6', fontSize: 11 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', height: 39, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  daySelected: { backgroundColor: '#7C3AED', borderRadius: 13 },
  dayDisabled: { opacity: 0.25 },
  dayText: { fontSize: 13, color: '#332B43', fontWeight: '500' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  dayTextDisabled: { color: '#9CA3AF' },

  // Estilos da roleta de horários
  wheelWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 7 },
  wheelColumn: { flex: 1, alignItems: 'center' },
  wheelLabel: { color: '#8A8496', fontSize: 10, fontWeight: '800', letterSpacing: 1.3, marginBottom: 8 },
  wheelViewport: { height: 184, width: '100%', overflow: 'hidden', justifyContent: 'center' },
  wheelSelectionBand: { 
    position: 'absolute', 
    zIndex: 0, 
    top: 69, 
    left: 0, 
    right: 0, 
    height: 46, 
    borderRadius: 12, 
    backgroundColor: 'rgba(240, 234, 254, 0.7)', 
    borderWidth: 1, 
    borderColor: '#DCCBFF' 
  },
  wheelScroll: { flex: 1, zIndex: 1 },
  wheelContent: { paddingVertical: 69 },
  wheelItem: { height: 46, alignItems: 'center', justifyContent: 'center' },
  wheelNumber: { color: '#AAA4B4', fontSize: 21, fontWeight: '500', fontVariant: ['tabular-nums'] },
  wheelNumberSelected: { color: '#6D28D9', fontSize: 27, fontWeight: '900' },
  timeColon: { color: '#7C3AED', fontSize: 28, fontWeight: '800', marginTop: 24 },
  timeSelectedPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F7F3FF', borderRadius: 11, paddingVertical: 10, marginTop: 14 },
  timePreviewText: { color: '#6B6478', fontSize: 12 },
  timePreviewStrong: { color: '#6D28D9', fontWeight: '900', fontVariant: ['tabular-nums'] },

  // Botões de confirmação do modal
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancelButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E0EC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  modalCancelText: { color: '#6B6478', fontWeight: '700', fontSize: 13 },
  modalConfirmButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
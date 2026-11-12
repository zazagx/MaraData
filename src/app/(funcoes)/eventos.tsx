import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
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
import { Evento, useEvento } from '../../context/eventocontexto';
import { useTema } from '../../context/temaContexto';
import { useEstilosTema } from '../../context/temaEstilos';

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

function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  const styles = useEstilosTema(estilosBase);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isInitialMount = useRef(true);

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
  const { tema } = useTema();
  const styles = useEstilosTema(estilosBase);
  const { setEvento, adicionarEvento, eventos } = useEvento();
  
  const params = useLocalSearchParams<{
    editando?: string;
    nomeEvento?: string;
    localEvento?: string;
    dataInicio?: string;
    dataTermino?: string;
    horarioInicio?: string;
    horarioTermino?: string;
    descricao?: string;
    situacao?: 'agendado' | 'em_andamento';
  }>();

  const estaEditando = params.editando === 'true';

  const [nomeEvento, setNomeEvento] = useState(estaEditando ? params.nomeEvento || '' : '');
  const [localEvento, setLocalEvento] = useState(estaEditando ? params.localEvento || '' : '');
  const [dataInicio, setDataInicio] = useState(estaEditando ? params.dataInicio || '' : '');
  const [dataTermino, setDataTermino] = useState(estaEditando ? params.dataTermino || '' : '');
  const [horarioInicio, setHorarioInicio] = useState(estaEditando ? params.horarioInicio || '' : '');
  const [horarioTermino, setHorarioTermino] = useState(estaEditando ? params.horarioTermino || '' : '');
  const [descricao, setDescricao] = useState(estaEditando ? params.descricao || '' : '');
  const [situacao, setSituacao] = useState<'agendado' | 'em_andamento'>(
    estaEditando && params.situacao === 'em_andamento' ? 'em_andamento' : 'agendado'
  );

  const [erros, setErros] = useState<{ [key: string]: string | boolean }>({});
  const [pickerVisivel, setPickerVisivel] = useState(false);
  const [campoAtivo, setCampoAtivo] = useState<CampoDataOuHora>('dataInicio');
  
  const [modoTeclado, setModoTeclado] = useState(false);
  const [textoHoraDigitada, setTextoHoraDigitada] = useState('');

  const hoje = new Date();
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.getDate());
  
  const [tempHora, setTempHora] = useState(0);
  const [tempMinuto, setTempMinuto] = useState(0);

  const validarDataValida = (dataStr: string) => {
    if (!dataStr || dataStr.length < 10) return false;
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 2024 || ano > 2100) return false;
    const dataObj = new Date(ano, mes - 1, dia);
    return dataObj.getFullYear() === ano && dataObj.getMonth() === mes - 1 && dataObj.getDate() === dia;
  };

  const validarHorarioValido = (horarioStr: string) => {
    if (!horarioStr || horarioStr.length < 5) return false;
    const [horas, minutos] = horarioStr.split(':').map(Number);
    return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
  };

  const converterParaData = (dataStr: string) => {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    return new Date(ano, mes - 1, dia);
  };

  const abrirPicker = (campo: CampoDataOuHora) => {
    setCampoAtivo(campo);
    setModoTeclado(false);
    const agora = new Date();

    if (campo.includes('data')) {
      let baseDate = agora;
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
        setTempMinuto(situacao === 'em_andamento' ? minuto : Math.round(minuto / 5) * 5 % 60);
      } else if (situacao === 'em_andamento') {
        setTempHora(agora.getHours());
        setTempMinuto(agora.getMinutes());
      } else {
        setTempHora(0);
        setTempMinuto(0);
      }
      setTextoHoraDigitada(horarioAtual || (situacao === 'em_andamento' ? `${formatarNumero(agora.getHours())}:${formatarNumero(agora.getMinutes())}` : '00:00'));
    }
    setPickerVisivel(true);
  };

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();

  const mudarMes = (delta: number) => {
    let novoMes = mesAtual + delta;
    let novoAno = anoAtual;
    if (novoMes < 0) { novoMes = 11; novoAno -= 1; }
    else if (novoMes > 11) { novoMes = 0; novoAno += 1; }
    if (novoAno < hoje.getFullYear() || (novoAno === hoje.getFullYear() && novoMes < hoje.getMonth())) return;
    setMesAtual(novoMes);
    setAnoAtual(novoAno);
  };

  const ehDiaDesabilitado = (dia: number) => {
    const dataVerificar = new Date(anoAtual, mesAtual, dia);
    const dataHojeZerada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    if (situacao === 'em_andamento' && campoAtivo === 'dataInicio') {
      return dataVerificar.getTime() !== dataHojeZerada.getTime();
    }

    const dataFinalDia = new Date(anoAtual, mesAtual, dia, 23, 59, 59);
    return dataFinalDia < dataHojeZerada;
  };

  const aplicarValoresHojeAgora = () => {
    setSituacao('em_andamento');
    const agora = new Date();
    const dataHojeStr = `${formatarNumero(agora.getDate())}/${formatarNumero(agora.getMonth() + 1)}/${agora.getFullYear()}`;
    const horaAgoraStr = `${formatarNumero(agora.getHours())}:${formatarNumero(agora.getMinutes())}`;

    setDataInicio(dataHojeStr);
    setHorarioInicio(horaAgoraStr);

    if (erros.dataInicio) setErros((prev) => ({ ...prev, dataInicio: false }));
    if (erros.horarioInicio) setErros((prev) => ({ ...prev, horarioInicio: false }));
  };

  const selecionarEmAndamento = () => {
    if (situacao === 'em_andamento') return;

    if (dataInicio || horarioInicio) {
      Alert.alert(
        'Alterar para "Iniciar Agora"?',
        'Ao mudar para "Iniciar Agora", a data e o horário de início serão preenchidos automaticamente com a data e hora atuais. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: aplicarValoresHojeAgora },
        ]
      );
    } else {
      aplicarValoresHojeAgora();
    }
  };

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
      let horarioFinal = '';
      if (modoTeclado) {
        if (!validarHorarioValido(textoHoraDigitada)) {
          Alert.alert('Horário inválido', 'Digite o horário no formato HH:MM (ex: 15:32).');
          return;
        }
        horarioFinal = textoHoraDigitada;
      } else {
        horarioFinal = `${formatarNumero(tempHora)}:${formatarNumero(tempMinuto)}`;
      }

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

  const temValorPreenchido = () => {
    if (campoAtivo === 'dataInicio') return !!dataInicio;
    if (campoAtivo === 'dataTermino') return !!dataTermino;
    if (campoAtivo === 'horarioInicio') return !!horarioInicio;
    if (campoAtivo === 'horarioTermino') return !!horarioTermino;
    return false;
  };

  const handleCadastrar = () => {
    const novosErros: { [key: string]: string | boolean } = {};
    
    if (!nomeEvento.trim()) novosErros.nomeEvento = 'Campo obrigatório';
    if (!localEvento.trim()) novosErros.localEvento = 'Campo obrigatório';
    
    if (!dataInicio) novosErros.dataInicio = 'Data obrigatória';
    else if (!validarDataValida(dataInicio)) novosErros.dataInicio = 'Data inválida';
    
    if (!horarioInicio) novosErros.horarioInicio = 'Hora obrigatória';
    else if (!validarHorarioValido(horarioInicio)) novosErros.horarioInicio = 'Hora inválida (00:00 a 23:59)';

    // NOVIDADE: Verifica se já existe um evento idêntico cadastrado na lista
    const eventoDuplicado = eventos.some(
      (item: Evento) => 
        !estaEditando &&
        item.nomeEvento.trim().toLowerCase() === nomeEvento.trim().toLowerCase() &&
        item.dataInicio === dataInicio &&
        item.horarioInicio === horarioInicio
    );

    if (eventoDuplicado) {
      Alert.alert(
        'Evento Duplicado', 
        'Já existe um evento cadastrado com este mesmo nome, data e horário de início.'
      );
      return;
    }

    // Validação de conflito de evento em andamento (já existente)
    const jaTemEmAndamento = eventos.some(
      (item: Evento) => item.situacao === 'em_andamento' && (!estaEditando || item.nomeEvento !== nomeEvento)
    );

    if (situacao === 'em_andamento' && jaTemEmAndamento && !estaEditando) {
      Alert.alert(
        'Conflito de Eventos', 
        'Já existe um evento em andamento no momento. Encerre o evento atual antes de iniciar um novo.'
      );
      return;
    }

    let dataTerminoInvalida = false;
    if (dataTermino.length > 0) {
      if (!validarDataValida(dataTermino)) {
        novosErros.dataTermino = 'Data inválida';
        dataTerminoInvalida = true;
      } else if (validarDataValida(dataInicio) && converterParaData(dataTermino) < converterParaData(dataInicio)) {
        novosErros.dataTermino = 'Término não pode ser antes do início';
        dataTerminoInvalida = true;
      }
    }

    if (horarioTermino.length > 0) {
      if (!validarHorarioValido(horarioTermino)) {
        novosErros.horarioTermino = 'Hora inválida (00:00 a 23:59)';
      } else if (validarDataValida(dataInicio) && validarHorarioValido(horarioInicio)) {
        const dInicio = converterParaData(dataInicio);
        const [hIni, mIni] = horarioInicio.split(':').map(Number);
        dInicio.setHours(hIni, mIni, 0, 0);

        const dTermino = dataTermino && !dataTerminoInvalida && validarDataValida(dataTermino) 
          ? converterParaData(dataTermino) 
          : new Date(dInicio.getTime());

        const [hTer, mTer] = horarioTermino.split(':').map(Number);
        dTermino.setHours(hTer, mTer, 0, 0);

        if (dTermino <= dInicio) {
          novosErros.horarioTermino = 'Horário deve ser após o de início';
        }
      }
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      Alert.alert('Dados incompletos ou incorretos', 'Por favor, corrija os campos indicados.');
      return;
    }

    const eventoExistente = eventos.find(item => item.nomeEvento === nomeEvento && estaEditando);

    const eventoCriado: Evento = {
      id: eventoExistente?.id || Date.now().toString(),
      nomeEvento,
      localEvento,
      dataInicio,
      dataTermino,
      horarioInicio,
      horarioTermino,
      descricao,
      situacao,
    };

    adicionarEvento(eventoCriado);

    const mensagemSucesso = estaEditando ? 'Evento atualizado com sucesso!' : 'Evento cadastrado com sucesso!';

    Alert.alert('Sucesso!', mensagemSucesso, [
      {
        text: 'OK',
        onPress: () => {
          router.replace({
            pathname: '/(funcoes)/eventos/detalhes',
            params: eventoCriado,
          });
        },
      },
    ]);
  };

  const irParaHome = () => router.replace('/');

  const valoresMinutos = situacao === 'em_andamento'
    ? Array.from({ length: 60 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: estaEditando ? 'Editar evento' : 'Cadastrar evento',
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

      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.intro}>
            <View style={styles.introIcon}><Ionicons name="calendar-outline" size={27} color={tema.primary} /></View>
            <View style={styles.introText}>
              <Text style={styles.title}>{estaEditando ? 'Editar evento' : 'Cadastrar evento'}</Text>
              <Text style={styles.subtitle}>Preencha as informações do evento.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informações do evento</Text>

            <Text style={styles.label}>Nome do evento <Text style={styles.requiredStar}>*</Text></Text>
            <View style={[styles.inputContainer, !!erros.nomeEvento && styles.inputError]}>
              <Ionicons name="game-controller-outline" size={19} color={tema.primary} />
              <TextInput
                style={styles.inputText}
                placeholder="Ex: Torneio de FIFA"
                placeholderTextColor={tema.textSecondary}
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
              <Ionicons name="location-outline" size={19} color={tema.primary} />
              <TextInput
                style={styles.inputText}
                placeholder="Ex: Arena Maragames"
                placeholderTextColor={tema.textSecondary}
                value={localEvento}
                onChangeText={(text) => {
                  setLocalEvento(text);
                  if (erros.localEvento) setErros({ ...erros, localEvento: false });
                }}
              />
            </View>
            {erros.localEvento && <Text style={styles.errorText}>{String(erros.localEvento)}</Text>}

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Data de início <Text style={styles.requiredStar}>*</Text></Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.dataInicio && styles.inputError]} onPress={() => abrirPicker('dataInicio')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !dataInicio && styles.placeholder]}>{dataInicio || 'DD/MM/AAAA'}</Text>
                    <Text style={styles.pickerHint}>Selecionar data</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color={tema.primary} />
                </TouchableOpacity>
                {erros.dataInicio && <Text style={styles.errorText}>{String(erros.dataInicio)}</Text>}
              </View>

              <View style={styles.halfColumn}>
                <Text style={styles.label}>Data de término</Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.dataTermino && styles.inputError]} onPress={() => abrirPicker('dataTermino')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !dataTermino && styles.placeholder]}>{dataTermino || 'DD/MM/AAAA'}</Text>
                    <Text style={styles.pickerHint}>{dataTermino ? 'Toque para alterar' : 'Opcional'}</Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color={tema.primary} />
                </TouchableOpacity>
                {erros.dataTermino && <Text style={styles.errorText}>{String(erros.dataTermino)}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Horário de início <Text style={styles.requiredStar}>*</Text></Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.horarioInicio && styles.inputError]} onPress={() => abrirPicker('horarioInicio')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !horarioInicio && styles.placeholder]}>{horarioInicio || '--:--'}</Text>
                    <Text style={styles.pickerHint}>Selecionar hora</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color={tema.primary} />
                </TouchableOpacity>
                {erros.horarioInicio && <Text style={styles.errorText}>{String(erros.horarioInicio)}</Text>}
              </View>

              <View style={styles.halfColumn}>
                <Text style={styles.label}>Horário de término</Text>
                <TouchableOpacity style={[styles.pickerField, !!erros.horarioTermino && styles.inputError]} onPress={() => abrirPicker('horarioTermino')}>
                  <View style={styles.pickerFieldText}>
                    <Text style={[styles.pickerValue, !horarioTermino && styles.placeholder]}>{horarioTermino || '--:--'}</Text>
                    <Text style={styles.pickerHint}>{horarioTermino ? 'Toque para alterar' : 'Opcional'}</Text>
                  </View>
                  <Ionicons name="time-outline" size={20} color={tema.primary} />
                </TouchableOpacity>
                {erros.horarioTermino && <Text style={styles.errorText}>{String(erros.horarioTermino)}</Text>}
              </View>
            </View>

            <Text style={styles.label}>Descrição <Text style={styles.optionalText}>(opcional)</Text></Text>
            <View style={[styles.inputContainer, styles.descriptionContainer]}>
              <TextInput
                style={[styles.inputText, styles.descriptionInput]}
                placeholder="Informações adicionais sobre o evento..."
                placeholderTextColor={tema.textSecondary}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.label}>Situação do evento</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity
                style={[styles.statusOption, situacao === 'agendado' && styles.statusOptionActive]}
                onPress={() => setSituacao('agendado')}
              >
                <Ionicons name="calendar-outline" size={18} color={situacao === 'agendado' ? '#FFFFFF' : tema.textSecondary} />
                <Text style={[styles.statusText, situacao === 'agendado' && styles.statusTextActive]} numberOfLines={1}>Agendar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOption, situacao === 'em_andamento' && styles.statusOptionActive]}
                onPress={selecionarEmAndamento}
              >
                <Ionicons name="play-circle-outline" size={19} color={situacao === 'em_andamento' ? '#FFFFFF' : tema.textSecondary} />
                <Text style={[styles.statusText, situacao === 'em_andamento' && styles.statusTextActive]} numberOfLines={1}>Iniciar Agora</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCadastrar}>
            <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{estaEditando ? 'Salvar alterações' : 'Cadastrar evento'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={irParaHome}>
            <Ionicons name="home-outline" size={19} color={tema.primary} />
            <Text style={styles.cancelButtonText}>Voltar para Home</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>* Campos obrigatórios</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisivel} transparent animationType="fade" onRequestClose={() => setPickerVisivel(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {campoAtivo.includes('data') ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcon}><Ionicons name="calendar-outline" size={22} color={tema.primary} /></View>
                  <Text style={styles.modalTitle}>Selecionar data</Text>
                  <TouchableOpacity onPress={() => setPickerVisivel(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={22} color={tema.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity style={styles.monthArrow} onPress={() => mudarMes(-1)}>
                    <Ionicons name="chevron-back" size={21} color={tema.primary} />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>{`${MESES[mesAtual]} ${anoAtual}`}</Text>
                  <TouchableOpacity style={styles.monthArrow} onPress={() => mudarMes(1)}>
                    <Ionicons name="chevron-forward" size={21} color={tema.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.weekHeader}>
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => <Text key={idx} style={styles.weekDayText}>{dia}</Text>)}
                </View>
                <View style={styles.daysGrid}>
                  {Array.from({ length: primeiroDiaSemana }).map((_, idx) => <View key={`empty-${idx}`} style={styles.dayCell} />)}
                  {Array.from({ length: diasNoMes }).map((_, idx) => {
                    const dia = idx + 1;
                    const desabilitado = ehDiaDesabilitado(dia);
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
                  <View style={styles.modalHeaderIcon}><Ionicons name="time-outline" size={22} color={tema.primary} /></View>
                  <View style={styles.modalHeadingText}>
                    <Text style={styles.modalTitle}>Escolha um horário</Text>
                    <Text style={styles.modalSubtitle}>
                      {modoTeclado ? 'Modo digitação manual' : (situacao === 'em_andamento' ? 'Minutos completos (00 a 59)' : 'Inicia em 00:00 (5 em 5 min)')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setPickerVisivel(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={22} color={tema.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modeSwitchBar}>
                  <TouchableOpacity 
                    style={[styles.modeSwitchTab, !modoTeclado && styles.modeSwitchTabActive]}
                    onPress={() => setModoTeclado(false)}
                  >
                    <Ionicons name="options-outline" size={16} color={!modoTeclado ? tema.primary : tema.textSecondary} />
                    <Text style={[styles.modeSwitchText, !modoTeclado && styles.modeSwitchTextActive]}>Roleta</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modeSwitchTab, modoTeclado && styles.modeSwitchTabActive]}
                    onPress={() => setModoTeclado(true)}
                  >
                    <Ionicons name="keypad-outline" size={16} color={modoTeclado ? tema.primary : tema.textSecondary} />
                    <Text style={[styles.modeSwitchText, modoTeclado && styles.modeSwitchTextActive]}>Teclado</Text>
                  </TouchableOpacity>
                </View>

                {modoTeclado ? (
                  <View style={styles.keyboardInputWrapper}>
                    <Text style={styles.keyboardInputLabel}>Digite o horário (HH:MM)</Text>
                    <TextInput
                      style={styles.keyboardDirectInput}
                      placeholder="15:32"
                      placeholderTextColor={tema.textSecondary}
                      keyboardType="numeric"
                      maxLength={5}
                      value={textoHoraDigitada}
                      onChangeText={(text) => {
                        let cleaned = text.replace(/[^0-9]/g, '');
                        if (cleaned.length > 2) {
                          cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
                        }
                        setTextoHoraDigitada(cleaned);
                      }}
                      autoFocus
                    />
                    <Text style={styles.keyboardHintText}>Formato 24h exato para máxima precisão.</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.wheelWrapper}>
                      <WheelColumn label="HORA" values={Array.from({ length: 24 }, (_, i) => i)} value={tempHora} onChange={setTempHora} />
                      <Text style={styles.timeColon}>:</Text>
                      <WheelColumn label="MINUTOS" values={valoresMinutos} value={tempMinuto} onChange={setTempMinuto} />
                    </View>
                    <View style={styles.timeSelectedPreview}>
                      <Ionicons name="checkmark-circle" size={17} color={tema.primary} />
                      <Text style={styles.timePreviewText}>Horário selecionado: <Text style={styles.timePreviewStrong}>{formatarNumero(tempHora)}:{formatarNumero(tempMinuto)}</Text></Text>
                    </View>
                  </>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              {temValorPreenchido() && (
                <TouchableOpacity 
                  style={styles.modalClearButton} 
                  onPress={() => {
                    if (campoAtivo === 'dataInicio') setDataInicio('');
                    if (campoAtivo === 'dataTermino') setDataTermino('');
                    if (campoAtivo === 'horarioInicio') setHorarioInicio('');
                    if (campoAtivo === 'horarioTermino') setHorarioTermino('');
                    setPickerVisivel(false);
                  }}
                >
                  <Text style={styles.modalClearText}>Limpar</Text>
                </TouchableOpacity>
              )}
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

const estilosBase = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6FB' },
  keyboard: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  introIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#EEE7FF', alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#211B32', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, color: '#777184', marginTop: 4 },

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
  
  pickerField: { minHeight: 57, backgroundColor: '#FAF9FC', borderWidth: 1, borderColor: '#EAE6F1', borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  pickerFieldText: { flex: 1 },
  pickerValue: { color: '#332B43', fontSize: 13, fontWeight: '700' },
  placeholder: { color: '#9A95A5', fontWeight: '500' },
  pickerHint: { color: '#9A95A5', fontSize: 10, marginTop: 3 },
  descriptionContainer: { minHeight: 100, alignItems: 'flex-start' },
  descriptionInput: { minHeight: 82, textAlignVertical: 'top' },

  statusRow: { flexDirection: 'row', gap: 9 },
  statusOption: { flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E7E2EF', backgroundColor: '#FAF9FC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  statusOptionActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  statusText: { color: '#625D6D', fontSize: 12, fontWeight: '700' },
  statusTextActive: { color: '#FFFFFF' },

  primaryButton: { minHeight: 52, marginTop: 18, borderRadius: 14, backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: '#7C3AED', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  cancelButton: { minHeight: 46, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: '#DDD2F5', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  cancelButtonText: { color: '#6D28D9', fontSize: 14, fontWeight: '700' },
  footerNote: { textAlign: 'center', color: '#9691A1', fontSize: 11, marginTop: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(27, 20, 42, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 19, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: '#EEEAF5', shadowColor: '#24163D', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  modalHeaderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#F0EAFE', alignItems: 'center', justifyContent: 'center' },
  modalHeadingText: { flex: 1 },
  modalTitle: { color: '#292238', fontSize: 16, fontWeight: '800' },
  modalSubtitle: { color: '#8A8496', fontSize: 11, marginTop: 2 },
  closeButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F6F4F9', alignItems: 'center', justifyContent: 'center' },

  modeSwitchBar: { flexDirection: 'row', backgroundColor: '#F2EDFC', borderRadius: 10, padding: 3, marginBottom: 16 },
  modeSwitchTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  modeSwitchTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#33205B', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  modeSwitchText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  modeSwitchTextActive: { color: '#7C3AED' },

  keyboardInputWrapper: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  keyboardInputLabel: { fontSize: 13, fontWeight: '700', color: '#6D28D9' },
  keyboardDirectInput: { width: '80%', height: 56, borderWidth: 2, borderColor: '#7C3AED', borderRadius: 14, backgroundColor: '#FAF9FC', textAlign: 'center', fontSize: 26, fontWeight: '800', color: '#292238', fontVariant: ['tabular-nums'] },
  keyboardHintText: { fontSize: 11, color: '#8A8496' },

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
  wheelNumber: { color: '#AAA4B4', fontSize: 18, fontWeight: '500', fontVariant: ['tabular-nums'] },
  wheelNumberSelected: { color: '#6D28D9', fontSize: 24, fontWeight: '900' },
  timeColon: { color: '#7C3AED', fontSize: 28, fontWeight: '800', marginTop: 24 },
  timeSelectedPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F7F3FF', borderRadius: 11, paddingVertical: 10, marginTop: 14 },
  timePreviewText: { color: '#6B6478', fontSize: 12 },
  timePreviewStrong: { color: '#6D28D9', fontWeight: '900', fontVariant: ['tabular-nums'] },

  modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modalClearButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2' },
  modalClearText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
  modalCancelButton: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E0EC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  modalCancelText: { color: '#6B6478', fontWeight: '700', fontSize: 12 },
  modalConfirmButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
});
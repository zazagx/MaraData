import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type AberturaAnimadaProps = {
  iniciar: boolean;
  onFinish: () => void;
};

// O impacto principal do áudio foi preparado para coincidir com o fim da rotação.
// Se o áudio não carregar a tempo, a animação continua silenciosamente.
const TEMPO_MAX_ESPERA_AUDIO_MS = 1500;
const TEMPO_SEGURANCA_AUDIO_MS = 5200;

/**
 * Abertura do MaraData.
 * O lobo permanece parado; somente a estrela gira, encaixa e recebe
 * um toque tátil sincronizado com o impacto do áudio.
 */
export default function AberturaAnimada({
  iniciar,
  onFinish,
}: AberturaAnimadaProps) {
  const audioPlayer = useAudioPlayer(
    require('../../assets/audio/MaraData_Splash_sound.mp3'),
    { updateInterval: 100 },
  );
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const rotacaoEstrela = useRef(new Animated.Value(0)).current;
  const escalaEstrela = useRef(new Animated.Value(1)).current;
  const opacidadeEstrela = useRef(new Animated.Value(1)).current;
  const opacidadeTitulo = useRef(new Animated.Value(0)).current;
  const deslocamentoTitulo = useRef(new Animated.Value(10)).current;
  const opacidadeTela = useRef(new Animated.Value(1)).current;

  const iniciou = useRef(false);
  const saidaIniciada = useRef(false);
  const onFinishRef = useRef(onFinish);
  const [somFinalizado, setSomFinalizado] = useState(false);
  const [encaixeFinalizado, setEncaixeFinalizado] = useState(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  // O player avisa quando a faixa termina. Se houver erro, a abertura visual
  // continua normalmente e não fica presa esperando o áudio.
  useEffect(() => {
    if (audioStatus.didJustFinish || audioStatus.error) {
      setSomFinalizado(true);
    }
  }, [audioStatus.didJustFinish, audioStatus.error]);

  const iniciarSequenciaRef = useRef<(usarAudio: boolean) => void>(() => undefined);

  // Prepara a animação uma única vez. O estado do áudio é observado em outro
  // efeito para que uma mudança tardia do player não cancele uma animação já iniciada.
  useEffect(() => {
    if (!iniciar || iniciou.current) return;

    let cancelada = false;
    let temporizadorAudio: ReturnType<typeof setTimeout> | null = null;
    let temporizadorSeguranca: ReturnType<typeof setTimeout> | null = null;
    let animacaoAtual: Animated.CompositeAnimation | null = null;

    const iniciarSequencia = (usarAudio: boolean) => {
      if (cancelada || iniciou.current) return;
      iniciou.current = true;
      if (temporizadorAudio) {
        clearTimeout(temporizadorAudio);
        temporizadorAudio = null;
      }

      // A animação não depende do áudio. O áudio é um complemento opcional.
      if (!usarAudio) {
        setSomFinalizado(true);
      } else {
        try {
          audioPlayer.volume = 1;
          audioPlayer.seekTo(0);
          audioPlayer.play();
          // Proteção caso o player não emita o evento de término.
          temporizadorSeguranca = setTimeout(
            () => setSomFinalizado(true),
            TEMPO_SEGURANCA_AUDIO_MS,
          );
        } catch (erro) {
          console.warn('Não foi possível reproduzir o som da abertura:', erro);
          setSomFinalizado(true);
        }
      }

      const iniciarEncaixe = () => {
        if (cancelada) return;

        // O impacto tátil coincide com o começo do encaixe da estrela.
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => undefined,
        );

        const ampliar = Animated.timing(escalaEstrela, {
          toValue: 1.1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        });

        animacaoAtual = ampliar;
        ampliar.start(({ finished }) => {
          if (!finished || cancelada) return;

          const encaixe = Animated.sequence([
            Animated.timing(escalaEstrela, {
              toValue: 0.98,
              duration: 65,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.spring(escalaEstrela, {
              toValue: 1,
              speed: 25,
              bounciness: 5,
              useNativeDriver: true,
            }),
          ]);

          animacaoAtual = encaixe;
          encaixe.start(({ finished: encaixeConcluido }) => {
            if (encaixeConcluido && !cancelada) {
              setEncaixeFinalizado(true);
            }
          });
        });
      };

      const entradaEstrela = Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(opacidadeEstrela, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rotacaoEstrela, {
            toValue: 1,
            duration: 1350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const entradaTitulo = Animated.sequence([
        Animated.delay(620),
        Animated.parallel([
          Animated.timing(opacidadeTitulo, {
            toValue: 1,
            duration: 430,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(deslocamentoTitulo, {
            toValue: 0,
            duration: 430,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]);

      const entradaInicial = Animated.parallel([entradaEstrela, entradaTitulo]);
      animacaoAtual = entradaInicial;
      entradaInicial.start(({ finished }) => {
        if (finished && !cancelada) iniciarEncaixe();
      });
    };

    iniciarSequenciaRef.current = iniciarSequencia;

    if (Platform.OS === 'web') {
      iniciarSequencia(false);
    } else {
      // Dá uma janela curta para o áudio carregar, mas nunca deixa a Splash presa.
      temporizadorAudio = setTimeout(
        () => iniciarSequencia(false),
        TEMPO_MAX_ESPERA_AUDIO_MS,
      );
    }

    return () => {
      cancelada = true;
      iniciarSequenciaRef.current = () => undefined;
      animacaoAtual?.stop();
      if (temporizadorAudio) clearTimeout(temporizadorAudio);
      if (temporizadorSeguranca) clearTimeout(temporizadorSeguranca);
      audioPlayer.pause();
    };
  }, [
    iniciar,
    audioPlayer,
    deslocamentoTitulo,
    escalaEstrela,
    opacidadeEstrela,
    opacidadeTitulo,
    rotacaoEstrela,
  ]);

  // Quando o MP3 fica pronto (ou falha), decide se a abertura usará o som.
  // Se o limite de 1,5 s já tiver iniciado a versão silenciosa, o ref ignora a mudança.
  useEffect(() => {
    if (!iniciar || iniciou.current) return;

    if (Platform.OS === 'web' || audioStatus.error) {
      iniciarSequenciaRef.current(false);
    } else if (audioStatus.isLoaded) {
      iniciarSequenciaRef.current(true);
    }
  }, [iniciar, audioStatus.isLoaded, audioStatus.error]);

  // A tela só sai depois do encaixe visual e do término da reverberação do áudio,
  // quando ele tiver sido reproduzido.
  useEffect(() => {
    if (
      !iniciar ||
      !encaixeFinalizado ||
      !somFinalizado ||
      saidaIniciada.current
    ) {
      return;
    }

    saidaIniciada.current = true;
    const saida = Animated.sequence([
      Animated.delay(80),
      Animated.timing(opacidadeTela, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    saida.start(({ finished }) => {
      if (finished) onFinishRef.current();
    });

    return () => saida.stop();
  }, [iniciar, encaixeFinalizado, somFinalizado, opacidadeTela]);

  const giro = rotacaoEstrela.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tela, { opacity: opacidadeTela }]}
    >
      <View style={styles.conteudo}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/maradata-lobo-sem-estrela.png')}
            style={styles.lobo}
            resizeMode="contain"
            accessibilityLabel="Símbolo do MaraData"
          />

          <Animated.Image
            source={require('../../assets/images/maradata-estrela.png')}
            style={[
              styles.estrela,
              {
                opacity: opacidadeEstrela,
                transform: [{ rotate: giro }, { scale: escalaEstrela }],
              },
            ]}
            resizeMode="contain"
            accessibilityLabel="Estrela vermelha animada"
          />
        </View>

        <Animated.View
          style={{
            opacity: opacidadeTitulo,
            transform: [{ translateY: deslocamentoTitulo }],
          }}
        >
          <Text style={styles.titulo}>MaraData</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tela: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 184,
    height: 200,
    position: 'relative',
  },
  lobo: {
    width: '100%',
    height: '100%',
  },
  estrela: {
    position: 'absolute',
    width: 33,
    height: 32,
    left: 41,
    top: 75,
  },
  titulo: {
    marginTop: 20,
    color: '#402780',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

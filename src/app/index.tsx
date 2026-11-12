import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ComponentRef } from 'react';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { useEvento } from '../context/eventocontexto';
import { useTema } from '../context/temaContexto';

export default function Home() {
  const { evento: eventoAtivo } = useEvento();
  const { tema, modoEscuro } = useTema();
  const { width: larguraTela, height: alturaTela } = useWindowDimensions();
  const tamanhoQuadrado = 30;
  // Ajuste este multiplicador para controlar até onde a grade aparece.
  const alturaGrade = alturaTela * 0.84;
  const quantidadeColunas = Math.ceil(larguraTela / tamanhoQuadrado) + 1;
  const quantidadeLinhas = Math.ceil(alturaGrade / tamanhoQuadrado) + 1;
  const blurTargetRef = useRef<ComponentRef<typeof View> | null>(null);
  const temEvento = Boolean(eventoAtivo?.nomeEvento);

  // Abre os detalhes do evento se existir, ou vai para o cadastro se estiver vazio.
  function abrirDetalhes() {
    if (!temEvento || !eventoAtivo) {
      router.push('/(funcoes)/eventos');
      return;
    }

    router.push({
      pathname: '/(funcoes)/eventos/detalhes',
      params: {
        eventId: eventoAtivo.id || '',
        nomeEvento: eventoAtivo.nomeEvento,
        localEvento: eventoAtivo.localEvento,
        dataInicio: eventoAtivo.dataInicio,
        dataTermino: eventoAtivo.dataTermino,
        horarioInicio: eventoAtivo.horarioInicio,
        horarioTermino: eventoAtivo.horarioTermino,
        descricao: eventoAtivo.descricao,
        situacao: eventoAtivo.situacao,
      },
    });
  }

  // Abre as filas enviando os dados do evento.
  function abrirFilas() {
    if (!temEvento || !eventoAtivo) {
      router.push('/(funcoes)/filas');
      return;
    }

    router.push({
      pathname: '/(funcoes)/filas',
      params: {
        eventId: eventoAtivo.id || '',
        nomeEvento: eventoAtivo.nomeEvento,
        localEvento: eventoAtivo.localEvento,
        situacao: eventoAtivo.situacao,
      },
    });
  }

  const textoSituacao = !temEvento
    ? 'SEM EVENTO'
    : eventoAtivo?.situacao === 'em_andamento'
      ? 'EM ANDAMENTO'
      : 'AGENDADO';

  const subtituloEvento = !temEvento
    ? 'Cadastre um evento para começar a organizar sua arena.'
    : eventoAtivo?.situacao === 'em_andamento'
      ? 'Seu evento está acontecendo agora.'
      : 'Seu evento está agendado. Confira as informações.';

  return (
    <View style={[styles.homePage, { backgroundColor: tema.background }]}>
      {/* Fundo usado como referência para o efeito de vidro do card. */}
      <BlurTargetView ref={blurTargetRef} style={styles.fundoDesfoque}>
        <LinearGradient
          colors={
            modoEscuro
              ? ['#15101B', '#20172A', '#18121F']
              : ['#F9F7FC', '#F2ECF9', '#F7F3FB']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Grade sutil de papel quadriculado: fica apenas na parte superior da Home. */}
        <View pointerEvents="none" style={[styles.gradeFundo, { height: alturaGrade }]}>
          {Array.from({ length: quantidadeColunas }, (_, indice) => (
            <View
              key={`coluna-${indice}`}
              style={[
                styles.linhaGradeVertical,
                { left: indice * tamanhoQuadrado },
                (indice + 1) % 5 === 0 && styles.linhaGradeDestaque,
              ]}
            />
          ))}

          {Array.from({ length: quantidadeLinhas }, (_, indice) => (
            <View
              key={`linha-${indice}`}
              style={[
                styles.linhaGradeHorizontal,
                { top: indice * tamanhoQuadrado },
                (indice + 1) % 5 === 0 && styles.linhaGradeDestaque,
              ]}
            />
          ))}
        </View>
      </BlurTargetView>

      <View style={styles.conteudo}>
        {/* CARD DO EVENTO */}
        <Pressable
          style={({ pressed }) => [
            styles.eventoCard,
            pressed && styles.eventoCardPressionado,
          ]}
          onPress={abrirDetalhes}
          accessibilityRole="button"
          accessibilityLabel={temEvento ? 'Ver detalhes do evento' : 'Cadastrar evento'}
        >
          <View
            style={[
              styles.eventoCardInterior,
              { backgroundColor: tema.surfaceSecondary, borderColor: tema.border },
            ]}
          >
            <BlurView
              blurTarget={blurTargetRef}
              intensity={32}
              tint={modoEscuro ? 'dark' : 'light'}
              blurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                modoEscuro
                  ? [
                      'rgba(43,33,55,0.94)',
                      'rgba(52,38,67,0.92)',
                      'rgba(43,30,58,0.94)',
                    ]
                  : [
                      'rgba(255,255,255,0.78)',
                      'rgba(239,226,255,0.68)',
                      'rgba(202,171,246,0.52)',
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.eventoCardConteudo}>
              {/* Identificação e situação */}
              <View style={styles.eventoCardTopo}>
                <View style={styles.eventoIdentificacao}>
                  <View style={[styles.eventoIcone, { backgroundColor: tema.surface, borderColor: tema.border }] }>
                    <Ionicons name="game-controller-outline" size={21} color={tema.primary} />
                  </View>
                  <Text style={[styles.eventoEyebrow, { color: tema.primary }]}>EVENTO MARADATA</Text>
                </View>

                <View style={[styles.situacaoPill, { backgroundColor: tema.surface, borderColor: tema.border }] }>
                  <View
                    style={[
                      styles.situacaoPonto,
                      temEvento && eventoAtivo?.situacao === 'em_andamento'
                        ? styles.situacaoPontoAtivo
                        : null,
                    ]}
                  />
                  <Text style={[styles.situacaoTexto, { color: tema.textSecondary }]}>{textoSituacao}</Text>
                </View>
              </View>

              {/* Nome e descrição */}
              <Text style={[styles.eventoNome, { color: tema.text }]} numberOfLines={2}>
                {temEvento ? eventoAtivo?.nomeEvento : 'Nenhum evento cadastrado'}
              </Text>
              <Text style={[styles.eventoSubtitulo, { color: tema.textSecondary }]} numberOfLines={2}>
                {subtituloEvento}
              </Text>

              <View style={[styles.divisor, { backgroundColor: tema.border }]} />

              {/* Informações principais do evento */}
              <View style={styles.informacoesEvento}>
                <View style={styles.informacaoItem}>
                  <View style={[styles.informacaoIcone, { backgroundColor: tema.surface }] }>
                    <Ionicons name="calendar-outline" size={17} color={tema.primary} />
                  </View>
                  <Text style={[styles.informacaoLabel, { color: tema.textSecondary }]}>DATA DE INÍCIO</Text>
                  <Text style={[styles.informacaoValor, { color: tema.text }]} numberOfLines={2}>
                    {temEvento ? eventoAtivo?.dataInicio || 'Não definida' : '—'}
                  </Text>
                </View>

                <View style={[styles.separadorVertical, { backgroundColor: tema.border }]} />

                <View style={styles.informacaoItem}>
                  <View style={[styles.informacaoIcone, { backgroundColor: tema.surface }] }>
                    <Ionicons name="time-outline" size={17} color={tema.primary} />
                  </View>
                  <Text style={[styles.informacaoLabel, { color: tema.textSecondary }]}>HORÁRIO</Text>
                  <Text style={[styles.informacaoValor, { color: tema.text }]} numberOfLines={2}>
                    {temEvento ? eventoAtivo?.horarioInicio || 'Não definido' : '—'}
                  </Text>
                </View>

                <View style={[styles.separadorVertical, { backgroundColor: tema.border }]} />

                <View style={styles.informacaoItem}>
                  <View style={[styles.informacaoIcone, { backgroundColor: tema.surface }] }>
                    <Ionicons name="location-outline" size={17} color={tema.primary} />
                  </View>
                  <Text style={[styles.informacaoLabel, { color: tema.textSecondary }]}>LOCAL</Text>
                  <Text style={[styles.informacaoValor, { color: tema.text }]} numberOfLines={2}>
                    {temEvento ? eventoAtivo?.localEvento || 'Não informado' : '—'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divisorInferior, { backgroundColor: tema.border }]} />

              {/* Ação */}
              <View style={styles.eventoCardRodape}>
                <Text style={[styles.eventoAcaoTexto, { color: tema.primary }]}>
                  {temEvento ? 'Ver detalhes do evento' : 'Cadastrar primeiro evento'}
                </Text>
                <View style={[styles.eventoAcaoIcone, { backgroundColor: tema.primary }]}>
                  <Ionicons name="arrow-forward" size={17} color={tema.primaryText} />
                </View>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={styles.tituloContainer}>
          <Ionicons name="flash-outline" size={25} color={tema.primary} />
          <Text style={[styles.tituloAtalho, { color: tema.text }]}>Acesso rápido</Text>
        </View>

        <View style={styles.grupoCartoes}>
          <View style={styles.linhaCartoes}>
            <Pressable
              onPress={() => router.push('/participantescadastrados')}
              style={[styles.cartao, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}
            >
              <Ionicons name="people-outline" size={42} color={tema.primary} />
              <Text style={[styles.cartaoTitulo, { color: tema.text }]}>Participantes</Text>
              <Text style={[styles.cartaoDescricao, { color: tema.textSecondary }]}>Cadastre e consulte</Text>
            </Pressable>

            <Pressable onPress={abrirFilas} style={[styles.cartao, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Ionicons name="people-circle-outline" size={42} color={tema.primary} />
              <Text style={[styles.cartaoTitulo, { color: tema.text }]}>Fila Virtual</Text>
              <Text style={[styles.cartaoDescricao, { color: tema.textSecondary }]}>Gerencie a fila</Text>
            </Pressable>
          </View>

          <View style={styles.linhaCartoes}>
            <Pressable
              onPress={() => router.push('/estatistica')}
              style={[styles.cartao, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}
            >
              <Ionicons name="stats-chart-outline" size={42} color={tema.primary} />
              <Text style={[styles.cartaoTitulo, { color: tema.text }]}>Estatísticas</Text>
              <Text style={[styles.cartaoDescricao, { color: tema.textSecondary }]}>Veja os resultados</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/eventos')} style={[styles.cartao, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
              <Ionicons name="calendar-outline" size={42} color={tema.primary} />
              <Text style={[styles.cartaoTitulo, { color: tema.text }]}>Eventos</Text>
              <Text style={[styles.cartaoDescricao, { color: tema.textSecondary }]}>Acesse os eventos</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(funcoes)/eventos/historico')}
              style={[styles.cartao, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}
            >
              <Ionicons name="server-outline" size={42} color={tema.primary} />
              <Text style={[styles.cartaoTitulo, { color: tema.text }]}>Histórico</Text>
              <Text style={[styles.cartaoDescricao, { color: tema.textSecondary }]}>Acesse o histórico de eventos</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  homePage: {
    flex: 1,
    backgroundColor: '#F5F1FA',
    alignItems: 'stretch',
  },
  fundoDesfoque: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  gradeFundo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  linhaGradeVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(107, 70, 150, 0.075)',
  },
  linhaGradeHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(107, 70, 150, 0.075)',
  },
  linhaGradeDestaque: {
    backgroundColor: 'rgba(107, 70, 150, 0.13)',
  },
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  eventoCard: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 27,
    shadowColor: '#8150B5',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.16,
    shadowRadius: 19,
    elevation: 7,
  },
  eventoCardPressionado: {
    transform: [{ scale: 0.99 }],
    shadowOpacity: 0.1,
    elevation: 4,
  },
  eventoCardInterior: {
    borderRadius: 27,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.82)',
    overflow: 'hidden',
    backgroundColor: 'rgba(239,226,255,0.58)',
  },
  eventoCardConteudo: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 17,
  },
  eventoCardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  eventoIdentificacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  eventoIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.76)',
  },
  eventoEyebrow: {
    color: '#70419A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.05,
  },
  situacaoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  situacaoPonto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#A58ABF',
  },
  situacaoPontoAtivo: {
    backgroundColor: '#28A56A',
  },
  situacaoTexto: {
    color: '#674184',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.45,
  },
  eventoNome: {
    color: '#342044',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.55,
    marginTop: 17,
  },
  eventoSubtitulo: {
    color: '#705D7F',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    marginTop: 18,
    marginBottom: 14,
  },
  informacoesEvento: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  informacaoItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 7,
  },
  informacaoIcone: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.48)',
    marginBottom: 7,
  },
  informacaoLabel: {
    color: '#856B9C',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  informacaoValor: {
    color: '#432858',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 16,
  },
  separadorVertical: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginHorizontal: 3,
  },
  divisorInferior: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.58)',
    marginTop: 15,
    marginBottom: 12,
  },
  eventoCardRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventoAcaoTexto: {
    color: '#63318E',
    fontSize: 12,
    fontWeight: '800',
  },
  eventoAcaoIcone: {
    width: 29,
    height: 29,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8648C1',
  },
  tituloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 15,
  },
  tituloAtalho: {
    color: '#35105F',
    fontSize: 20,
    fontWeight: 'bold',
  },
  linhaCartoes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  grupoCartoes: {
    flex: 0.87,
    gap: 12,
  },
  cartao: {
    flex: 1,
    backgroundColor: '#F0E4FC',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#DFC5F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  cartaoTitulo: {
    color: '#35105F',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  cartaoDescricao: {
    color: '#7540A8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});
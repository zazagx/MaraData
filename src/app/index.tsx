import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buscarEventoAtivo,
  type EventoAtivo,
} from '../features/armazenamentoEvento';

export default function Home() {
  const [eventoAtivo, setEventoAtivo] = useState<EventoAtivo | null>(null);

  // Atualiza as informações sempre que a Home recebe foco.
  useFocusEffect(
    useCallback(() => {
      setEventoAtivo(buscarEventoAtivo());
    }, [])
  );

  // Abre os detalhes do evento.
  function abrirDetalhes() {
    if (!eventoAtivo) {
      router.push('/eventos');
      return;
    }

  router.push({
  pathname: '/(funcoes)/eventos/detalhes',
  params: {
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
    if (!eventoAtivo) {
      router.push('/filas');
      return;
    }

    router.push({
      pathname: '/filas',
      params: {
        nomeEvento: eventoAtivo.nomeEvento,
        localEvento: eventoAtivo.localEvento,
        situacao: eventoAtivo.situacao,
      },
    });
  }

  return (
    <>
      {/* CARD DO EVENTO */}
      <Pressable
        style={styles.eventoCard}
        onPress={abrirDetalhes}
      >
        <Text style={styles.eventoCardText}>
          {eventoAtivo?.nomeEvento || 'Nenhum evento cadastrado'}
        </Text>

        <Text style={styles.eventoCardText}>
          {eventoAtivo?.localEvento || 'Cadastre um evento para começar'}
        </Text>

        <Text style={styles.eventoCardText}>
          {eventoAtivo
            ? eventoAtivo.situacao === 'em_andamento'
              ? '● Evento em andamento'
              : '● Evento agendado'
            : '● Sem evento ativo'}
        </Text>
      </Pressable>

      {/* BOTÕES PRINCIPAIS */}
      <View style={styles.homePage}>
        <View style={styles.buttonCard}>

          <Pressable
            onPress={() => router.push('/participantescadastrados')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Participantes
            </Text>
          </Pressable>

          <Pressable
            onPress={abrirFilas}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Filas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/estatistica')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Estatísticas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/eventos')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Eventos
            </Text>
          </Pressable>

        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  homePage: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventoCard: {
    backgroundColor: '#9e00fb',
    paddingVertical: 80,
    borderRadius: 20,
    marginTop: 20,
    width: '70%',
    alignSelf: 'center',
    alignItems: 'center',
  },

  eventoCardText: {
    color: '#e4e1e7',
    fontWeight: 'bold',
  },

  buttonCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 50,
    marginBottom: 50,
  },
});

const button = StyleSheet.create({
  button: {
    backgroundColor: '#005bfb',
    width: '40%',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
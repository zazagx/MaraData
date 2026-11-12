import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useEvento } from '../context/eventocontexto';

export default function Home() {
  const { evento: eventoAtivo } = useEvento();

  // Abre os detalhes do evento se existir, ou vai para o cadastro se estiver vazio.
  function abrirDetalhes() {
    if (!eventoAtivo || !eventoAtivo.nomeEvento) {
      router.push('/(funcoes)/eventos');
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
    if (!eventoAtivo || !eventoAtivo.nomeEvento) {
      router.push('/(funcoes)/filas');
      return;
    }

    router.push({
      pathname: '/(funcoes)/filas',
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
          {eventoAtivo && eventoAtivo.nomeEvento
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
            onPress={() => router.push('/(funcoes)/(participantes)/participantescadastrados')}
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
            onPress={() => router.push('/(funcoes)/estatistica')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Estatísticas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(funcoes)/eventos')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Eventos
            </Text>
          </Pressable>
    
          <Pressable
            onPress={() => router.push('/(funcoes)/eventos/historico')}
            style={button.button}
          >
            <Text style={button.buttonText}>
              Histórico
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
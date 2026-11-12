import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {
  buscarEventoAtivo,
  type EventoAtivo,
} from '../features/armazenamentoEvento';

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
    
    <View style={styles.homePage}>
      <View style={styles.conteudo}>

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
      <View style={styles.tituloContainer}> 

        <Ionicons name="flash-outline"
          size={25}
          color="#6A0DAD"
        />

        <Text style={styles.tituloAtalho}>
          Acesso rápido
        </Text>
    </View>
        <View style={styles.grupoCartoes}>
         <View style={styles.linhaCartoes}>

        <Pressable
          onPress={() => router.push('/participantescadastrados')}
          style={styles.cartao}
        >
          <Ionicons
            name="people-outline"
            size={42}
            color="#6A0DAD"
          />

          <Text style={styles.cartaoTitulo}>
            Participantes
          </Text>

          <Text style={styles.cartaoDescricao}>
            Cadastre e consulte
          </Text>
        </Pressable>

        <Pressable
          onPress={abrirFilas}
          style={styles.cartao}
        >
          <Ionicons
            name="people-circle-outline"
            size={42}
            color="#6A0DAD"
          />

          <Text style={styles.cartaoTitulo}>
            Fila Virtual
          </Text>

          <Text style={styles.cartaoDescricao}>
            Gerencie a fila
          </Text>
        </Pressable>

        </View>

     
      <View style={styles.linhaCartoes}>

        <Pressable
          onPress={() => router.push('/estatistica')}
          style={styles.cartao}
        >
          <Ionicons
            name="stats-chart-outline"
            size={42}
            color="#6A0DAD"
          />

          <Text style={styles.cartaoTitulo}>
            Estatísticas
          </Text>

          <Text style={styles.cartaoDescricao}>
            Veja os resultados
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/eventos')}
          style={styles.cartao}
        >
          <Ionicons
            name="calendar-outline"
            size={42}
            color="#6A0DAD"
          />

          <Text style={styles.cartaoTitulo}>
            Eventos
          </Text>

          <Text style={styles.cartaoDescricao}>
            Acesse os eventos
          </Text>
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
    //fontSize: 24,
    //fontWeight: 'bold',
    //justifyContent: 'center',
    alignItems: 'stretch',
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

  grupoCartoes: { //flex para mudar tamanho vertical do grupo de cartões
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

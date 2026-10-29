import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarraJogo } from '../../components/BarraJogo';

export default function EstatisticaScreen() {
  const [eventoSelecionado, setEventoSelecionado] = useState('Arena Games São Luís - MA');

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Seleção de Evento */}
        <View style={styles.section}>
          <Text style={styles.label}>Evento Atual</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>{eventoSelecionado}</Text>
            <Text style={styles.dropdownText}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Cards de Resumo (RF_10) */}
        <View style={styles.cardsRow}>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>842</Text>
            <Text style={styles.cardLabel}>Participantes</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardNumber}>317</Text>
            <Text style={styles.cardLabel}>Partidas</Text>
          </View>
        </View>

        {/* Jogos mais escolhidos - Barras Flexbox */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jogos mais escolhidos</Text>
          <BarraJogo jogo="FIFA" porcentagem={80} />
          <BarraJogo jogo="Minecraft" porcentagem={60} />
          <BarraJogo jogo="Fortnite" porcentagem={45} />
        </View>

        {/* Consoles - Gráfico circular adaptado para o tema claro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consoles Preferidos</Text>
          <View style={styles.donutChart}>
            <Text style={styles.donutText}>PS5</Text>
            <Text style={styles.donutTextStrong}>52%</Text>
          </View>
        </View>

        {/* Botão Roxo Padrão (RF_11) */}
        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.exportButtonText}>Exportar Relatório</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Cinza claro padrão do fundo do app
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E0E0E0', // Fundo cinza dos inputs do app
    borderRadius: 12,
    padding: 15,
  },
  dropdownText: {
    color: '#333333',
    fontSize: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2, // Sombra leve
  },
  cardNumber: {
    color: '#8A2BE2', // Destaque em roxo
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    color: '#333333',
    width: 80,
    fontSize: 14,
    fontWeight: '500',
  },
  barBackground: {
    flex: 1,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#8A2BE2', // Preenchimento roxo
    borderRadius: 7,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#8A2BE2', // Borda roxa
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  donutText: {
    color: '#666666',
    fontSize: 14,
  },
  donutTextStrong: {
    color: '#333333',
    fontSize: 22,
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#8A2BE2', // Botão de ação roxo
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    elevation: 3,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
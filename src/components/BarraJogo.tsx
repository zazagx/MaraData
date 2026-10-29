import { StyleSheet, Text, View } from 'react-native';

// Define os tipos que o componente vai receber
interface BarraJogoProps {
  jogo: string;
  porcentagem: number;
}

// Aplica a interface BarraJogoProps nas propriedades
export const BarraJogo = ({ jogo, porcentagem }: BarraJogoProps) => {
  return (
    <View style={styles.barContainer}>
      <Text style={styles.barLabel}>{jogo}</Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${porcentagem}%` }]} />
      </View>
      <Text style={styles.barPercentage}>{porcentagem}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  barContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  barLabel: { color: '#333333', width: 80, fontSize: 14, fontWeight: '500' },
  barBackground: { flex: 1, height: 14, backgroundColor: '#E0E0E0', borderRadius: 7, overflow: 'hidden', marginRight: 10 },
  barFill: { height: '100%', backgroundColor: '#8A2BE2', borderRadius: 7 },
  barPercentage: { color: '#666666', fontSize: 12, fontWeight: 'bold', width: 35, textAlign: 'right' }
});
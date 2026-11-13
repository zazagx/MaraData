import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../context/temaContexto';

interface BarraJogoProps {
  jogo: string;
  porcentagem: number;
}

export function BarraJogo({ jogo, porcentagem }: BarraJogoProps) {
  const { tema } = useTema();
  const larguraSegura = Math.max(0, Math.min(100, porcentagem));

  return (
    <View style={styles.container}>
      <Text style={[styles.nomeJogo, { color: tema.text }]} numberOfLines={1}>
        {jogo}
      </Text>
      <View style={[styles.trilhaBarra, { backgroundColor: tema.surfaceSecondary, borderColor: tema.border }]}>
        <View
          style={[
            styles.preenchimentoBarra,
            {
              width: `${larguraSegura}%`,
              backgroundColor: tema.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.textoPorcentagem, { color: tema.textSecondary }]}>
        {larguraSegura}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  nomeJogo: {
    width: 100,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  trilhaBarra: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
  },
  preenchimentoBarra: {
    height: '100%',
    borderRadius: 7,
  },
  textoPorcentagem: {
    width: 44,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
    marginLeft: 8,
  },
});
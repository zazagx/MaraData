import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useTema } from '../context/temaContexto';

type BotaoTemaHeaderProps = {
  margemDireita?: number;
};

/** Botão padronizado para alternar o tema em qualquer cabeçalho do aplicativo. */
export default function BotaoTemaHeader({ margemDireita = 8 }: BotaoTemaHeaderProps) {
  const { tema, modoEscuro, alternarTema } = useTema();

  return (
    <Pressable
      style={[styles.botao, { backgroundColor: tema.surfaceSecondary, marginRight: margemDireita }]}
      onPress={alternarTema}
      accessibilityRole="button"
      accessibilityLabel={modoEscuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      hitSlop={6}
    >
      <Ionicons
        name={modoEscuro ? 'sunny-outline' : 'moon-outline'}
        size={21}
        color={tema.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

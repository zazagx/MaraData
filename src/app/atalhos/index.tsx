import { Link } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

export default function shortcutList() {
  return (
    <View style={styles.container}>
      <Text>Shortcut list</Text>
      <Link  href="/atalhos/1"> Adicionar Participante</Link>
      <Link  href="/atalhos/2"> Fila Virtual</Link>
      <Link  href="/atalhos/3"> Estatísticas</Link>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    }
})
import { StyleSheet, Text, View } from 'react-native'

export default function ParticipantesCadastrados() {
  return (
    <View style={styles.container}>
    
      <Text>
        Participantes Cadastrados
        Essa será a tela de cadastro do aplicativo (mostrará participantes cadastrados)
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  })
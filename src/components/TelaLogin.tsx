import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTema } from '../context/temaContexto';
import { supabaseEstaConfigurado } from '../services/supabase';

type Props = {
  onEntrar: (email: string, senha: string) => Promise<void>;
};

export default function TelaLogin({ onEntrar }: Props) {
  const { tema } = useTema();
  const senhaRef = useRef<TextInputInstance>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  const configurado = supabaseEstaConfigurado();

  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoVisivel(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoVisivel(false));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  async function enviar() {
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Informe o e-mail e a senha da conta compartilhada.');
      return;
    }

    Keyboard.dismiss();
    setCarregando(true);
    try {
      await onEntrar(email, senha);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível entrar. Confira os dados e tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.tela, { backgroundColor: tema.background }]}
      behavior="padding"
      enabled
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'none'}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cartao, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <View style={styles.cabecalhoCartao}>
            <View style={styles.titulos}>
              <Text style={[styles.marca, { color: tema.brand }]}>MaraData</Text>
              <Text style={[styles.titulo, { color: tema.text }]}>Acesso da equipe</Text>
            </View>
            {tecladoVisivel && (
              <Pressable
                onPress={Keyboard.dismiss}
                style={[styles.botaoOcultarTeclado, { backgroundColor: tema.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Ocultar teclado"
              >
                <Ionicons name="chevron-down" size={17} color={tema.primary} />
                <Text style={[styles.textoOcultarTeclado, { color: tema.primary }]}>Ocultar</Text>
              </Pressable>
            )}
          </View>

          <Text style={[styles.descricao, { color: tema.textSecondary }]}>Entre com a conta compartilhada da MaraGames. A sessão ficará salva neste dispositivo.</Text>

          <Text style={[styles.rotulo, { color: tema.text }]}>E-mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="e-mail da equipe"
            placeholderTextColor={tema.textSecondary}
            editable={!carregando && configurado}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => senhaRef.current?.focus()}
            style={[styles.campo, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
          />

          <Text style={[styles.rotulo, { color: tema.text }]}>Senha</Text>
          <TextInput
            ref={senhaRef}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            textContentType="password"
            autoComplete="current-password"
            placeholder="Senha da conta"
            placeholderTextColor={tema.textSecondary}
            editable={!carregando && configurado}
            onSubmitEditing={enviar}
            returnKeyType="go"
            style={[styles.campo, { color: tema.text, borderColor: tema.border, backgroundColor: tema.background }]}
          />

          {!configurado && <Text style={[styles.erro, { color: tema.brand }]}>Supabase não configurado. Confira o arquivo .env e reinicie o Expo.</Text>}
          {!!erro && <Text accessibilityLiveRegion="polite" style={[styles.erro, { color: tema.brand }]}>{erro}</Text>}

          <Pressable
            onPress={enviar}
            disabled={carregando || !configurado}
            style={({ pressed }) => [
              styles.botao,
              { backgroundColor: tema.primary, opacity: carregando || !configurado ? 0.55 : pressed ? 0.8 : 1 },
            ]}
          >
            {carregando
              ? <ActivityIndicator color={tema.primaryText} />
              : <Text style={[styles.textoBotao, { color: tema.primaryText }]}>Entrar no MaraData</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 32 },
  cartao: { width: '100%', maxWidth: 440, alignSelf: 'center', borderWidth: 1, borderRadius: 20, padding: 24 },
  cabecalhoCartao: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  titulos: { flex: 1 },
  marca: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  titulo: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  botaoOcultarTeclado: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7, marginTop: 2 },
  textoOcultarTeclado: { fontSize: 12, fontWeight: '700' },
  descricao: { fontSize: 14, lineHeight: 21, marginBottom: 24 },
  rotulo: { fontSize: 14, fontWeight: '700', marginBottom: 7 },
  campo: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, marginBottom: 16, fontSize: 16 },
  erro: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  botao: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  textoBotao: { fontSize: 15, fontWeight: '800' },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { armazenamentoSeguroSupabase } from './armazenamentoSeguro';
import { obterChaveArmazenamentoSupabase } from './chavesArmazenamento';

const CHAVE_INSTALACAO_ASYNC = '@maradata:installation-id';
const CHAVE_INSTALACAO_SECURE = 'maradata.installation.id.v1';
const CHAVE_BANCO = 'maradata.sqlite.sqlcipher.key.v1';
const CHAVE_ACESSO_OFFLINE = 'maradata.offline.access.v1';

async function excluirBancoDeDados(nome: string): Promise<void> {
  // Abrir e fechar cria um arquivo vazio caso ele ainda não exista. Assim,
  // deleteDatabaseAsync pode remover o arquivo e seus sidecars sem depender
  // de uma checagem de existência específica da plataforma.
  const banco = await SQLite.openDatabaseAsync(nome);
  await banco.closeAsync();
  await SQLite.deleteDatabaseAsync(nome);
}

/**
 * Limpa o SQLite legado sem cifra e credenciais antigas do AsyncStorage.
 * Um identificador espelhado em AsyncStorage e SecureStore também detecta
 * reinstalação no iOS, onde itens do Keychain podem sobreviver à desinstalação.
 */
export async function prepararArmazenamentoSeguroInicial(): Promise<void> {
  const idInstalacaoLocal = await AsyncStorage.getItem(CHAVE_INSTALACAO_ASYNC);
  const idInstalacaoSeguro = await SecureStore.getItemAsync(CHAVE_INSTALACAO_SECURE);
  const mesmaInstalacao = Boolean(
    idInstalacaoLocal && idInstalacaoSeguro && idInstalacaoLocal === idInstalacaoSeguro
  );

  if (!mesmaInstalacao) {
    // Primeiro uso desta proteção ou reinstalação: remove o banco legado sem
    // cifra e qualquer base/chave segura restaurada sem vínculo à instalação.
    // A exclusão é segura porque a equipe confirmou que os dados eram testes.
    await excluirBancoDeDados('maradata.db');
    await excluirBancoDeDados('maradata-seguro.db');
    await SecureStore.deleteItemAsync(CHAVE_BANCO).catch(() => undefined);
    await SecureStore.deleteItemAsync(CHAVE_ACESSO_OFFLINE).catch(() => undefined);

    const urlSupabase = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (urlSupabase) {
      const chaveSessao = obterChaveArmazenamentoSupabase(urlSupabase);
      await armazenamentoSeguroSupabase.removeItem(chaveSessao).catch(() => undefined);
    }

    const novoIdInstalacao = Crypto.randomUUID();
    await SecureStore.setItemAsync(CHAVE_INSTALACAO_SECURE, novoIdInstalacao);
    await AsyncStorage.setItem(CHAVE_INSTALACAO_ASYNC, novoIdInstalacao);
  }

  // Remove apenas credenciais legadas. Preferências como o tema permanecem.
  const chaves = await AsyncStorage.getAllKeys();
  const chavesLegadas = chaves.filter(
    (chave) =>
      chave === '@maradata:acesso_offline_autorizado' ||
      (chave.startsWith('sb-') && chave.endsWith('-auth-token'))
  );
  if (chavesLegadas.length > 0) {
    await AsyncStorage.multiRemove(chavesLegadas);
  }
}

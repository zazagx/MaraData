import type { SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { migrateDbIfNeeded } from './migrations';

const CHAVE_CRIPTOGRAFIA_BANCO = 'maradata.sqlite.sqlcipher.key.v1';

function bytesParaHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Inicializa o banco nativo com SQLCipher antes de qualquer migração ou consulta.
 * A chave é aleatória por instalação e nunca é incluída no código ou no banco.
 */
export async function inicializarBancoCriptografado(db: SQLiteDatabase): Promise<void> {
  const sqlCipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!sqlCipher?.cipher_version) {
    throw new Error(
      'Esta build não contém SQLCipher. Não é seguro abrir o banco. Gere uma nova build nativa com useSQLCipher habilitado.'
    );
  }

  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('O armazenamento seguro do dispositivo não está disponível. O banco não será aberto sem proteção da chave.');
  }

  let chave = await SecureStore.getItemAsync(CHAVE_CRIPTOGRAFIA_BANCO);
  if (!chave) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    chave = bytesParaHex(bytes);
    await SecureStore.setItemAsync(CHAVE_CRIPTOGRAFIA_BANCO, chave);
  }

  // A chave é validada antes de ser interpolada no PRAGMA, que não aceita bind parameters.
  if (!/^[0-9a-f]{64}$/i.test(chave)) {
    throw new Error('A chave segura do banco está inválida. O banco foi bloqueado para evitar acesso sem criptografia.');
  }

  await db.execAsync(`PRAGMA key = '${chave}';`);

  try {
    // A primeira leitura de páginas valida se a chave corresponde ao arquivo.
    await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM sqlite_master');
  } catch {
    throw new Error(
      'Não foi possível desbloquear o banco criptografado. A chave não corresponde ao arquivo ou o banco está danificado. Nenhum banco novo será criado automaticamente.'
    );
  }

  await db.execAsync(`
    PRAGMA cipher_memory_security = ON;
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
  `);

  await migrateDbIfNeeded(db);

  // Verificação final: não prossegue se a build não confirmar SQLCipher.
  const verificacao = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!verificacao?.cipher_version) {
    throw new Error('A verificação final do SQLCipher falhou. O MaraData foi bloqueado por segurança.');
  }
}

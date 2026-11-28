import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

/**
 * Adaptador de armazenamento compatível com o contrato usado pelo Supabase.
 * A sessão fica protegida pelo Android Keystore / iOS Keychain.
 * Valores são divididos em blocos pequenos para evitar limites de payload do Keychain.
 */
const TAMANHO_MAXIMO_BLOCO_UTF8 = 1500;
const VERSAO_MANIFESTO = 1;

type Manifesto = {
  versao: number;
  geracao: string;
  quantidade: number;
};

function bytesUtf8(caractere: string): number {
  const codificado = encodeURIComponent(caractere);
  const percentuais = codificado.match(/%[0-9A-F]{2}/gi)?.length ?? 0;
  return codificado.length - percentuais * 2;
}

function dividirEmBlocos(valor: string): string[] {
  const blocos: string[] = [];
  let atual = '';
  let tamanho = 0;

  for (const caractere of Array.from(valor)) {
    const tamanhoCaractere = bytesUtf8(caractere);
    if (atual.length > 0 && tamanho + tamanhoCaractere > TAMANHO_MAXIMO_BLOCO_UTF8) {
      blocos.push(atual);
      atual = '';
      tamanho = 0;
    }
    atual += caractere;
    tamanho += tamanhoCaractere;
  }

  if (atual.length > 0 || blocos.length === 0) blocos.push(atual);
  return blocos;
}

function lerManifesto(valor: string | null): Manifesto | null {
  if (!valor) return null;
  try {
    const manifesto = JSON.parse(valor) as Manifesto;
    if (
      manifesto.versao !== VERSAO_MANIFESTO ||
      typeof manifesto.geracao !== 'string' ||
      !Number.isInteger(manifesto.quantidade) ||
      manifesto.quantidade < 1 ||
      manifesto.quantidade > 256
    ) {
      throw new Error('Manifesto de armazenamento seguro inválido.');
    }
    return manifesto;
  } catch (erro) {
    throw new Error(`Não foi possível ler a sessão protegida: ${String(erro)}`);
  }
}

function chaveBloco(chave: string, geracao: string, indice: number): string {
  return `${chave}.g.${geracao}.${indice}`;
}

export const armazenamentoSeguroSupabase = {
  async getItem(chave: string): Promise<string | null> {
    const manifestoBruto = await SecureStore.getItemAsync(`${chave}.manifest`);
    const manifesto = lerManifesto(manifestoBruto);

    // Compatibilidade para valores simples gravados diretamente no SecureStore.
    if (!manifesto) return SecureStore.getItemAsync(chave);

    const blocos = await Promise.all(
      Array.from({ length: manifesto.quantidade }, (_, indice) =>
        SecureStore.getItemAsync(chaveBloco(chave, manifesto.geracao, indice))
      )
    );

    if (blocos.some((bloco) => bloco === null)) {
      throw new Error('A sessão protegida está incompleta. Entre novamente quando houver internet.');
    }

    return blocos.join('');
  },

  async setItem(chave: string, valor: string): Promise<void> {
    const chaveManifesto = `${chave}.manifest`;
    const manifestoAnterior = lerManifesto(await SecureStore.getItemAsync(chaveManifesto));
    const geracao = Crypto.randomUUID();
    const blocos = dividirEmBlocos(valor);

    // Grava todos os blocos primeiro. O manifesto só é atualizado no final,
    // para uma interrupção não deixar a sessão anterior parcialmente substituída.
    await Promise.all(
      blocos.map((bloco, indice) =>
        SecureStore.setItemAsync(chaveBloco(chave, geracao, indice), bloco)
      )
    );

    const novoManifesto: Manifesto = {
      versao: VERSAO_MANIFESTO,
      geracao,
      quantidade: blocos.length,
    };
    await SecureStore.setItemAsync(chaveManifesto, JSON.stringify(novoManifesto));

    if (manifestoAnterior) {
      // A geração anterior já não é referenciada. Falha na limpeza de sobras
      // não deve invalidar o token recém-gravado.
      await Promise.allSettled(
        Array.from({ length: manifestoAnterior.quantidade }, (_, indice) =>
          SecureStore.deleteItemAsync(chaveBloco(chave, manifestoAnterior.geracao, indice))
        )
      );
    }
    await SecureStore.deleteItemAsync(chave).catch(() => undefined);
  },

  async removeItem(chave: string): Promise<void> {
    const manifesto = lerManifesto(await SecureStore.getItemAsync(`${chave}.manifest`));
    // Remove o manifesto primeiro: depois disso nenhum leitor consegue
    // reconstruir a sessão, mesmo se a limpeza física de algum bloco falhar.
    await SecureStore.deleteItemAsync(`${chave}.manifest`);
    if (manifesto) {
      await Promise.allSettled(
        Array.from({ length: manifesto.quantidade }, (_, indice) =>
          SecureStore.deleteItemAsync(chaveBloco(chave, manifesto.geracao, indice))
        )
      );
    }
    await SecureStore.deleteItemAsync(chave).catch(() => undefined);
  },
};

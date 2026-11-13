import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useAutenticacao } from '../context/autenticacaoContexto';
import { baixarDadosRemotos, sincronizarOutbox } from '../services/sincronizacao';

const INTERVALO_ENVIO_MS = 20_000;
const INTERVALO_DOWNLOAD_MS = 60_000;

/** Envia alterações locais periodicamente e baixa atualizações remotas ao abrir/retomar o app. */
export default function SincronizacaoAutomatica() {
  const db = useSQLiteContext();
  const { sessao } = useAutenticacao();
  const executando = useRef(false);

  useEffect(() => {
    if (!sessao) return;
    let ativo = true;

    async function executarSincronizacao() {
      if (!ativo || executando.current) return;
      executando.current = true;

      try {
        const envio = await sincronizarOutbox(db);
        if (envio.status === 'erro') {
          console.warn('MaraData: não foi possível enviar alterações locais:', envio.mensagem);
        } else if (envio.enviados > 0) {
          console.info(`MaraData: ${envio.enviados} operação(ões) enviada(s) ao Supabase.`);
        }

        const ultimaBaixa = await db.getFirstAsync<{ valor: string }>(
          "SELECT valor FROM sync_metadata WHERE chave = 'ultima_baixa_remota'"
        );
        const ultimaBaixaEmMs = ultimaBaixa ? Date.parse(ultimaBaixa.valor) : Number.NaN;
        const deveBaixar = !Number.isFinite(ultimaBaixaEmMs) ||
          Date.now() - ultimaBaixaEmMs >= INTERVALO_DOWNLOAD_MS;

        if (deveBaixar) {
          const download = await baixarDadosRemotos(db);
          if (download.status === 'erro') {
            console.warn('MaraData: não foi possível baixar dados do Supabase:', download.mensagem);
          } else if (download.status === 'concluido') {
            console.info(
              `MaraData: ${download.baixados} registro(s) recebido(s); ` +
              `${download.ignoradosComAlteracaoLocal} preservado(s) por terem alterações locais pendentes.`
            );
          }
        }
      } catch (erro) {
        console.warn('MaraData: falha na sincronização; os dados locais foram preservados:', erro);
      } finally {
        executando.current = false;
      }
    }

    // Na primeira abertura após o login, a ausência de metadata dispara o download completo.
    void executarSincronizacao();
    const intervalo = setInterval(() => void executarSincronizacao(), INTERVALO_ENVIO_MS);
    const inscricao = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void executarSincronizacao();
    });

    return () => {
      ativo = false;
      clearInterval(intervalo);
      inscricao.remove();
    };
  }, [db, sessao?.user.id]);

  return null;
}

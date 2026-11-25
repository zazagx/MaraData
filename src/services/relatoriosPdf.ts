import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  buscarEstatisticasEvento,
  buscarEstatisticasGerais,
  type DiaEstatistica,
  type EstatisticasEvento,
  type EstatisticasGerais,
  type EventoListaEstatistica,
  type FaixaEtaria,
  type FeedbackEstatistica,
  type IndicadorSimNao,
  type RankingJogo,
} from '../features/armazenamentoEstatisticas';

function escaparHtml(valor: unknown): string {
  return String(valor ?? '').replace(/[&<>"']/g, (caractere) => {
    const entidades: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entidades[caractere] ?? caractere;
  });
}

function formatarData(valor?: string | null): string {
  if (!valor) return 'Não informada';
  const texto = String(valor).trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const brasileira = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brasileira) return texto;
  return texto;
}

function formatarIntervalo(evento: EventoListaEstatistica): string {
  const inicio = formatarData(evento.dataInicio);
  const fim = evento.dataTermino ? formatarData(evento.dataTermino) : '';
  return fim && fim !== inicio ? `${inicio} a ${fim}` : inicio;
}

function formatarDataHoraGeracao(): string {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

function formatarPercentual(valor: number): string {
  return `${formatarNumero(valor)}%`;
}

function percentual(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

function statusEvento(valor: string): string {
  if (valor === 'em_andamento') return 'Em andamento';
  if (valor === 'encerrado') return 'Encerrado';
  return 'Agendado';
}

function statusDia(valor: string): string {
  if (valor === 'em_andamento') return 'Em andamento';
  if (valor === 'concluido') return 'Concluído';
  if (valor === 'nao_realizado') return 'Não realizado';
  return 'Não iniciado';
}

function documentoHtml(titulo: string, subtitulo: string, conteudo: string): string {
  const geradoEm = escaparHtml(formatarDataHoraGeracao());
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escaparHtml(titulo)}</title>
  <style>
    @page { size: A4; margin: 14mm 13mm 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #211a2b; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.45; }
    .cabecalho { border-bottom: 3px solid #6435a5; padding: 0 0 12px; margin-bottom: 16px; }
    .marca { color: #6435a5; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
    h1 { margin: 5px 0 3px; color: #26163d; font-size: 23px; line-height: 1.2; }
    .subtitulo { color: #655d6f; font-size: 11px; margin: 0 0 9px; }
    .gerado { display: inline-block; color: #5f5668; background: #f3eff8; border-radius: 5px; padding: 5px 8px; font-size: 9px; }
    .secao { margin: 15px 0 0; }
    .secao h2 { color: #42216c; font-size: 13px; border-bottom: 1px solid #ded5eb; padding: 0 0 5px; margin: 0 0 7px; page-break-after: avoid; break-after: avoid; }
    .descricao-secao { margin: -2px 0 8px; color: #706879; font-size: 9px; }
    .grade { width: 100%; border-collapse: separate; border-spacing: 5px; margin: -5px; }
    .grade td { width: 50%; vertical-align: top; background: #f6f3fa; border: 1px solid #e5dced; border-radius: 6px; padding: 8px; }
    .metrica-label { display: block; color: #71677c; font-size: 8px; font-weight: 700; }
    .metrica-valor { display: block; color: #291944; font-size: 17px; font-weight: 800; margin-top: 2px; }
    .metrica-detalhe { display: block; color: #71677c; font-size: 8px; margin-top: 2px; }
    table.dados { width: 100%; border-collapse: collapse; margin: 7px 0 3px; }
    table.dados th { background: #eee8f5; color: #3e2c55; font-weight: 800; text-align: left; }
    table.dados th, table.dados td { border: 1px solid #e4deea; padding: 6px 7px; vertical-align: top; }
    table.dados td.numero, table.dados th.numero { text-align: right; white-space: nowrap; }
    table.dados tr:nth-child(even) td { background: #faf9fc; }
    .nota { color: #706879; font-size: 8px; margin: 6px 0 0; }
    .vazio { color: #746b7c; background: #f7f5f9; border-radius: 5px; padding: 8px; margin: 6px 0; }
    .texto { white-space: pre-wrap; margin: 5px 0 0; }
    .rodape { border-top: 1px solid #e4deea; color: #81788a; font-size: 8px; margin-top: 22px; padding-top: 7px; }
    @media print { .secao h2 { page-break-after: avoid; } }
  </style>
</head>
<body>
  <header class="cabecalho">
    <div class="marca">MaraGames • MaraData</div>
    <h1>${escaparHtml(titulo)}</h1>
    <p class="subtitulo">${escaparHtml(subtitulo)}</p>
    <div class="gerado">Relatório gerado em ${geradoEm}</div>
  </header>
  ${conteudo}
  <footer class="rodape">Relatório gerado pelo MaraData. Os indicadores refletem os dados disponíveis neste dispositivo no momento da geração.</footer>
</body>
</html>`;
}

type Metrica = { titulo: string; valor: string | number; detalhe?: string };

function renderizarMetricas(itens: Metrica[]): string {
  if (!itens.length) return '';
  const linhas: string[][] = [];
  for (let indice = 0; indice < itens.length; indice += 2) {
    linhas.push(itens.slice(indice, indice + 2).map((item) => `
      <td>
        <span class="metrica-label">${escaparHtml(item.titulo)}</span>
        <span class="metrica-valor">${escaparHtml(item.valor)}</span>
        ${item.detalhe ? `<span class="metrica-detalhe">${escaparHtml(item.detalhe)}</span>` : ''}
      </td>`));
  }
  return `<table class="grade"><tbody>${linhas.map((linha) => `<tr>${linha.length === 1 ? `${linha[0]}<td></td>` : linha.join('')}</tr>`).join('')}</tbody></table>`;
}

function secao(titulo: string, conteudo: string, descricao?: string): string {
  return `<section class="secao"><h2>${escaparHtml(titulo)}</h2>${descricao ? `<p class="descricao-secao">${escaparHtml(descricao)}</p>` : ''}${conteudo}</section>`;
}

function tabela(cabecalhos: string[], linhas: Array<Array<string | number>>, alinhamentosNumericos: number[] = []): string {
  if (!linhas.length) return '<p class="vazio">Não há dados registrados para esta seção.</p>';
  const th = cabecalhos.map((cabecalho, indice) => `<th${alinhamentosNumericos.includes(indice) ? ' class="numero"' : ''}>${escaparHtml(cabecalho)}</th>`).join('');
  const tbody = linhas.map((linha) => `<tr>${linha.map((celula, indice) => `<td${alinhamentosNumericos.includes(indice) ? ' class="numero"' : ''}>${escaparHtml(celula)}</td>`).join('')}</tr>`).join('');
  return `<table class="dados"><thead><tr>${th}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function renderizarFaixas(faixas: FaixaEtaria[], predominante: string | null): string {
  const destaque = predominante
    ? `<p class="nota"><strong>Faixa etária predominante:</strong> ${escaparHtml(predominante)}</p>`
    : '<p class="nota">Não foi possível identificar uma faixa predominante com os dados disponíveis.</p>';
  return destaque + tabela(
    ['Faixa etária', 'Participantes', 'Percentual'],
    faixas.map((faixa) => [faixa.faixa, formatarNumero(faixa.quantidade), formatarPercentual(faixa.porcentagem)]),
    [1, 2]
  );
}

function renderizarSimNao(titulo: string, dados: IndicadorSimNao): string {
  return secao(titulo, renderizarMetricas([
    { titulo: 'Sim', valor: formatarNumero(dados.sim) },
    { titulo: 'Não', valor: formatarNumero(dados.nao) },
    { titulo: 'Respostas válidas', valor: formatarNumero(dados.total) },
  ]));
}

function renderizarRanking(titulo: string, itens: RankingJogo[], unidade: string): string {
  const linhas = itens.map((item, indice) => [
    `${indice + 1}. ${item.nome}`,
    `${formatarNumero(item.quantidade)} ${unidade}`,
    formatarNumero(item.participantes),
  ]);
  return secao(titulo, tabela(['Jogo', 'Quantidade', 'Participantes'], linhas, [1, 2]));
}

function renderizarDias(dias: DiaEstatistica[]): string {
  return tabela(
    ['Dia', 'Data', 'Situação', 'Participantes'],
    dias.map((dia) => [
      `Dia ${dia.numero}`,
      formatarData(dia.data),
      statusDia(dia.status),
      formatarNumero(dia.participantes),
    ]),
    [3]
  );
}

function renderizarDistribuicaoNotas(titulo: string, notas: number[]): string {
  return secao(titulo, tabela(
    ['Nota', 'Quantidade de avaliações'],
    notas.map((quantidade, indice) => [`${indice + 1} estrela(s)`, formatarNumero(quantidade)]),
    [1]
  ));
}

function renderizarFeedback(dados: FeedbackEstatistica, inscritos: number): string {
  const taxaResposta = percentual(dados.total, inscritos);
  let html = renderizarMetricas([
    { titulo: 'Avaliações respondidas', valor: formatarNumero(dados.total) },
    { titulo: 'Taxa de resposta dos inscritos', valor: formatarPercentual(taxaResposta) },
    { titulo: 'Gostaram do evento', valor: formatarNumero(dados.gostaram), detalhe: `${percentual(dados.gostaram, dados.total)}% das avaliações` },
    { titulo: 'Não gostaram do evento', valor: formatarNumero(dados.naoGostaram) },
    { titulo: 'Média da arena', valor: dados.mediaArena === null ? '—' : `${dados.mediaArena.toFixed(1)}/5` },
    { titulo: 'Queriam outro jogo', valor: formatarNumero(dados.queriamOutroJogo) },
    { titulo: 'Não queriam outro jogo', valor: formatarNumero(dados.naoQueriamOutroJogo) },
    { titulo: 'Usaram as filas', valor: formatarNumero(dados.usaramFila) },
    { titulo: 'Não usaram as filas', valor: formatarNumero(dados.naoUsaramFila) },
    { titulo: 'Média da experiência com filas', valor: dados.mediaFila === null ? '—' : `${dados.mediaFila.toFixed(1)}/5` },
  ]);

  if (dados.total === 0) {
    return html + '<p class="vazio">Ainda não há avaliações registradas.</p>';
  }

  html += renderizarDistribuicaoNotas('Distribuição das notas da arena', dados.notasArena);
  if (dados.usaramFila > 0) {
    html += renderizarDistribuicaoNotas('Distribuição das notas das filas', dados.notasFila);
  }
  html += renderizarRanking('Jogos que os participantes sentiram falta', dados.jogosSolicitados, 'solicitação(ões)');
  return html;
}

function renderizarIdentificacaoEvento(evento: EventoListaEstatistica): string {
  const descricao = evento.descricao?.trim()
    ? `<p class="texto">${escaparHtml(evento.descricao)}</p>`
    : '<p class="nota">Sem descrição cadastrada.</p>';
  return secao('Identificação do evento', renderizarMetricas([
    { titulo: 'Local', valor: evento.localEvento || 'Não informado' },
    { titulo: 'Período', valor: formatarIntervalo(evento) },
    { titulo: 'Horário de início', valor: evento.horarioInicio || 'Não informado' },
    { titulo: 'Horário de término', valor: evento.horarioTermino || 'Não informado' },
    { titulo: 'Situação', valor: statusEvento(evento.situacao) },
  ]) + `<span class="metrica-label">Descrição</span>${descricao}`);
}

function montarRelatorioEvento(dados: EstatisticasEvento): string {
  const evento = dados.evento;
  let html = renderizarIdentificacaoEvento(evento);
  html += secao('Resumo do evento', renderizarMetricas([
    { titulo: 'Participantes inscritos', valor: formatarNumero(dados.inscritos) },
    { titulo: 'Pessoas presentes', valor: formatarNumero(dados.presentes), detalhe: `${percentual(dados.presentes, dados.inscritos)}% dos inscritos` },
    { titulo: 'Comparecimentos por dia', valor: formatarNumero(dados.presencas) },
    { titulo: 'Retornaram em outro dia', valor: formatarNumero(dados.retornaramEmMaisDeUmDia) },
  ]));
  html += secao(
    'Presença diária',
    renderizarDias(dados.dias),
    'Cada dia é contabilizado individualmente. A mesma pessoa pode aparecer em mais de um dia.'
  );
  html += secao(
    'Perfil dos participantes deste evento',
    renderizarFaixas(dados.faixasEtarias, dados.maiorFaixaEtaria),
    'Utiliza os dados preservados na inscrição deste evento.'
  );
  html += renderizarSimNao('Conhecimento do mercado de games', dados.conhecimentoMercado);
  html += renderizarSimNao('Interesse profissional na área de games', dados.interesseProfissional);
  html += renderizarRanking(
    'Jogos mais jogados neste evento',
    dados.jogosJogados,
    'participações'
  ) + '<p class="nota">As participações são registradas por pessoa e por dia; não representam o número de partidas ou rodadas.</p>';
  html += renderizarRanking('Jogos de maior interesse neste evento', dados.jogosInteresse, 'participantes');
  html += secao('Operação das filas', renderizarMetricas([
    { titulo: 'Filas criadas', valor: formatarNumero(dados.filas.total) },
    { titulo: 'Entradas nas filas', valor: formatarNumero(dados.filas.entradas) },
    { titulo: 'Atendimentos', valor: formatarNumero(dados.filas.atendimentos) },
    { titulo: 'Aguardando', valor: formatarNumero(dados.filas.aguardando) },
  ]), 'Indicadores de uso das filas do evento.');
  html += secao(
    'Avaliação dos participantes',
    renderizarFeedback(dados.feedback, dados.inscritos),
    'Resultados dos feedbacks enviados após a participação.'
  );
  return html;
}

function montarCrescimento(eventos: EventoListaEstatistica[]): string {
  const linhas = eventos.map((evento, indice) => {
    const anterior = indice > 0 ? eventos[indice - 1].presentes : null;
    const diferenca = anterior === null ? null : evento.presentes - anterior;
    const variacao = anterior !== null && anterior > 0 && diferenca !== null
      ? Math.round((diferenca / anterior) * 100)
      : null;
    const comparacao = diferenca === null
      ? 'Primeiro da série'
      : `${diferenca > 0 ? '+' : ''}${formatarNumero(diferenca)}${variacao === null ? '' : ` (${variacao > 0 ? '+' : ''}${variacao}%)`}`;
    return [evento.nome, formatarIntervalo(evento), formatarNumero(evento.presentes), comparacao];
  });
  return secao(
    'Crescimento do público',
    tabela(['Evento', 'Período', 'Participantes únicos', 'Variação em relação ao anterior'], linhas, [2, 3]),
    'Participantes únicos presentes em cada um dos últimos eventos encerrados.'
  );
}

function montarRelatorioGeral(dados: EstatisticasGerais): string {
  let html = secao('Panorama da MaraGames', renderizarMetricas([
    { titulo: 'Participantes cadastrados', valor: formatarNumero(dados.participantesCadastrados) },
    { titulo: 'Eventos realizados', valor: formatarNumero(dados.eventosRealizados) },
    { titulo: 'Pessoas que já compareceram', valor: formatarNumero(dados.pessoasQueJaCompareceram) },
    { titulo: 'Comparecimentos por dia', valor: formatarNumero(dados.totalPresencas), detalhe: 'Uma pessoa em dois dias conta duas vezes.' },
    { titulo: 'Taxa de retorno', valor: formatarPercentual(dados.taxaRetorno), detalhe: `${formatarNumero(dados.pessoasQueRetornaram)} pessoas participaram de mais de um evento.` },
    { titulo: 'Aprovação geral', valor: dados.totalAvaliacoes > 0 ? formatarPercentual(dados.taxaAprovacaoEventos) : '—', detalhe: `${formatarNumero(dados.totalAvaliacoes)} avaliações • satisfação média da arena ${dados.satisfacaoMediaGeral === null ? '—' : `${dados.satisfacaoMediaGeral.toFixed(1)}/5`}` },
  ]));
  html += secao(
    'Perfil dos participantes cadastrados',
    renderizarFaixas(dados.faixasEtarias, dados.maiorFaixaEtaria),
    'Faixa etária atual e respostas registradas no cadastro.'
  );
  html += renderizarSimNao('Conhecimento do mercado de games', dados.conhecimentoMercado);
  html += renderizarSimNao('Interesse profissional na área de games', dados.interesseProfissional);
  html += renderizarRanking('Jogos mais jogados', dados.jogosJogados, 'participações') + '<p class="nota">As participações são registradas por pessoa e por dia; não representam o número de partidas ou rodadas.</p>';
  html += renderizarRanking('Jogos de maior interesse', dados.jogosInteresse, 'participantes');
  html += renderizarRanking('Jogos mais solicitados', dados.jogosSolicitados, 'solicitações');
  html += montarCrescimento(dados.crescimentoPublico);

  if (dados.ultimoEvento) {
    const ultimo = dados.ultimoEvento;
    html += secao('Último evento realizado',
      `<h3>${escaparHtml(ultimo.evento.nome)}</h3><p class="nota">${escaparHtml(formatarIntervalo(ultimo.evento))}</p>` +
      renderizarMetricas([
        { titulo: 'Inscritos', valor: formatarNumero(ultimo.inscritos) },
        { titulo: 'Pessoas presentes', valor: formatarNumero(ultimo.presentes) },
        { titulo: 'Comparecimentos', valor: formatarNumero(ultimo.presencas) },
        { titulo: 'Voltaram em outro dia', valor: formatarNumero(ultimo.retornaramEmMaisDeUmDia) },
      ]) +
      `<h3>Presença em cada dia</h3>${renderizarDias(ultimo.dias)}<h3>Opinião sobre o evento</h3>${renderizarFeedback(ultimo.feedback, ultimo.inscritos)}`
    );
  } else {
    html += secao('Último evento realizado', '<p class="vazio">Ainda não há evento encerrado para apresentar.</p>');
  }
  return html;
}

function formatarSufixoNomeArquivo(data: Date = new Date()): string {
  const doisDigitos = (valor: number) => String(valor).padStart(2, '0');
  const dia = doisDigitos(data.getDate());
  const mes = doisDigitos(data.getMonth() + 1);
  const ano = data.getFullYear();
  const hora = doisDigitos(data.getHours());
  const minuto = doisDigitos(data.getMinutes());
  const segundo = doisDigitos(data.getSeconds());

  return `${dia}-${mes}-${ano}_${hora}-${minuto}-${segundo}`;
}

function normalizarNomeArquivo(nome: string): string {
  const normalizado = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return normalizado || 'Evento';
}

async function gerarECompartilhar(html: string, identificacaoArquivo: string): Promise<void> {
  if (Platform.OS === 'web') {
    // No navegador, o Expo abre a caixa de impressão; nela é possível salvar como PDF.
    await Print.printAsync({ html });
    return;
  }

  const arquivo = await Print.printToFileAsync({ html });
  const compartilhamentoDisponivel = await Sharing.isAvailableAsync();
  if (!compartilhamentoDisponivel) {
    throw new Error('O compartilhamento de arquivos não está disponível neste dispositivo.');
  }

  // Carrega o FileSystem somente em dispositivos nativos; a versão Web usa a impressão do navegador.
  const { File } = await import('expo-file-system');
  const arquivoNomeado = new File(arquivo.uri);
  arquivoNomeado.rename(`${identificacaoArquivo} ${formatarSufixoNomeArquivo()}.pdf`);

  await Sharing.shareAsync(arquivoNomeado.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartilhar relatório PDF',
    UTI: 'com.adobe.pdf',
  });
}

export async function compartilharRelatorioGeral(db: SQLiteDatabase): Promise<void> {
  const dados = await buscarEstatisticasGerais(db);
  const html = documentoHtml(
    'Relatório geral',
    'Panorama consolidado de participantes, eventos, jogos e avaliações.',
    montarRelatorioGeral(dados)
  );
  await gerarECompartilhar(html, 'Relatorio geral');
}

export async function compartilharRelatorioEvento(db: SQLiteDatabase, eventId: string): Promise<void> {
  const dados = await buscarEstatisticasEvento(db, eventId);
  if (!dados) {
    throw new Error('Não foi possível localizar os dados deste evento neste dispositivo.');
  }

  const html = documentoHtml(
    `Relatório do evento — ${dados.evento.nome}`,
    `${formatarIntervalo(dados.evento)} • ${dados.evento.localEvento || 'Local não informado'}`,
    montarRelatorioEvento(dados)
  );
  await gerarECompartilhar(html, `Relatorio_${normalizarNomeArquivo(dados.evento.nome)}`);
}

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { CoresTema } from './temaContexto';
import { useTema } from './temaContexto';

type EstilosBase = Record<string, unknown>;

function analisarCor(valor: string) {
  const hexadecimal = valor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexadecimal) {
    let hex = hexadecimal[1];
    if (hex.length === 3) hex = hex.split('').map((parte) => parte + parte).join('');
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgb = valor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return null;
}

function classificarCor(valor: string) {
  const rgb = analisarCor(valor);
  if (!rgb) return { luminancia: 1, matiz: -1, saturacao: 0 };

  const { r, g, b } = rgb;
  const maximo = Math.max(r, g, b);
  const minimo = Math.min(r, g, b);
  const delta = maximo - minimo;
  let matiz = 0;

  if (delta !== 0) {
    if (maximo === r) matiz = ((g - b) / delta) % 6;
    else if (maximo === g) matiz = (b - r) / delta + 2;
    else matiz = (r - g) / delta + 4;
    matiz *= 60;
    if (matiz < 0) matiz += 360;
  }

  const luminancia = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const saturacao = maximo === 0 ? 0 : delta / maximo;
  return { luminancia, matiz, saturacao };
}

function adaptarCor(propriedade: string, valor: string, tema: CoresTema): string {
  const cor = valor.trim();
  const minuscula = cor.toLowerCase();

  // Mantém transparências para overlays, sombras e efeitos de vidro.
  if (minuscula.startsWith('rgba(') || minuscula.startsWith('rgb(') || minuscula === 'transparent') {
    return valor;
  }

  const { luminancia, matiz, saturacao } = classificarCor(cor);
  const roxo = matiz >= 245 && matiz <= 300 && saturacao > 0.18;
  const verde = matiz >= 80 && matiz <= 165 && saturacao > 0.22;
  const vermelho = (matiz <= 18 || matiz >= 340) && saturacao > 0.25;
  const branco = luminancia > 0.985 && saturacao < 0.12;

  if (propriedade === 'color' || propriedade === 'tintColor' || propriedade === 'placeholderTextColor') {
    if (branco) return valor;
    if (verde || vermelho) return valor;
    if (roxo) return tema.primary;
    if (luminancia < 0.32) return tema.text;
    return tema.textSecondary;
  }

  if (propriedade.toLowerCase().includes('border') && propriedade.toLowerCase().includes('color')) {
    if (vermelho || verde) return valor;
    if (roxo && luminancia < 0.55) return tema.primary;
    return tema.border;
  }

  if (propriedade === 'backgroundColor') {
    if (verde || vermelho) return valor;
    if (roxo) {
      // Banners em roxo muito escuro mantêm a identidade visual original.
      if (luminancia < 0.20) return valor;
      if (luminancia > 0.78) return tema.surfaceSecondary;
      return tema.primary;
    }
    if (branco) return tema.surface;
    if (luminancia < 0.22) return tema.surface;
    if (luminancia < 0.75) return tema.surfaceSecondary;
    return tema.background;
  }

  return valor;
}

function transformarEstilo(valor: unknown, tema: CoresTema, propriedadePai = ''): unknown {
  if (Array.isArray(valor)) {
    return valor.map((item) => transformarEstilo(item, tema, propriedadePai));
  }

  if (typeof valor === 'string') {
    return adaptarCor(propriedadePai, valor, tema);
  }

  if (!valor || typeof valor !== 'object') return valor;

  const resultado: Record<string, unknown> = {};
  for (const [propriedade, conteudo] of Object.entries(valor as Record<string, unknown>)) {
    resultado[propriedade] = transformarEstilo(conteudo, tema, propriedade);
  }
  return resultado;
}

/**
 * Converte os estilos estáticos de uma tela em estilos sensíveis ao tema global.
 * Dimensões, espaçamentos, alinhamentos e demais propriedades permanecem intactos.
 */
export function useEstilosTema<T extends EstilosBase>(estilosBase: T): T {
  const { tema } = useTema();

  return useMemo(() => {
    const resultado: Record<string, unknown> = {};
    for (const [nome, estilo] of Object.entries(estilosBase)) {
      const estiloPlano = StyleSheet.flatten(estilo as never);
      resultado[nome] = transformarEstilo(estiloPlano, tema);
    }
    return resultado as T;
  }, [estilosBase, tema]);
}

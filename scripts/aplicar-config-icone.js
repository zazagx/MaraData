#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const configPath = path.resolve(process.cwd(), 'app.json');
if (!fs.existsSync(configPath)) {
  console.error('Não encontrei app.json. Execute este script na raiz do projeto MaraData.');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Não foi possível ler app.json como JSON válido:', error);
  process.exit(1);
}

if (!config.expo) config.expo = {};
const expo = config.expo;
expo.icon = './assets/images/icon.png';
expo.ios = expo.ios || {};
expo.ios.icon = './assets/images/icon.png';
expo.android = expo.android || {};
expo.android.icon = './assets/images/icon.png';
expo.android.adaptiveIcon = {
  ...(expo.android.adaptiveIcon || {}),
  backgroundColor: '#FFFFFF',
  foregroundImage: './assets/images/android-icon-foreground.png',
};
delete expo.android.adaptiveIcon.backgroundImage;
delete expo.android.adaptiveIcon.monochromeImage;

const splashOptions = {
  backgroundColor: '#FFFFFF',
  image: './assets/images/maradata-lobo-com-estrela.png',
  imageWidth: 180,
  resizeMode: 'contain',
};
let splashFound = false;
expo.plugins = (expo.plugins || []).map((plugin) => {
  if (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') {
    splashFound = true;
    return ['expo-splash-screen', { ...(plugin[1] || {}), ...splashOptions }];
  }
  if (plugin === 'expo-splash-screen') {
    splashFound = true;
    return ['expo-splash-screen', splashOptions];
  }
  return plugin;
});
if (!splashFound) expo.plugins.push(['expo-splash-screen', splashOptions]);

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
console.log('Ícone e Splash atualizados. As demais configurações de app.json foram preservadas.');

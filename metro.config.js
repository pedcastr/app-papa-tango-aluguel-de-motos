const { getDefaultConfig } = require('@expo/metro-config');
const config = getDefaultConfig(__dirname);

// Adiciona suporte para arquivos .cjs
config.resolver.sourceExts.push('cjs');

// Adiciona suporte explícito para arquivos TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Configuração para SVG
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;

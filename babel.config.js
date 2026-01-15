module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@contexts': './src/contexts',
            '@utils': './src/utils',
            '@types': './src/types',
            '@config': './src/config',
            '@navigation': './src/navigation',
            '@assets': './src/assets',
            '@design-system': './src/design-system',
          },
        },
      ],
    ],
  };
};



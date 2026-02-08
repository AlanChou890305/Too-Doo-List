module.exports = function(api) {
  api.cache(true);

  const plugins = [
    'react-native-reanimated/plugin',
  ];

  // Remove console.log in production for better performance
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', {
      exclude: ['error', 'warn'] // Keep error and warn logs
    }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};

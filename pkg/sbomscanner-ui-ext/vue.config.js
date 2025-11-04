// Load Rancher’s base Vue config
const baseConfig = require('./.shell/pkg/vue.config')(__dirname);

module.exports = {
  ...baseConfig,
  configureWebpack: (config) => {
    // Run base Rancher config first
    if (typeof baseConfig.configureWebpack === 'function') {
      baseConfig.configureWebpack(config);
    } else if (typeof baseConfig.configureWebpack === 'object') {
      Object.assign(config, baseConfig.configureWebpack);
    }

    // Explicitly disable or polyfill Node core modules
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs:     false,
      module: false,
      path:   false,
      os:     false,
      crypto: false,
      stream: false,
    };
  },
};

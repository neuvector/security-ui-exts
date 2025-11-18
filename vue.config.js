const path = require('path');
const config = require('@rancher/shell/vue.config');

module.exports = () => {
  const vendorConfig = config(__dirname, { excludes: [] });

  // Extend the chainWebpack hook to add our alias
  if (typeof vendorConfig.chainWebpack === 'function') {
    const originalChainWebpack = vendorConfig.chainWebpack;

    vendorConfig.chainWebpack = (webpackConfig) => {
      // Call the original chainWebpack configuration first
      originalChainWebpack(webpackConfig);
      // Add the @sbomscanner alias pointing to the pkg/sbomscanner folder
      webpackConfig.resolve.alias.set('@sbomscanner', path.resolve(__dirname, 'pkg/sbomscanner'));
    };
  } else {
    vendorConfig.chainWebpack = (webpackConfig) => {
      webpackConfig.resolve.alias.set('@sbomscanner', path.resolve(__dirname, 'pkg/sbomscanner'));
    };
  }

  return vendorConfig;
};

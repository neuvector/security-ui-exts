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
      // Add the @sbomscanner-ui-ext alias pointing to the pkg/sbomscanner-ui-ext folder
      webpackConfig.resolve.alias.set('@sbomscanner-ui-ext', path.resolve(__dirname, 'pkg/sbomscanner-ui-ext'));
    };
  } else {
    vendorConfig.chainWebpack = (webpackConfig) => {
      webpackConfig.resolve.alias.set('@sbomscanner-ui-ext', path.resolve(__dirname, 'pkg/sbomscanner-ui-ext'));
    };
  }

  return vendorConfig;
};
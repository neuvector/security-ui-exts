module.exports = {
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root:  ['.'],
            alias: {
              '@':                                       '.',
              '~':                                       '.',
              '@benchmark-compliance':                   './pkg/benchmark-compliance',
              '@sbombastic-image-vulnerability-scanner': './pkg/sbombastic-image-vulnerability-scanner',
              '@network':                                './pkg/network',
              '@runtime-process-profile':                './pkg/runtime-process-profile',
            },
          },
        ],
      ],
      presets: [
        '@babel/preset-env',
        '@babel/preset-typescript'
      ],
    },
  },
};

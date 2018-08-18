const merge = require("webpack-merge");
const { attachRevision, generateSourceMaps } = require('./webpack.parts');
const nodeConfig = require('./webpack.node');
const browserConfig = require('./webpack.browser');

module.exports = env =>
  merge(
    attachRevision(),
    generateSourceMaps({ type: 'source-map' }),
    {
      mode: 'production',
      context: __dirname,
      entry: {
        litemessage: './index.js'
      },
      ...(env.BUILD_TARGET === 'node' ? nodeConfig : browserConfig)
    }
  );

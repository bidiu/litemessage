const merge = require("webpack-merge");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
  generateSourceMaps, devServer
} = require('./webpack.parts');
const nodeConfig = require('./webpack.node');
const browserConfig = require('./webpack.browser');

module.exports = env =>
  merge(
    env.BUILD_TARGET === 'node' ? {} : devServer({ port: 8080 }),
    generateSourceMaps({ type: 'source-map' }),
    {
      plugins: [
        new HtmlWebpackPlugin({
          title: 'litemessage'
        }),
      ],
    },
    {
      mode: 'development',
      context: __dirname,
      entry: {
        litemessage: './index.js'
      },
      ...(env.BUILD_TARGET === 'node' ? nodeConfig : browserConfig)
    }
  );

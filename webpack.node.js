const path = require('path');
const merge = require("webpack-merge");
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { defineBuildPhaseVariables } = require('./webpack.parts');

module.exports = merge(
  defineBuildPhaseVariables({
    'BUILD_TARGET': 'node'
  }),
  {
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'index.js',
      library: 'litemessage',
      libraryTarget: 'commonjs2',
    },
    target: 'node',
    externals: [nodeExternals()],
    optimization: {
      minimize: false
    },
    node: {
      __dirname: false,
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: path.join(__dirname, 'src/liteprotocol/mine.js'),
          to: path.join(__dirname, 'dist')
        }
      ])
    ]
  }
);

const path = require('path');
const merge = require("webpack-merge");
const {
  generateSourceMaps, defineBuildPhaseVariables,
  minifyJavaScript, loadJavaScript
} = require('./webpack.parts');

module.exports = merge(
  defineBuildPhaseVariables({
    'BUILD_TARGET': 'browser'
  }),
  loadJavaScript({ exclude: /node_modules/ }),
  generateSourceMaps({ type: 'source-map' }),
  minifyJavaScript(),
  {
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].umd.js',
      library: 'litemessage',
      libraryTarget: 'umd',
    },
    target: 'webworker',
    optimization: {
      minimize: false
    },
  }
);

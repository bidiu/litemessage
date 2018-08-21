const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require("clean-webpack-plugin");
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");

exports.devServer = ({ host, port } = {}) => ({
  devServer: {
    host,
    port,
    open: true,
    overlay: true,
  }
});

exports.loadJavaScript = ({ include, exclude } = {}) => ({
  module: {
    rules: [
      {
        test: /\.js$/,
        include,
        exclude,
        use: "babel-loader",
      },
    ]
  }
});

exports.generateSourceMaps = ({ type }) => ({
  devtool: type,
  output: {
    devtoolModuleFilenameTemplate: info => 
      path.resolve(info.absoluteResourcePath)
  }
});

exports.clean = path => ({
  plugins: [new CleanWebpackPlugin([path])],
});

exports.attachRevision = () => ({
  plugins: [
    new webpack.BannerPlugin({
      banner: new GitRevisionPlugin().version(),
    }),
  ],
});

exports.minifyJavaScript = ({ sourceMap = true, ...rest } = {}) => ({
  optimization: {
    minimizer: [new UglifyWebpackPlugin({ sourceMap, ...rest })],
  },
});

exports.defineBuildPhaseVariables = (obj) => {
  let env = {};
  for (let [key, val] of Object.entries(obj)) {
    env[key] = JSON.stringify(val);
  }

  return {
    plugins: [
      new webpack.DefinePlugin(env)
    ]
  };
};

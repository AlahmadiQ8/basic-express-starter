const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const merge = require('webpack-merge');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const autoprefixer = require('autoprefixer');

const script = process.env.npm_lifecycle_event; // see package.json scripts

var common = {

  context: path.resolve(__dirname, "src"),

  entry: {
    index: './js/index.js',
    vendor: ['bootstrap'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(scss|css)$/,
        use: ExtractTextPlugin.extract({
          fallback: { loader: 'style-loader', options: { sourceMap: true } },
          use: [{ loader: 'css-loader', options: { importLoaders: 2 } },
            'postcss-loader',
            'sass-loader'],
        }),
      },
      {
        exclude: [
          /\.html$/,
          /\.(js|jsx)$/,
          /\.(css|scss)$/,
          /\.json$/,
          /\.svg$/,
          /\.(ttf|eot|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        ],
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: 'img/[name].[ext]',
          },
        },
      },
      {
        test: /\.svg$/,
        exclude: /fonts\//,
        loader: 'file-loader',
        query: {
          name: 'img/[name].[ext]',
        },
      },
      {
        test: /\.(svg|ttf|eot|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
        include: /fonts\//,
        loader: 'file-loader',
        query: {
          name: '/css/fonts/[name].[ext]',
        },
      },

    ],
  },

  plugins: [
    new ExtractTextPlugin(
      {
        filename: getPath => getPath('css/[name].css'),
        disable: script === 'dev',
      }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      Tether: 'tether',
    }),
  ],
};

let config;

switch (script) {

  case 'build':
    config = merge(
      common,
      {
        devtool: 'inline-source-map',
        plugins: [
          new CleanWebpackPlugin('dist', {
            root: process.cwd(),
          }),
          new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: false,
              drop_console: false,
            },
          }),
          // new PurifyCSSPlugin({
          //   paths: glob.sync(path.join(__dirname, 'src', '*.html')),
          //   minimize: true,
          // }),
          new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, 'src/index.html'),
          }),
          new webpack.DefinePlugin({
            'process.env': {
              NODE_ENV: JSON.stringify('production'),
            },
          }),
        ],
      });
    break;

  default:
    config = merge(
      common,
      {
        devtool: 'eval-source-map',
        devServer: {
          historyApiFallback: true,
          contentBase: path.join(__dirname, 'src'),
          hot: true,
          inline: true,
          stats: 'errors-only',
          overlay: {
            errors: true,
            warnings: true,
          },
          host: process.env.HOST, // Defaults to `localhost`
          port: process.env.PORT, // Defaults to 8080
        },
        plugins: (() => {
          const plugins = [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NamedModulesPlugin(),
          ];
          if (script === 'dev') {
            plugins.push(new HtmlWebpackPlugin({
              filename: 'index.html',
              template: path.join(__dirname, 'src/index.html'),
            }));
          }
          return plugins;
        })(),
      });

}

module.exports = config;

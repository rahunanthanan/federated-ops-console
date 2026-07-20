const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

/**
 * Shell (host). Deliberately does NOT declare `remotes` here - remote entry
 * URLs are resolved at runtime from apps/shell/public/manifest.[env].json
 * rather than hard-coded as build-time constants. The ModuleFederationPlugin
 * is still required on the host so the webpack share scope
 * (__webpack_share_scopes__) exists for dynamically loaded remotes to attach to.
 */
module.exports = {
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
    headers: { 'Access-Control-Allow-Origin': '*' }
  },
  output: {
    publicPath: 'auto',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  resolve: { extensions: ['.tsx', '.ts', '.js'] },
  module: {
    rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: 'babel-loader' }]
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: deps.react, eager: true },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true }
      }
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' })
  ]
};

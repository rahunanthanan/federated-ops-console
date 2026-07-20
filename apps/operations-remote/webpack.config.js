const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

/**
 * "operations" remote. Exposes a single public module surface (./App) per the
 * spec's "small public module surface" rule - internal components, hooks and
 * the request schema are NOT exposed and cannot be imported by the shell or
 * other remotes directly.
 */
module.exports = {
  entry: './src/index.tsx',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devServer: {
    port: 3001,
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
      name: 'operations',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx'
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react, eager: true },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'], eager: true }
      }
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' })
  ]
};

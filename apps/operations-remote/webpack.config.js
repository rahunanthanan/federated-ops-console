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
    headers: (req, res, context) => {
      // webpack-dev-server can't statically detect a wildcard ACAO once
      // `headers` is a function (needed here for per-path Cache-Control), so
      // it defensively adds Cross-Origin-Resource-Policy: same-origin - which
      // would block the shell (port 3000) from cross-origin-loading this
      // remote's scripts. Override it explicitly - this dev server
      // intentionally serves cross-origin for Module Federation.
      const base = { 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin' };
      // remoteEntry.js has a stable, non-hashed filename by design (consumers
      // need a fixed URL to reference) so, like the manifest, it can't rely on
      // its URL changing to signal new content - it must be revalidated every
      // request. See the caching strategy comment in
      // apps/shell/src/remotes/loadRemote.ts.
      if (req.url === '/remoteEntry.js') {
        return { ...base, 'Cache-Control': 'no-cache' };
      }
      // Everything remoteEntry.js references is content-hashed
      // ([contenthash] in output.chunkFilename below), so a changed file is
      // always a new URL - safe to cache forever.
      if (req.url && /\.[0-9a-f]{8}\.js$/.test(req.url)) {
        return { ...base, 'Cache-Control': 'public, max-age=31536000, immutable' };
      }
      return base;
    }
  },
  output: {
    publicPath: 'auto',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    filename: '[name].js',
    chunkFilename: '[name].[contenthash:8].js'
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

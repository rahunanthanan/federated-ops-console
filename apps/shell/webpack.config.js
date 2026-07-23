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
    headers: (req, res, context) => {
      // webpack-dev-server can't statically detect a wildcard ACAO once
      // `headers` is a function (needed here for per-path Cache-Control), so
      // it defensively adds Cross-Origin-Resource-Policy: same-origin - which
      // would block the shell's cross-origin remoteEntry.js script load.
      // Override it explicitly since this dev server intentionally serves
      // cross-origin for Module Federation.
      const base = { 'Access-Control-Allow-Origin': '*', 'Cross-Origin-Resource-Policy': 'cross-origin' };
      // The manifest is the version-discovery source of truth - it must never
      // be served stale, or a shipped remote update would silently go unseen.
      // See the caching strategy comment in src/remotes/loadRemote.ts.
      if (req.url && req.url.startsWith('/manifest.local.json')) {
        return { ...base, 'Cache-Control': 'no-cache' };
      }
      return base;
    }
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

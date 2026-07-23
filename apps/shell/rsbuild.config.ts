import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

/**
 * Rsbuild/Rspack variant of webpack.config.js - same shell setup on a
 * different bundler, kept as close to it as the two plugin APIs allow.
 *
 * `remotes` is empty here too: remote resolution still happens at runtime
 * via manifest.local.json + src/remotes/loadRemote.ts, completely unchanged.
 * That file works unmodified against a Rspack-built remote because Rspack's
 * Module Federation runtime is wire-compatible with webpack 5's - same
 * `__webpack_share_scopes__` / `__webpack_init_sharing__` globals and
 * container `.init()`/`.get()` API.
 *
 * Config differences from webpack.config.js worth speaking to live:
 * - Plugin API: `pluginModuleFederation(options)` instead of
 *   `new ModuleFederationPlugin(options)`. The options object itself
 *   (name/remotes/exposes/shared) is the same shape, since
 *   @module-federation/enhanced deliberately mirrors webpack's MF options
 *   for cross-bundler portability.
 * - The correct npm package is `@module-federation/rsbuild-plugin` -
 *   `@rsbuild/plugin-module-federation` does not exist on npm.
 * - JSX/TS transform + Fast Refresh come from `@rsbuild/plugin-react`
 *   (SWC-based) instead of babel-loader + @babel/preset-react - no
 *   babel.config.js involved in this variant.
 * - `server.headers` in Rsbuild only accepts a static object applied to
 *   every response - not a per-request function like webpack-dev-server's
 *   `devServer.headers`. That means the path-conditional Cache-Control
 *   strategy in webpack.config.js (manifest vs. remoteEntry vs. hashed
 *   chunks) is NOT replicated here; doing so would need a custom Rsbuild
 *   server middleware hook rather than a config option. Left out
 *   intentionally to keep this variant scoped to the federation setup.
 * - No HtmlWebpackPlugin registration needed - `html.template` below is
 *   Rsbuild's built-in equivalent.
 */
export default defineConfig({
  source: {
    entry: { index: './src/index.tsx' }
  },
  server: {
    port: 3000,
    historyApiFallback: true,
    // Required for the remote's cross-origin script load to succeed at all -
    // separate from (and simpler than) the Cache-Control strategy noted
    // above, which this static headers object can't express.
    headers: { 'Access-Control-Allow-Origin': '*' }
  },
  html: {
    template: './public/index.html'
  },
  output: {
    distPath: { root: 'dist-rsbuild' }
  },
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {},
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1', eager: true },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1', eager: true }
      }
    })
  ]
});

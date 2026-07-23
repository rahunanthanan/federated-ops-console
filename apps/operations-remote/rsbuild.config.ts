import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

/**
 * Rsbuild/Rspack variant of webpack.config.js for the operations remote.
 * Same `exposes: { './App': ... }` public surface as the webpack build - see
 * apps/shell/rsbuild.config.ts for the shared config-difference notes
 * (plugin API shape, correct package name, SWC vs babel, and why the
 * Cache-Control header strategy isn't replicated in this variant).
 */
export default defineConfig({
  source: {
    entry: { index: './src/index.tsx' }
  },
  server: {
    port: 3001,
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
      name: 'operations',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1', eager: true },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1', eager: true }
      }
    })
  ]
});

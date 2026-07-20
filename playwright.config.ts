import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke config. Runs both dev servers, then drives the shell in a real
 * browser to prove the federated remote actually mounts at runtime - not
 * just that both projects compile independently.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'npm run start:remote', port: 3001, reuseExistingServer: true, timeout: 60_000 },
    { command: 'npm run start:shell', port: 3000, reuseExistingServer: true, timeout: 60_000 }
  ]
});

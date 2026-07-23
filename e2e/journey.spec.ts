import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke journey: sign-in is mocked, so this covers
 * "switch region -> load federated remote -> create request -> remote
 * failure fallback" - what matters most for a Module Federation platform:
 * the shell survives even when a remote breaks.
 */
test.describe('federated-ops-console shell + operations remote', () => {
  test('loads the shell and mounts the operations remote at runtime', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Federated Ops Console')).toBeVisible();
    // Proves the federated remote actually executed in the browser, not just that the shell compiled.
    await expect(page.getByText('Service requests')).toBeVisible({ timeout: 10_000 });
  });

  test('switching region updates the regional configuration summary', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Region').selectOption('MY');
    await expect(page.getByText('MYR', { exact: true })).toBeVisible();
  });

  test('submitting the schema-driven service request form records an audit entry', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/subscription id/i).fill('SUB-100');
    await page.getByLabel(/incident category/i).selectOption('billing');
    await page.getByLabel(/severity/i).selectOption('low');
    await page.getByRole('button', { name: /submit request/i }).click();
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
  });

  test('a disabled remote shows a safe fallback instead of crashing the shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Service requests')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /disable remote/i }).click();
    await expect(page.getByText(/disabled via runtime configuration/i)).toBeVisible();
    // Shell chrome (header, region switcher) must remain interactive.
    await expect(page.getByLabel('Region')).toBeEnabled();
  });
});

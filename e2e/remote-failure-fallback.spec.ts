import { test, expect } from '@playwright/test';

/**
 * Simulates the remote actually being unavailable at the network level -
 * distinct from journey.spec.ts's kill-switch test, which exercises the
 * `enabled: false` UI path. This exercises loadRemote.ts's real timeout/
 * retry/failure path via RemoteLoader's ErrorBoundary-adjacent error state.
 */
test.describe('remote network failure', () => {
  test('shell renders a scoped error card and stays usable when remoteEntry.js is unreachable', async ({ page }) => {
    await page.route('http://localhost:3001/remoteEntry.js', (route) => route.abort());

    await page.goto('/');

    await expect(page.getByText(/operations.*is temporarily unavailable/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();

    // The rest of the shell - header, region selector - must stay fully usable.
    await expect(page.getByText('Federated Ops Console')).toBeVisible();
    await expect(page.getByLabel('Region')).toBeEnabled();
    await page.getByLabel('Region').selectOption('HK');
    await expect(page.getByText('HKD', { exact: true })).toBeVisible();
  });
});

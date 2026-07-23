import { test, expect } from '@playwright/test';

/**
 * Focused mount check: the shell has no client-side router (a single page,
 * not an "/operations" route), so this asserts the operations remote's
 * exposed component - SchemaForm - actually renders inside the shell on
 * load, field-by-field, rather than just checking the section heading.
 */
test.describe('shell mounts the operations remote', () => {
  test('SchemaForm fields render inside the shell page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Federated Ops Console')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Service requests' })).toBeVisible({ timeout: 10_000 });

    // These fields only exist in operations-remote's serviceRequestSchema -
    // their presence proves the remote's own code executed in the shell's
    // document, not just that a placeholder card rendered.
    await expect(page.getByLabel(/subscription id/i)).toBeVisible();
    await expect(page.getByLabel(/incident category/i)).toBeVisible();
    await expect(page.getByLabel(/severity/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /submit request/i })).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

test('home page shows the API health answer', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText('API: ok');
});

import { expect, test } from '@playwright/test';

test('a signed-out visitor is sent to the sign-in page', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Sign in to SunoAI' }),
  ).toBeVisible();
});

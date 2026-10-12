import { expect, test } from '@playwright/test';

for (const path of ['/', '/calls/a-call-that-does-not-exist']) {
  test(`a signed-out visitor to ${path} is sent to the sign-in page`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Sign in to SunoAI' }),
    ).toBeVisible();
  });
}

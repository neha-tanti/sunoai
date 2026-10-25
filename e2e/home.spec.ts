import { expect, test } from '@playwright/test';
import { createTestAdminClient } from './support/team-leader';

test('a signed-out visitor sees what SunoAI does and a way in', async ({
  page,
}) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'Hear where a support call went wrong.',
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try it' })).toBeVisible();
});

test('a signed-out visitor to a call is sent to the homepage', async ({
  page,
}) => {
  await page.goto('/calls/a-call-that-does-not-exist');

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Try it' })).toBeVisible();
});

test.describe('Try it', () => {
  let startedAt: Date;

  test.beforeEach(() => {
    startedAt = new Date();
  });

  test.afterEach(async () => {
    const admin = createTestAdminClient();
    const listed = await admin.auth.admin.listUsers();
    if (listed.error) throw listed.error;
    const visitors = listed.data.users.filter(
      (user) => user.is_anonymous && new Date(user.created_at) >= startedAt,
    );
    for (const visitor of visitors) {
      const deleted = await admin.auth.admin.deleteUser(visitor.id);
      if (deleted.error) throw deleted.error;
    }
  });

  test('opens Check a call without an account', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Try it' }).click();

    await expect(page).toHaveURL(/\/check$/, { timeout: 30_000 });
    await expect(
      page.getByRole('heading', { name: 'Check a call' }),
    ).toBeVisible();
  });
});

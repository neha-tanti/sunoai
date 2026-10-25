import { expect, test, type Page } from '@playwright/test';
import { deleteTeamLeader, signedInUserId } from './support/team-leader';

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
  const visitorIds: string[] = [];

  async function tryIt(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try it' }).click();
    await expect(page).toHaveURL(/\/check$/, { timeout: 30_000 });
    visitorIds.push(await signedInUserId(page));
  }

  test.afterEach(async () => {
    for (const id of visitorIds.splice(0)) await deleteTeamLeader(id);
  });

  test('opens Check a call without an account', async ({ page }) => {
    await tryIt(page);

    await expect(
      page.getByRole('heading', { name: 'Check a call' }),
    ).toBeVisible();
  });

  test('shows a visitor the checklist without letting them change it', async ({
    page,
  }) => {
    await tryIt(page);

    await page.goto('/checklist');

    await expect(
      page.getByText('Visitors can read the checklist but not change it.'),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Checks' }).getByText('Smooth handover'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Save checklist' }),
    ).toHaveCount(0);
  });
});

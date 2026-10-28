import { randomUUID } from 'node:crypto';
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
  await expect(
    page.getByRole('button', { name: 'Try an example call' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Powered by Gnani.ai' }),
  ).toHaveAttribute('href', 'https://gnani.ai');
});

test.describe('theme switch', () => {
  test.describe('on a light system', () => {
    test.use({ colorScheme: 'light' });

    test('switches to dark and remembers it after a reload', async ({
      page,
    }) => {
      await page.goto('/');
      const toggle = page.getByRole('button', { name: 'Dark mode' });
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');

      await toggle.click();

      await expect(page.locator('html')).toContainClass('dark');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await page.reload();
      await expect(page.locator('html')).toContainClass('dark');
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('on a dark system', () => {
    test.use({ colorScheme: 'dark' });

    test('starts dark, and a switch to light is remembered', async ({
      page,
    }) => {
      await page.goto('/');
      const toggle = page.getByRole('button', { name: 'Dark mode' });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('html')).toContainClass('dark');

      await toggle.click();
      await page.reload();

      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('html')).not.toContainClass('dark');
    });
  });
});

test('a signed-out visitor to a report link is offered that report', async ({
  page,
}) => {
  const id = randomUUID();
  await page.goto(`/calls/${id}`);

  await expect(page).toHaveURL(`/?next=%2Fcalls%2F${id}`);
  await expect(
    page.getByText('Someone shared a SunoAI report with you.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open the report' }),
  ).toBeVisible();
});

test('a next link that is not a report is ignored', async ({ page }) => {
  await page.goto('/?next=//evil.example');

  await expect(
    page.getByRole('button', { name: 'Try an example call' }),
  ).toBeVisible();
  await expect(
    page.getByText('Someone shared a SunoAI report with you.'),
  ).toHaveCount(0);
});

test('a signed-out visitor to another app page is sent to the homepage', async ({
  page,
}) => {
  await page.goto('/checklist');

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('button', { name: 'Try an example call' }),
  ).toBeVisible();
});

test('a page that does not exist says so and offers a way in', async ({
  page,
}) => {
  const res = await page.goto('/menu-for-diwali');

  expect(res?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: "This page doesn't exist." }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Try an example call' }),
  ).toBeVisible();
});

test.describe('Try it', () => {
  const visitorIds: string[] = [];

  async function tryIt(page: Page) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try an example call' }).click();
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

  test('opens a shared report without an account', async ({ page }) => {
    const id = randomUUID();
    await page.goto(`/calls/${id}`);

    await page.getByRole('button', { name: 'Open the report' }).click();

    await expect(page).toHaveURL(`/calls/${id}`, { timeout: 30_000 });
    visitorIds.push(await signedInUserId(page));
    await expect(
      page.getByRole('heading', { name: 'Call not found' }),
    ).toBeVisible();
  });

  test('shows a visitor the checklist without letting them change it', async ({
    page,
  }) => {
    await tryIt(page);

    await page.goto('/checklist');

    await expect(
      page.getByText(
        "Only the team leader's account can change the checklist. Visitors can read it here.",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Checks' }).getByText('Smooth handover'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Save checklist' }),
    ).toHaveCount(0);
  });
});

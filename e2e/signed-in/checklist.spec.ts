import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { keepChecklist } from '@/server/test/checklist';
import { createDevAdminClient } from '../support/team-leader';

const SAVED = 'Saved. The next call you check uses this checklist.';
const run = randomUUID().slice(0, 8);
let restoreChecklist: () => Promise<void>;

test.beforeAll(async () => {
  restoreChecklist = await keepChecklist(createDevAdminClient());
});

test.afterAll(async () => {
  await restoreChecklist();
});

test('a team leader edits a check and saves it', async ({ page }) => {
  const rule = `Reads the order number back before anything else (${run})`;
  await page.goto('/checklist');

  await page
    .getByRole('group', { name: 'Check 1' })
    .getByLabel('Passes when the agent…')
    .fill(rule);
  await page.getByRole('button', { name: 'Save checklist' }).click();

  await expect(page.getByRole('status')).toHaveText(SAVED);
  await page.reload();
  await expect(
    page
      .getByRole('group', { name: 'Check 1' })
      .getByLabel('Passes when the agent…'),
  ).toHaveValue(rule);
});

test('a new check is added at the end, and removing it takes it out', async ({
  page,
}) => {
  const name = `Offers the Diwali coupon (${run})`;
  await page.goto('/checklist');
  const checks = page.getByRole('region', { name: 'Checks' });

  await checks.getByRole('button', { name: 'Add a check' }).click();
  const added = checks.getByRole('group').last();
  await added.getByLabel('Name').fill(name);
  await added
    .getByLabel('Passes when the agent…')
    .fill('Mentions the festival coupon before ending the call');
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByRole('status')).toHaveText(SAVED);
  await page.reload();

  const saved = checks.getByRole('group').last();
  await expect(saved.getByLabel('Name')).toHaveValue(name);
  await saved.getByRole('button', { name: /^Remove check/ }).click();
  await page.getByRole('button', { name: 'Save checklist' }).click();
  await expect(page.getByRole('status')).toHaveText(SAVED);
  await page.reload();

  await expect(
    checks.getByRole('group').last().getByLabel('Name'),
  ).not.toHaveValue(name);
});

test('a blank name is stopped before saving', async ({ page }) => {
  await page.goto('/checklist');
  const name = page.getByRole('group', { name: 'Check 1' }).getByLabel('Name');

  await name.fill('   ');
  await page.getByRole('button', { name: 'Save checklist' }).click();

  expect(
    await name.evaluate((input: HTMLInputElement) => input.validity.valid),
  ).toBe(false);
  await expect(page.getByRole('status')).toHaveCount(0);
});

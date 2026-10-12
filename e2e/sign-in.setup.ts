import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
import {
  createDevAdminClient,
  TEAM_LEADER_ID_FILE,
  TEAM_LEADER_STATE,
} from './support/team-leader';

setup('sign in a team leader made for this run', async ({ page }) => {
  const email = `e2e-team-leader-${randomUUID()}@example.test`;
  const password = randomUUID();
  const created = await createDevAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  mkdirSync(dirname(TEAM_LEADER_ID_FILE), { recursive: true });
  writeFileSync(TEAM_LEADER_ID_FILE, created.data.user.id);

  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

  await page.context().storageState({ path: TEAM_LEADER_STATE });
});

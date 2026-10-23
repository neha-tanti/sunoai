import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const TEAM_LEADER_STATE = 'e2e/.auth/team-leader.json';
export const TEAM_LEADER_ID_FILE = 'e2e/.auth/team-leader-id.txt';

export function createDevAdminClient() {
  process.loadEnvFile('.env.local');
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function createTeamLeader() {
  const email = `e2e-team-leader-${randomUUID()}@example.test`;
  const password = randomUUID();
  const created = await createDevAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error) throw created.error;
  return { id: created.data.user.id, email, password };
}

export async function deleteTeamLeader(id: string) {
  const deleted = await createDevAdminClient().auth.admin.deleteUser(id);
  if (deleted.error) throw deleted.error;
}

export async function signIn(
  page: Page,
  { email, password }: { email: string; password: string },
) {
  await page.goto('/login');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
}

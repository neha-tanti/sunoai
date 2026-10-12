import { expect, test } from '@playwright/test';

const TEAM_LEADER = {
  email: 'priya.lead@swiggly.example',
  password: 'masala-dosa-42',
};

test('a wrong password says so and keeps the visitor on the sign-in page', async ({
  page,
}) => {
  await page.route('**/auth/v1/token?grant_type=password**', (route) =>
    route.fulfill({
      status: 400,
      json: {
        code: 400,
        error_code: 'invalid_credentials',
        msg: 'Invalid login credentials',
      },
    }),
  );
  await page.goto('/login');

  await page.getByLabel('Work email').fill(TEAM_LEADER.email);
  await page.getByLabel('Password').fill(TEAM_LEADER.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'Wrong email or password.',
  );
  await expect(page).toHaveURL(/\/login$/);
});

test('signing up with an email that already has an account points to sign in', async ({
  page,
}) => {
  await page.route('**/auth/v1/signup**', (route) =>
    route.fulfill({
      status: 422,
      json: {
        code: 422,
        error_code: 'user_already_exists',
        msg: 'User already registered',
      },
    }),
  );
  await page.goto('/signup');

  await page.getByLabel('Work email').fill(TEAM_LEADER.email);
  await page.getByLabel('Password').fill(TEAM_LEADER.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Sign in instead',
  );
});

test('a signed-out visitor can move between sign in and sign up', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Create an account' }).click();

  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole('heading', { name: 'Create your SunoAI account' }),
  ).toBeVisible();
});

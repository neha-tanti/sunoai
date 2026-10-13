import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import {
  CALM_QUESTION_REPORT,
  CALM_QUESTION_SEGMENTS,
  COLD_BIRYANI_REPORT,
  COLD_BIRYANI_SEGMENTS,
  deleteCalls,
  seedReadyCall,
} from '../support/ready-call';
import { createDevAdminClient } from '../support/team-leader';

const run = randomUUID().slice(0, 8);
const titles = {
  coldBiryani: `Cold biryani, AI asked for the order ID again (${run})`,
  calmQuestion: `Sunday delivery question (${run})`,
  silent: `Silent line after the greeting (${run})`,
  toDelete: `Wrong dessert, customer hung up (${run})`,
};
const ids: string[] = [];

async function seedSilentCall() {
  const id = randomUUID();
  const inserted = await createDevAdminClient()
    .from('calls')
    .insert({
      id,
      title: titles.silent,
      file_path: `${id}/recording.mp3`,
      file_size_bytes: 120_000,
      mime_type: 'audio/mpeg',
      call_langs: ['hi-IN'],
      coaching_lang: 'hi-IN',
      status: 'failed',
      error_code: 'no_speech',
      checked_at: new Date().toISOString(),
    });
  if (inserted.error) throw inserted.error;
  return id;
}

test.beforeAll(async () => {
  ids.push(
    await seedReadyCall(
      titles.coldBiryani,
      COLD_BIRYANI_SEGMENTS,
      COLD_BIRYANI_REPORT,
    ),
    await seedReadyCall(
      titles.calmQuestion,
      CALM_QUESTION_SEGMENTS,
      CALM_QUESTION_REPORT,
    ),
    await seedSilentCall(),
    await seedReadyCall(
      titles.toDelete,
      CALM_QUESTION_SEGMENTS,
      CALM_QUESTION_REPORT,
    ),
  );
});

test.afterAll(async () => {
  await deleteCalls(ids);
});

function callRow(page: Page, title: string) {
  return page
    .getByRole('table', { name: 'Recent calls' })
    .getByRole('row')
    .filter({ hasText: title });
}

test('each checked call shows its score, frustration and review in words', async ({
  page,
}) => {
  await page.goto('/calls');

  const coldBiryani = callRow(page, titles.coldBiryani);
  await expect(coldBiryani).toContainText('83% · Good');
  await expect(coldBiryani).toContainText('Angry');
  await expect(coldBiryani).toContainText('Needs review');

  const calmQuestion = callRow(page, titles.calmQuestion);
  await expect(calmQuestion).toContainText('No checks applied');
  await expect(calmQuestion).toContainText('Calm');
  await expect(calmQuestion).toContainText('No red flags');

  await expect(callRow(page, titles.silent)).toContainText(
    CALL_ERROR_MESSAGES.no_speech,
  );
  await expect(
    page.getByRole('region', { name: 'Team average' }),
  ).toContainText(/\d+% · (Good|Needs work|Poor)/);
});

test('a call title opens its report', async ({ page }) => {
  await page.goto('/calls');

  await page.getByRole('link', { name: titles.coldBiryani }).click();

  await expect(page).toHaveURL(`/calls/${ids[0]}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    titles.coldBiryani,
  );
});

test('deleting a call removes it from the list', async ({ page }) => {
  await page.goto('/calls');

  await page.getByRole('button', { name: `Delete ${titles.toDelete}` }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete this call?' });
  await dialog.getByRole('button', { name: 'Delete call' }).click();

  await expect(dialog).toBeHidden();
  await expect(callRow(page, titles.toDelete)).toHaveCount(0);
  const left = await createDevAdminClient()
    .from('calls')
    .select('id')
    .eq('title', titles.toDelete);
  expect(left.data).toEqual([]);
});

test('keeping a call closes the dialog and leaves it in the list', async ({
  page,
}) => {
  await page.goto('/calls');

  await page
    .getByRole('button', { name: `Delete ${titles.calmQuestion}` })
    .click();
  await page.getByRole('button', { name: 'Keep it' }).click();

  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(callRow(page, titles.calmQuestion)).toHaveCount(1);
});

test('a failed delete says why and keeps the call', async ({ page }) => {
  await page.route(`**/api/calls/${ids[0]}`, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    return route.fulfill({
      status: 500,
      json: {
        error: {
          code: 'internal_error',
          message: 'Something went wrong on our side. Try again in a minute.',
        },
      },
    });
  });
  await page.goto('/calls');

  await page
    .getByRole('button', { name: `Delete ${titles.coldBiryani}` })
    .click();
  const dialog = page.getByRole('alertdialog');
  await dialog.getByRole('button', { name: 'Delete call' }).click();

  await expect(dialog.getByRole('alert')).toHaveText(
    'Something went wrong on our side. Try again in a minute.',
  );
  await dialog.getByRole('button', { name: 'Keep it' }).click();
  await expect(callRow(page, titles.coldBiryani)).toHaveCount(1);
});

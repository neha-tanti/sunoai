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
import { createTestAdminClient } from '../support/team-leader';

const run = randomUUID().slice(0, 8);
const titles = {
  coldBiryani: `Cold biryani, AI asked for the order ID again (${run})`,
  calmQuestion: `Sunday delivery question (${run})`,
  silent: `Silent line after the greeting (${run})`,
  toDelete: `Wrong dessert, customer hung up (${run})`,
  example: `Late order, example run (${run})`,
};
const ids = {} as Record<keyof typeof titles, string>;

async function seedSilentCall() {
  const id = randomUUID();
  const inserted = await createTestAdminClient()
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
  ids.coldBiryani = await seedReadyCall(
    titles.coldBiryani,
    COLD_BIRYANI_SEGMENTS,
    COLD_BIRYANI_REPORT,
  );
  ids.calmQuestion = await seedReadyCall(
    titles.calmQuestion,
    CALM_QUESTION_SEGMENTS,
    CALM_QUESTION_REPORT,
  );
  ids.silent = await seedSilentCall();
  ids.toDelete = await seedReadyCall(
    titles.toDelete,
    CALM_QUESTION_SEGMENTS,
    CALM_QUESTION_REPORT,
  );
  ids.example = await seedReadyCall(
    titles.example,
    COLD_BIRYANI_SEGMENTS,
    COLD_BIRYANI_REPORT,
    'late-order',
  );
});

test.afterAll(async () => {
  await deleteCalls(Object.values(ids));
});

function callRow(page: Page, title: string) {
  return page
    .getByRole('table', { name: 'Recent calls' })
    .getByRole('row')
    .filter({ hasText: title });
}

test('each checked call shows its score, how it ended and its review in words', async ({
  page,
}) => {
  await page.goto('/calls');

  const coldBiryani = callRow(page, titles.coldBiryani);
  await expect(coldBiryani).toContainText('83% · Good');
  await expect(coldBiryani).toContainText('Ended calm');
  await expect(coldBiryani).toContainText('Needs review');

  const calmQuestion = callRow(page, titles.calmQuestion);
  await expect(calmQuestion).toContainText('No checks applied');
  await expect(calmQuestion).toContainText('Ended calm');
  await expect(calmQuestion).toContainText('No red flags');

  await expect(callRow(page, titles.silent)).toContainText(
    CALL_ERROR_MESSAGES.no_speech,
  );
  await expect(
    page.getByRole('region', { name: 'Team average' }),
  ).toContainText(/\d+%\s*(Good|Needs work|Poor)/);
});

test('an example run is tagged Example in its row, its card and its report', async ({
  page,
}) => {
  await page.goto('/calls');

  await expect(
    callRow(page, titles.example).getByText('Example', { exact: true }),
  ).toBeVisible();
  await expect(
    callRow(page, titles.coldBiryani).getByText('Example', { exact: true }),
  ).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page
      .getByRole('list', { name: 'Recent calls' })
      .getByRole('listitem')
      .filter({ hasText: titles.example })
      .getByText('Example', { exact: true }),
  ).toBeVisible();

  await page.goto(`/calls/${ids.example}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    titles.example,
  );
  await expect(page.getByText('Example', { exact: true })).toBeVisible();
});

test('a call title opens its report', async ({ page }) => {
  await page.goto('/calls');

  await page.getByRole('link', { name: titles.coldBiryani }).click();

  await expect(page).toHaveURL(`/calls/${ids.coldBiryani}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    titles.coldBiryani,
  );
});

test('clicking anywhere on a row opens its report', async ({ page }) => {
  await page.goto('/calls');

  const scoreCell = callRow(page, titles.coldBiryani).getByRole('cell').nth(2);
  await expect(scoreCell).toContainText('83% · Good');
  await scoreCell.scrollIntoViewIfNeeded();
  const box = await scoreCell.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  await expect(page).toHaveURL(`/calls/${ids.coldBiryani}`);
});

test('on a phone each call is a card with its review and score in view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calls');

  const card = page
    .getByRole('list', { name: 'Recent calls' })
    .getByRole('listitem')
    .filter({ hasText: titles.coldBiryani });
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByText('Needs review')).toBeInViewport();
  await expect(card.getByText('83% · Good')).toBeVisible();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test('deleting a call removes it from the list', async ({ page }) => {
  await page.goto('/calls');

  await page.getByRole('button', { name: `Delete ${titles.toDelete}` }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete this call?' });
  await dialog.getByRole('button', { name: 'Delete call' }).click();

  await expect(dialog).toBeHidden();
  await expect(callRow(page, titles.toDelete)).toHaveCount(0);
  const left = await createTestAdminClient()
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
  await page.route(`**/api/calls/${ids.coldBiryani}`, (route) => {
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

import { expect, test } from '@playwright/test';
import {
  COLD_BIRYANI_REPORT,
  COLD_BIRYANI_SEGMENTS,
  deleteCalls,
  seedReadyCall,
} from '../support/ready-call';

let coldBiryani: string;

test.beforeAll(async () => {
  coldBiryani = await seedReadyCall(
    'Cold biryani, AI asked for the order ID again',
    COLD_BIRYANI_SEGMENTS,
    COLD_BIRYANI_REPORT,
  );
});

test.afterAll(async () => {
  await deleteCalls([coldBiryani]);
});

test('a Ready report shows the verdict and the tiles in words', async ({
  page,
}) => {
  await page.goto(`/calls/${coldBiryani}`);
  const main = page.getByRole('main');

  await expect(main.getByRole('status')).toHaveText('Ready.');
  await expect(main.getByRole('alert')).toContainText('Needs review');
  await expect(main.getByRole('alert')).toContainText('2 red flags');
  await expect(main.getByText('83% · Good')).toBeVisible();
  await expect(main.getByText('Angry', { exact: true })).toBeVisible();
  await expect(main.getByText('AI to Kavya at 0:36')).toBeVisible();
});

test("the frustration turn's time jumps to its transcript line", async ({
  page,
}) => {
  await page.goto(`/calls/${coldBiryani}`);

  await page.getByRole('link', { name: 'Show 0:26 in the transcript' }).click();

  const line = page.locator('#segment-5');
  await expect(page.locator(':target')).toHaveAttribute('id', 'segment-5');
  await expect(line).toBeInViewport();
  await expect(line).toContainText('Frustration turned here');
});

import { expect, test } from '@playwright/test';
import {
  CALM_QUESTION_REPORT,
  CALM_QUESTION_SEGMENTS,
  COLD_BIRYANI_REPORT,
  COLD_BIRYANI_SEGMENTS,
  deleteCalls,
  seedReadyCall,
} from '../support/ready-call';

let coldBiryani: string;
let calmQuestion: string;

test.beforeAll(async () => {
  coldBiryani = await seedReadyCall(
    'Cold biryani, AI asked for the order ID again',
    COLD_BIRYANI_SEGMENTS,
    COLD_BIRYANI_REPORT,
  );
  calmQuestion = await seedReadyCall(
    'Sunday delivery question',
    CALM_QUESTION_SEGMENTS,
    CALM_QUESTION_REPORT,
  );
});

test.afterAll(async () => {
  await deleteCalls([coldBiryani, calmQuestion]);
});

test('a Ready report shows the verdict and the tiles in words', async ({
  page,
}) => {
  await page.goto(`/calls/${coldBiryani}`);
  const main = page.getByRole('main');

  await expect(main.getByRole('status')).toHaveText('Ready.');
  await expect(main.getByRole('alert')).toContainText('Needs review');
  await expect(main.getByRole('alert')).toContainText('2 red flags');
  await expect(main.getByRole('region', { name: 'Score' })).toContainText(
    '83% · Good',
  );
  await expect(
    main.getByRole('region', { name: 'Customer frustration' }),
  ).toContainText('Angry');
  await expect(main.getByRole('region', { name: 'Handover' })).toContainText(
    'AI to Kavya at 0:36',
  );
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

test('the timeline describes the mood ranges and its markers jump', async ({
  page,
}) => {
  await page.goto(`/calls/${coldBiryani}`);
  const main = page.getByRole('main');

  await expect(
    main.getByText(
      'Calm from 0:00 to 0:16, Annoyed from 0:16 to 0:26, Angry from 0:26 to 0:50, Calm from 0:50 to 0:58.',
    ),
  ).toBeAttached();

  await main
    .getByRole('link', {
      name: 'Red flag at 0:21: Agent stuck in a loop, Wrong or made-up promise. Show in the transcript',
    })
    .click();

  const line = page.locator('#segment-4');
  await expect(page.locator(':target')).toHaveAttribute('id', 'segment-4');
  await expect(line).toBeInViewport();
  await expect(line).toContainText('Red flag: Agent stuck in a loop');
  await expect(line).toContainText('Red flag: Wrong or made-up promise');
});

for (const viewport of [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`a red flag's quote jumps to its line on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/calls/${coldBiryani}`);
    const redFlags = page.getByRole('region', { name: 'Red flags' });

    await redFlags
      .getByRole('link', { name: 'Aapko 500 rupaye extra milenge' })
      .click();

    const line = page.locator('#segment-4');
    await expect(page.locator(':target')).toHaveAttribute('id', 'segment-4');
    await expect(line).toBeInViewport();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
}

test('a missed check without a quote shows its reason and no link', async ({
  page,
}) => {
  await page.goto(`/calls/${coldBiryani}`);
  const row = page
    .getByRole('region', { name: 'Agent checklist' })
    .getByRole('listitem')
    .filter({ hasText: 'Problem understood' });

  await expect(row).toContainText('Missed');
  await expect(row).toContainText('Asked for the order ID again');
  await expect(row.getByRole('link')).toHaveCount(0);
});

test('a calm call with nothing to flag says so in each section', async ({
  page,
}) => {
  await page.goto(`/calls/${calmQuestion}`);
  const main = page.getByRole('main');

  await expect(main.getByRole('alert')).toContainText('No red flags');
  await expect(main.getByRole('region', { name: 'Score' })).toContainText(
    'No checks applied',
  );
  await expect(
    main.getByRole('region', { name: 'Customer frustration' }),
  ).toContainText('The customer stayed calm for the whole call.');
  await expect(main.getByRole('region', { name: 'Handover' })).toContainText(
    'No handover',
  );
  await expect(main.getByRole('region', { name: 'Red flags' })).toHaveCount(0);
  await expect(
    main.getByRole('region', { name: 'AI fix notes' }),
  ).toContainText('No problems found for the AI on this call.');
});

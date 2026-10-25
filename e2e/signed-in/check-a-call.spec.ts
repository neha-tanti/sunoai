import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import { UPLOAD_TOKEN_REUSE_MS } from '@/lib/call-upload';
import type { Enums } from '@/lib/database.types';
import {
  createTestAdminClient,
  createTeamLeader,
  deleteTeamLeader,
  signIn,
} from '../support/team-leader';

function silentWav(seconds: number) {
  const sampleRate = 8000;
  const dataBytes = seconds * sampleRate;
  const wav = Buffer.alloc(44 + dataBytes, 128);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  return wav;
}

test.describe('choosing a recording', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/check');
  });

  test('a file that is not audio says which types work', async ({ page }) => {
    await page.getByLabel('Call recording').setInputFiles({
      name: 'call-notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Customer asked for a refund on order 4417.'),
    });

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      /can't check this file type\. Use WAV, MP3/,
    );
  });

  test('a file over 50 MB says it is too big', async ({ page }, testInfo) => {
    const recording = testInfo.outputPath('long-escalation.mp3');
    writeFileSync(recording, Buffer.alloc(50 * 1024 * 1024 + 1));

    await page.getByLabel('Call recording').setInputFiles(recording);

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'This file is over 50 MB. Use a smaller recording.',
    );
  });

  test('a call over 30 minutes says to split it', async ({ page }) => {
    await page.getByLabel('Call recording').setInputFiles({
      name: 'thirty-one-minute-call.wav',
      mimeType: 'audio/wav',
      buffer: silentWav(31 * 60),
    });

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      CALL_ERROR_MESSAGES.too_long,
    );
  });

  test('no more than three call languages can be picked', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Marathi' }).click();

    await expect(page.getByRole('checkbox', { name: 'Tamil' })).toBeDisabled();
  });
});

test.describe('example calls', () => {
  const exampleCard = (page: Page, title: string) =>
    page.getByRole('listitem').filter({ hasText: title });

  test('Listen plays the example recording in its card', async ({ page }) => {
    await page.route('**/api/calls/examples/late-order/audio', (route) =>
      route.fulfill({ json: { url: '/late-order-example.wav' } }),
    );
    await page.goto('/check');

    await exampleCard(page, 'Late order')
      .getByRole('button', { name: 'Listen' })
      .click();

    await expect(
      exampleCard(page, 'Late order').getByLabel('Late order recording'),
    ).toHaveAttribute('src', '/late-order-example.wav');
  });

  test('picking an example opens its call', async ({ page }) => {
    const id = randomUUID();
    let picked: unknown;
    await page.route('**/api/calls/examples', (route) => {
      picked = route.request().postDataJSON();
      return route.fulfill({ status: 201, json: { id } });
    });
    await page.goto('/check');

    await exampleCard(page, 'Order ID loop')
      .getByRole('button', { name: 'Check this example' })
      .click();

    await expect(page).toHaveURL(`/calls/${id}`);
    expect(picked).toEqual({ example: 'order-id-loop' });
  });

  test('a day that has used up its checks says to come back tomorrow', async ({
    page,
  }) => {
    const message =
      'SunoAI has checked its 30 calls for today. Try again tomorrow.';
    await page.route('**/api/calls/examples', (route) =>
      route.fulfill({
        status: 429,
        json: { error: { code: 'daily_limit', message } },
      }),
    );
    await page.goto('/check');

    await exampleCard(page, 'Late order')
      .getByRole('button', { name: 'Check this example' })
      .click();

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(message);
    await expect(page).toHaveURL(/\/check$/);
  });
});

test.describe('uploading', () => {
  const title = `Missing raita, upload test ${randomUUID()}`;

  test.afterEach(async () => {
    const deleted = await createTestAdminClient()
      .from('calls')
      .delete()
      .eq('title', title);
    if (deleted.error) throw deleted.error;
  });

  test('a failed upload says to check the connection and try again', async ({
    page,
  }) => {
    await page.route('**/storage/v1/object/upload/sign/**', (route) =>
      route.abort('connectionfailed'),
    );
    await page.goto('/check');

    await page.getByLabel('Call recording').setInputFiles({
      name: 'missing-raita.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('not really audio'),
    });
    await page.getByLabel('Call title').fill(title);
    await page.getByRole('button', { name: 'Check this call' }).click();

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Upload failed. Check your connection and try again.',
    );
    await expect(page).toHaveURL(/\/check$/);
  });

  test('trying again after a failed upload keeps the same call', async ({
    page,
  }) => {
    const uploadUrls: string[] = [];
    await page.route('**/storage/v1/object/upload/sign/**', (route) => {
      uploadUrls.push(route.request().url());
      return route.abort('connectionfailed');
    });
    await page.goto('/check');

    await page.getByLabel('Call recording').setInputFiles({
      name: 'missing-raita.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('not really audio'),
    });
    await page.getByLabel('Call title').fill(title);
    const checkThisCall = page.getByRole('button', { name: 'Check this call' });
    const alert = page.getByRole('main').getByRole('alert');
    await checkThisCall.click();
    await expect(alert).toBeVisible();
    await checkThisCall.click();
    await expect.poll(() => uploadUrls).toHaveLength(2);

    const calls = await createTestAdminClient()
      .from('calls')
      .select('id')
      .eq('title', title);
    if (calls.error) throw calls.error;
    expect(calls.data).toHaveLength(1);
    for (const url of uploadUrls) expect(url).toContain(calls.data[0].id);
  });

  test('a check that started but lost its answer opens the call on retry', async ({
    page,
  }) => {
    let uploads = 0;
    let checks = 0;
    await page.route('**/storage/v1/object/upload/sign/**', (route) => {
      uploads += 1;
      return route.fulfill({ json: { Key: 'calls/missing-raita.mp3' } });
    });
    await page.route('**/api/calls/*/check', (route) => {
      checks += 1;
      if (checks === 1) return route.abort('connectionfailed');
      return route.fulfill({
        status: 409,
        json: {
          error: {
            code: 'already_checked',
            message: 'This call has already been checked.',
          },
        },
      });
    });
    await page.goto('/check');

    await page.getByLabel('Call recording').setInputFiles({
      name: 'missing-raita.mp3',
      mimeType: 'audio/mpeg',
      buffer: Buffer.from('not really audio'),
    });
    await page.getByLabel('Call title').fill(title);
    const checkThisCall = page.getByRole('button', { name: 'Check this call' });
    await checkThisCall.click();
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
    await checkThisCall.click();

    await expect(page).toHaveURL(/\/calls\/[0-9a-f-]{36}$/);
    expect(uploads).toBe(1);
  });

  test.describe('on a session of its own', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    let teamLeaderId: string | undefined;

    test.beforeEach(async ({ page }) => {
      const teamLeader = await createTeamLeader();
      teamLeaderId = teamLeader.id;
      await signIn(page, teamLeader);
    });

    test.afterEach(async () => {
      if (!teamLeaderId) return;
      await deleteTeamLeader(teamLeaderId);
      teamLeaderId = undefined;
    });

    test('trying again after the upload link expires replaces the call', async ({
      page,
    }) => {
      const uploadUrls: string[] = [];
      await page.route('**/storage/v1/object/upload/sign/**', (route) => {
        uploadUrls.push(route.request().url());
        return route.abort('connectionfailed');
      });
      await page.clock.install();
      await page.goto('/check');

      await page.getByLabel('Call recording').setInputFiles({
        name: 'missing-raita.mp3',
        mimeType: 'audio/mpeg',
        buffer: Buffer.from('not really audio'),
      });
      await page.getByLabel('Call title').fill(title);
      const checkThisCall = page.getByRole('button', {
        name: 'Check this call',
      });
      const alert = page.getByRole('main').getByRole('alert');
      await checkThisCall.click();
      await expect(alert).toBeVisible();
      const db = createTestAdminClient();
      const first = await db
        .from('calls')
        .select('id')
        .eq('title', title)
        .single();
      if (first.error) throw first.error;

      await page.clock.fastForward(UPLOAD_TOKEN_REUSE_MS + 60_000);
      const replacementCreated = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/calls',
      );
      await checkThisCall.click();
      await replacementCreated;
      await expect(alert).toHaveText(
        'Upload failed. Check your connection and try again.',
      );

      const calls = await db.from('calls').select('id').eq('title', title);
      if (calls.error) throw calls.error;
      expect(calls.data).toHaveLength(1);
      expect(calls.data[0].id).not.toBe(first.data.id);
      expect(uploadUrls.at(-1)).toContain(calls.data[0].id);
    });
  });
});

test.describe('a failed call', () => {
  const failures = Object.entries(CALL_ERROR_MESSAGES) as [
    Enums<'call_error_code'>,
    string,
  ][];
  const callIds = new Map<string, string>();

  test.beforeAll(async () => {
    const inserted = await createTestAdminClient()
      .from('calls')
      .insert(
        failures.map(([errorCode]) => {
          const id = randomUUID();
          callIds.set(errorCode, id);
          return {
            id,
            title: `Wrong thali delivered (${errorCode})`,
            file_path: `${id}/recording.mp3`,
            file_size_bytes: 480_000,
            mime_type: 'audio/mpeg',
            call_langs: ['hi-IN'],
            coaching_lang: 'hi-IN',
            status: 'failed' as const,
            error_code: errorCode,
            error: 'Seeded by the end-to-end tests',
          };
        }),
      );
    if (inserted.error) throw inserted.error;
  });

  test.afterAll(async () => {
    const deleted = await createTestAdminClient()
      .from('calls')
      .delete()
      .in('id', [...callIds.values()]);
    if (deleted.error) throw deleted.error;
  });

  for (const [errorCode, message] of failures) {
    test(`shows "${message}" for ${errorCode}`, async ({ page }) => {
      await page.goto(`/calls/${callIds.get(errorCode)}`);

      await expect(page.getByRole('main').getByRole('status')).toHaveText(
        message,
      );
    });
  }

  test('offers Check again only when the analysis failed', async ({ page }) => {
    for (const [errorCode] of failures) {
      await page.goto(`/calls/${callIds.get(errorCode)}`);
      await expect(page.getByRole('main').getByRole('status')).toBeVisible();

      await expect(
        page.getByRole('button', { name: 'Check again' }),
      ).toHaveCount(errorCode === 'analysis_failed' ? 1 : 0);
    }
  });

  test('Check again starts the analysis again', async ({ page }) => {
    const id = callIds.get('analysis_failed');
    await page.route(`**/api/calls/${id}/analyze`, (route) =>
      route.fulfill({ status: 202, json: { status: 'analyzing' } }),
    );
    await page.goto(`/calls/${id}`);
    const checkAgain = page.getByRole('button', { name: 'Check again' });
    await expect(checkAgain).toBeVisible();
    await page.route(`**/api/calls/${id}`, async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.call = { ...body.call, status: 'analyzing', error_code: null };
      await route.fulfill({ response, json: body });
    });

    await checkAgain.click();

    await expect(page.getByRole('main').getByRole('status')).toHaveText(
      'Analysing the transcript…',
    );
  });

  test('Check again shows why it was refused', async ({ page }) => {
    const id = callIds.get('analysis_failed');
    await page.route(`**/api/calls/${id}/analyze`, (route) =>
      route.fulfill({
        status: 409,
        json: {
          error: {
            code: 'not_retryable',
            message: 'Only a call whose analysis failed can be checked again.',
          },
        },
      }),
    );
    await page.goto(`/calls/${id}`);

    await page.getByRole('button', { name: 'Check again' }).click();

    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'Only a call whose analysis failed can be checked again.',
    );
  });

  test('a call that does not exist says so', async ({ page }) => {
    await page.goto(`/calls/${randomUUID()}`);

    await expect(
      page.getByRole('heading', { name: 'Call not found' }),
    ).toBeVisible();
  });
});

import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { CALL_ERROR_MESSAGES } from '@/lib/call-errors';
import type { Enums } from '@/lib/database.types';
import { createDevAdminClient } from '../support/team-leader';

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
    await page.goto('/');
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

test.describe('uploading', () => {
  const title = `Missing raita, upload test ${randomUUID()}`;

  test.afterEach(async () => {
    const deleted = await createDevAdminClient()
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
    await page.goto('/');

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
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('a failed call', () => {
  const failures = Object.entries(CALL_ERROR_MESSAGES) as [
    Enums<'call_error_code'>,
    string,
  ][];
  const callIds = new Map<string, string>();

  test.beforeAll(async () => {
    const inserted = await createDevAdminClient()
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
    const deleted = await createDevAdminClient()
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

  test('a call that does not exist says so', async ({ page }) => {
    await page.goto(`/calls/${randomUUID()}`);

    await expect(
      page.getByRole('heading', { name: 'Call not found' }),
    ).toBeVisible();
  });
});

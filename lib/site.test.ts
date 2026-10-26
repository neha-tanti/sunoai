import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isAppPage } from './site';

describe('isAppPage', () => {
  it('covers every page in the signed-in route group', () => {
    const pages = readdirSync(new URL('../app/(app)', import.meta.url), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/${entry.name}`);

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) expect(isAppPage(page), page).toBe(true);
  });
});

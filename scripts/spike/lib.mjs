import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const GNANI_URL = 'https://api.vachana.ai';
export const OUT_DIR = fileURLToPath(new URL('../../test-calls/spike/', import.meta.url));

mkdirSync(OUT_DIR, { recursive: true });

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env.local and run with node --env-file=.env.local`);
  return value;
}

export async function gnani(path, init = {}) {
  const res = await fetch(`${GNANI_URL}${path}`, {
    ...init,
    headers: { 'X-API-Key-ID': requireEnv('GNANI_API_KEY'), ...init.headers },
  });
  if (!res.ok) throw new Error(`Gnani ${init.method ?? 'GET'} ${path} failed: ${res.status} ${await res.text()}`);
  return res;
}

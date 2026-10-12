import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest();

export function secretMatches(name: string, given: string | undefined) {
  const expected = requireEnv(name);
  return timingSafeEqual(sha256(expected), sha256(given ?? ''));
}

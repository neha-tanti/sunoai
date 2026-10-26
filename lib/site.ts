export const SITE_URL = 'https://suno-ai.vercel.app';
export const SOURCE_URL = 'https://github.com/neha-tanti/sunoai';
export const GNANI_URL = 'https://gnani.ai';

export const SITE_TITLE = 'SunoAI · Find where support calls go wrong';
export const SITE_DESCRIPTION =
  'SunoAI checks recorded food delivery support calls: where the customer got frustrated, what the agents missed, and spoken coaching for the human agent. Powered by Gnani.ai.';

export const APP_PAGES = ['/check', '/calls', '/checklist'];

export function isAppPage(path: string) {
  return APP_PAGES.some((page) => path === page || path.startsWith(`${page}/`));
}

export function isSharedReport(path: string | null): path is string {
  return path !== null && /^\/calls\/[\w-]+$/.test(path);
}

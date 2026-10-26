import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/checklist.md'],
      disallow: ['/calls', '/check', '/login', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

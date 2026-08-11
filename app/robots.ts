import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/assets/audio/'] },
    sitemap: 'https://d10g3n.live/sitemap.xml',
    host: 'https://d10g3n.live',
  };
}

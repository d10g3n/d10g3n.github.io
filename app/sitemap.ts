import type { MetadataRoute } from 'next';
import { tracks, trackPath } from '../lib/catalog';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://d10g3n.live';
  return [
    { url: base, lastModified: new Date('2026-07-19'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacy-policy.html`, lastModified: new Date('2026-07-19'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/copyright.html`, lastModified: new Date('2026-07-19'), changeFrequency: 'monthly', priority: 0.5 },
    ...tracks.map((track) => ({ url: `${base}${trackPath(track)}`, lastModified: new Date('2026-07-19'), changeFrequency: 'monthly' as const, priority: 0.8 })),
  ];
}

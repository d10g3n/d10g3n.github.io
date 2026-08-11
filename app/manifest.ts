import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'D10G3N Live',
    short_name: 'D10G3N',
    description: 'Independent music by D10G3N',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f1e',
    theme_color: '#1a1a2e',
    icons: [{ src: '/assets/placeholder.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }],
  };
}

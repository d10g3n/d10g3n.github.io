import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '../components/AppShell';
import '../styles/main.css';
import '../styles/next.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://d10g3n.live'),
  title: { default: 'D10G3N Live - Music streaming', template: '%s | D10G3N Live' },
  description: 'D10G3N Live - Official music streaming platform made by D10G3N. Independent music, no algorithms, no trends, just sound and emotions.',
  keywords: ['D10G3N', 'music', 'tracks', 'albums', 'streaming', 'independent music'],
  alternates: {
    canonical: '/',
    languages: { en: '/?lang=en', ru: '/?lang=ru', uk: '/?lang=uk', 'x-default': '/' },
  },
  openGraph: {
    title: 'D10G3N Music',
    description: 'Official music streaming platform made by D10G3N',
    type: 'website',
    url: '/',
    images: ['/assets/placeholder.svg'],
  },
  manifest: '/manifest.json',
  icons: { icon: '/assets/placeholder.svg', apple: '/assets/placeholder.svg' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#1a1a2e' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}

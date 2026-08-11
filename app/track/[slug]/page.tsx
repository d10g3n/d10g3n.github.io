import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TrackPage } from '../../../components/TrackPage';
import { getAlbumById, getTrackBySlug, publicPath, trackPath } from '../../../lib/catalog';
import { ALL_STATIC_TRACK_SLUGS } from '../../../lib/routes';

type TrackRouteProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_STATIC_TRACK_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: TrackRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const track = getTrackBySlug(slug);
  if (!track) return {};
  const album = getAlbumById(track.albumId);
  const canonical = trackPath(track);
  const description = `${track.title} by D10G3N - Listen to this track from the album ${album?.title ?? 'D10G3N'}. Independent music, no algorithms, no trends.`;
  return {
    title: `${track.title} - D10G3N | ${album?.title ?? 'D10G3N'}`,
    description,
    keywords: ['D10G3N', track.title, album?.title ?? '', 'music', 'streaming'],
    alternates: {
      canonical,
      languages: { en: `${canonical}?lang=en`, ru: `${canonical}?lang=ru`, uk: `${canonical}?lang=uk`, 'x-default': canonical },
    },
    openGraph: {
      title: `${track.title} - D10G3N`,
      description: `Listen to ${track.title} by D10G3N from the album ${album?.title ?? 'D10G3N'}`,
      type: 'music.song',
      url: canonical,
      images: [publicPath(track.cover)],
    },
  };
}

export default async function Page({ params }: TrackRouteProps) {
  const { slug } = await params;
  const track = getTrackBySlug(slug);
  if (!track) notFound();
  const album = getAlbumById(track.albumId);
  if (!album) notFound();
  const canonical = `https://d10g3n.live${trackPath(track)}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    name: track.title,
    url: canonical,
    image: `https://d10g3n.live${publicPath(track.cover)}`,
    datePublished: String(track.year),
    byArtist: {
      '@type': 'MusicGroup',
      name: 'D10G3N',
      url: 'https://d10g3n.live',
      sameAs: ['https://open.spotify.com/artist/3OmPiKg36fYukLMOYBKfx7', 'https://soundcloud.com/d10g3n', 'https://www.youtube.com/@D10G3N-channel'],
    },
    inAlbum: { '@type': 'MusicAlbum', name: album.title, byArtist: { '@type': 'MusicGroup', name: 'D10G3N' } },
    ...(track.isrc ? { isrcCode: track.isrc } : {}),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackPage track={track} album={album} requestedSlug={slug} />
    </>
  );
}

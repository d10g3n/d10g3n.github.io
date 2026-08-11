import { HomePage } from '../components/HomePage';
import { albums } from '../lib/catalog';

const musicGroupJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MusicGroup',
  name: 'D10G3N',
  url: 'https://d10g3n.live',
  logo: 'https://d10g3n.live/assets/placeholder.svg',
  description: 'Independent music artist. No algorithms, no trends, just sound and emotions.',
  genre: ['Electronic', 'Hip-Hop'],
  sameAs: [
    'https://open.spotify.com/artist/3OmPiKg36fYukLMOYBKfx7',
    'https://soundcloud.com/d10g3n',
    'https://www.youtube.com/@D10G3N-channel',
    'https://instagram.com/the_d10g3n',
    'https://tiktok.com/@the_d10g3n',
  ],
  album: albums.map((album) => ({
    '@type': 'MusicAlbum',
    name: album.title,
    datePublished: String(album.year),
    image: `https://d10g3n.live/${album.cover}`,
    byArtist: { '@type': 'MusicGroup', name: 'D10G3N' },
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(musicGroupJsonLd) }} />
      <HomePage />
    </>
  );
}

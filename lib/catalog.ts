import rawCatalog from '../web.json';
import { slugForTrack, trackIdForSlug } from './routes';
import type { Album, Catalog, Track } from './types';

export const catalog = rawCatalog as Catalog;

export const albums = catalog.albums;
export const tracks = catalog.tracks.filter(
  (track) => track.availability?.web !== false,
);
export const artistLinks = catalog.artistLinks ?? [];

const albumsById = new Map(albums.map((album) => [album.id, album]));
const tracksById = new Map(tracks.map((track) => [track.id, track]));

export function getAlbumById(id: string): Album | undefined {
  return albumsById.get(id);
}

export function getTrackById(id: string): Track | undefined {
  return tracksById.get(id);
}

export function getTracksByAlbum(albumId: string): Track[] {
  return tracks.filter((track) => track.albumId === albumId);
}

export function getTrackBySlug(slug: string): Track | undefined {
  const trackId = trackIdForSlug(slug);
  return trackId ? getTrackById(trackId) : undefined;
}

export function publicPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function trackPath(track: Track | string): string {
  const id = typeof track === 'string' ? track : track.id;
  const slug = slugForTrack(id);
  if (!slug) throw new Error(`Missing published slug for ${id}`);
  return `/track/${slug}/`;
}

for (const track of tracks) {
  if (!slugForTrack(track.id)) {
    throw new Error(`Published track ${track.id} has no stable slug`);
  }
  if (!getAlbumById(track.albumId)) {
    throw new Error(`Published track ${track.id} references missing album ${track.albumId}`);
  }
}

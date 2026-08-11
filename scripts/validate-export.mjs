import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import packageJson from '../package.json' with { type: 'json' };
import catalog from '../web.json' with { type: 'json' };
import { ALL_STATIC_TRACK_SLUGS, CANONICAL_TRACK_SLUGS, trackIdForSlug } from '../lib/routes.ts';

const out = new URL('../out/', import.meta.url);
const files = [
  'index.html', '404.html', 'web.json', 'version.json', 'manifest.json', 'sw.js',
  'privacy-policy.html', 'copyright.html', 'styles/policy.css', '.well-known/assetlinks.json',
  '.well-known/apple-app-site-association', '_routes.json', 'robots.txt', 'sitemap.xml',
  ...ALL_STATIC_TRACK_SLUGS.map((slug) => `track/${slug}/index.html`),
];
await Promise.all(files.map((file) => access(new URL(file, out))));

const indexHtml = await readFile(new URL('index.html', out), 'utf8');
assert.match(indexHtml, new RegExp(`v${packageJson.version.replaceAll('.', '\\.')}(?:\\+[a-f0-9]{7}|\\+dev)`), 'footer has generated build version');

const webTracks = catalog.tracks.filter((track) => track.availability?.web !== false);
await Promise.all([
  ...catalog.albums.map((album) => access(new URL(album.cover, out))),
  ...webTracks.flatMap((track) => [
    access(new URL(track.cover, out)),
    access(new URL(track.audioFile, out)),
  ]),
]);
for (const slug of CANONICAL_TRACK_SLUGS) {
  const track = webTracks.find((candidate) => candidate.id === trackIdForSlug(slug));
  assert.ok(track, `catalog track for ${slug}`);
  const album = catalog.albums.find((candidate) => candidate.id === track.albumId);
  const html = await readFile(new URL(`track/${slug}/index.html`, out), 'utf8');
  assert.ok(html.includes(track.title), `${slug} has title in initial HTML`);
  assert.ok(html.includes(album.title), `${slug} has album in initial HTML`);
  assert.ok(html.includes(String(track.year)), `${slug} has year in initial HTML`);
  if (track.lyrics) assert.ok(html.includes(track.lyrics.slice(0, 24)), `${slug} has lyrics in initial HTML`);
  assert.ok(html.includes('MusicRecording'), `${slug} has JSON-LD`);
  assert.ok(html.includes(`https://d10g3n.live/track/${slug}/`), `${slug} has canonical URL`);
}

const sitemap = await readFile(new URL('sitemap.xml', out), 'utf8');
for (const slug of CANONICAL_TRACK_SLUGS) assert.ok(sitemap.includes(`/track/${slug}/`), `sitemap contains ${slug}`);

console.log(`Validated ${files.length} exported contracts and ${CANONICAL_TRACK_SLUGS.length} canonical track pages.`);

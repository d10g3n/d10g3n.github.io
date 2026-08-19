import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  ALL_STATIC_TRACK_SLUGS,
  CANONICAL_TRACK_SLUGS,
  TRACK_ALIASES,
  TRACK_SLUGS,
  canonicalSlugFor,
  trackIdForSlug,
} from '../lib/routes.ts';

const catalog = JSON.parse(await readFile(new URL('../web.json', import.meta.url), 'utf8'));
const webTracks = catalog.tracks.filter((track) => track.availability?.web !== false);
const radioTracks = catalog.tracks.filter((track) => track.availability?.radio !== false);

test('every web track has one stable unique canonical slug', () => {
  assert.equal(webTracks.length, 24);
  assert.deepEqual(new Set(webTracks.map((track) => track.id)), new Set(Object.keys(TRACK_SLUGS)));
  assert.equal(new Set(CANONICAL_TRACK_SLUGS).size, webTracks.length);
});

test('published Club Kings aliases resolve to the canonical track', () => {
  assert.deepEqual(Object.keys(TRACK_ALIASES).sort(), ['club-kings', 'club-kings-bootleg-remix']);
  for (const alias of Object.keys(TRACK_ALIASES)) {
    assert.equal(trackIdForSlug(alias), 'track19');
    assert.equal(canonicalSlugFor(alias), 'morozoff-club-kings-d10g3n-remix');
  }
  assert.equal(ALL_STATIC_TRACK_SLUGS.length, 26);
});

test('catalog keeps mobile-facing IDs and relative media paths', () => {
  for (const track of webTracks) {
    assert.match(track.id, /^track\d+$/);
    assert.match(track.cover, /^assets\/albums\//);
    assert.match(track.audioFile, /^assets\/audio\/.+\.mp3$/);
    assert.ok(catalog.albums.some((album) => album.id === track.albumId));
  }
});

test('radio excludes only the three Uniform without a face versions', () => {
  assert.deepEqual(
    catalog.tracks.filter((track) => track.availability?.radio === false).map((track) => track.id).sort(),
    ['track15', 'track16', 'track17'],
  );
  assert.equal(radioTracks.length, catalog.tracks.length - 3);
  for (const track of radioTracks) {
    assert.match(track.id, /^track\d+$/);
    assert.match(track.audioFile, /^assets\/audio\/.+\.mp3$/);
  }
});

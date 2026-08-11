import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const required = [
  'public/web.json',
  'public/version.json',
  'public/manifest.json',
  'public/sw.js',
  'public/privacy-policy.html',
  'public/copyright.html',
  'public/_routes.json',
  'public/.well-known/assetlinks.json',
  'public/.well-known/apple-app-site-association',
];

test('legacy static contracts are included in public', async () => {
  await Promise.all(required.map((path) => access(new URL(path, root))));
  assert.deepEqual(
    JSON.parse(await readFile(new URL('public/web.json', root), 'utf8')),
    JSON.parse(await readFile(new URL('web.json', root), 'utf8')),
  );
  assert.deepEqual(
    JSON.parse(await readFile(new URL('public/version.json', root), 'utf8')),
    JSON.parse(await readFile(new URL('version.json', root), 'utf8')),
  );
});

test('Cloudflare redirects preserve aliases without an SPA fallback', async () => {
  const redirects = await readFile(new URL('public/_redirects', root), 'utf8');
  assert.match(redirects, /club-kings .*morozoff-club-kings-d10g3n-remix/);
  assert.match(redirects, /club-kings-bootleg-remix .*morozoff-club-kings-d10g3n-remix/);
  assert.doesNotMatch(redirects, /\/\*\s+\/index\.html/);
});

test('Cloudflare Pages invokes Functions only for the radio endpoint', async () => {
  const routes = JSON.parse(await readFile(new URL('public/_routes.json', root), 'utf8'));
  assert.deepEqual(routes, {
    version: 1,
    include: ['/radio.mp3'],
    exclude: [],
  });
});

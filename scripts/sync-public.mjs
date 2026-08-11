import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const publicDirectory = new URL('../public/', import.meta.url);
const publicAssets = new URL('assets/', publicDirectory);
const publicWellKnown = new URL('.well-known/', publicDirectory);
const publicStyles = new URL('styles/', publicDirectory);

await mkdir(publicDirectory, { recursive: true });
await rm(publicAssets, { force: true, recursive: true });
await rm(publicWellKnown, { force: true, recursive: true });
await rm(publicStyles, { force: true, recursive: true });
await cp(new URL('assets/', root), publicAssets, { recursive: true });
await mkdir(publicWellKnown, { recursive: true });
await mkdir(publicStyles, { recursive: true });
await cp(new URL('styles/policy.css', root), new URL('policy.css', publicStyles));

for (const file of [
  'web.json',
  'version.json',
  'version.js',
  'manifest.json',
  'privacy-policy.html',
  'copyright.html',
  '.nojekyll',
]) {
  await cp(new URL(file, root), new URL(file, publicDirectory));
}

for (const file of ['assetlinks.json', 'apple-app-site-association']) {
  await cp(new URL(`.well-known/${file}`, root), new URL(file, publicWellKnown));
}

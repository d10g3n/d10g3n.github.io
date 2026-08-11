import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  buildProgramOffsets,
  createRadioRelease,
  createRadioPlan,
  frameGeometry,
  radioOutputDirectory,
} from '../scripts/build-radio.mjs';
import {
  onRequestGet,
  radioFrameOffset,
} from '../functions/radio.mp3.ts';
import {
  parsePreviousRadioPointer,
  prepareRadioPointer,
  validateRadioPointer,
} from '../scripts/prepare-radio-pointer.mjs';

const catalog = JSON.parse(await readFile(new URL('../web.json', import.meta.url), 'utf8'));
const config = JSON.parse(await readFile(new URL('../radio.config.json', import.meta.url), 'utf8'));

test('radio plan is deterministic and contains every eligible track once', () => {
  const first = createRadioPlan(catalog, config);
  const second = createRadioPlan(catalog, config);
  assert.deepEqual(first, second);

  const expected = catalog.tracks
    .filter((track) => track.availability?.radio !== false)
    .map((track) => track.id)
    .sort();
  assert.deepEqual(first.eligibleTrackIds.toSorted(), expected);
  assert.equal(first.items.filter((item) => item.kind === 'track').length, expected.length);
  assert.ok(first.items.some((item) => item.kind === 'jingle'));
});

test('radio eligibility rejects malformed availability values', () => {
  const malformed = structuredClone(catalog);
  malformed.tracks[0].availability = { ...malformed.tracks[0].availability, radio: 'false' };
  assert.throws(() => createRadioPlan(malformed, config), /availability\.radio must be boolean/);
});

test('radio manifest, pointer, and release ID are deterministic', () => {
  const core = {
    schemaVersion: 1,
    stationName: 'Diogen Live Radio',
    epochMs: 1767225600000,
    seed: 'stable',
    reel: { bytes: 76800, copies: 2, sha256: 'a'.repeat(64) },
    eligibleTrackIds: ['track1'],
  };
  const first = createRadioRelease(structuredClone(core));
  const second = createRadioRelease(structuredClone(core));
  assert.deepEqual(first, second);
  assert.match(first.manifest.releaseId, /^[a-f0-9]{64}$/);
  assert.equal(first.pointer.manifestKey, `radio/manifests/${first.manifest.releaseId}.json`);
  assert.equal(first.manifest.reel.key, `radio/reels/${first.manifest.releaseId}.mp3`);
});

test('program offsets and UTC seek offsets stay on CBR MP3 frame boundaries', () => {
  const geometry = frameGeometry(config.encoding);
  assert.deepEqual(geometry, { frameBytes: 384, frameDurationMs: 24 });

  const plan = createRadioPlan(catalog, config);
  const durations = new Map(plan.items.map((item) => [item.source, item.kind === 'jingle' ? 9.2935 : 200]));
  const program = buildProgramOffsets(plan, durations, config, geometry);
  for (const item of program) assert.equal(item.startByte % geometry.frameBytes, 0);

  const manifest = manifestFixture();
  for (const delta of [0, 1, 23, 24, 999, manifest.cycle.durationMs + 101]) {
    const offset = radioFrameOffset(manifest.epochMs + delta, manifest);
    assert.equal(offset % manifest.audio.frameBytes, 0);
    assert.ok(offset >= 0 && offset < manifest.cycle.bytes);
  }
});

test('radio build output cannot target tracked or parent directories', () => {
  const projectRoot = '/workspace/d10g3n_music_web';
  assert.equal(
    radioOutputDirectory(projectRoot, '.radio-build'),
    '/workspace/d10g3n_music_web/.radio-build',
  );
  for (const unsafe of ['..', '../other', '.', 'assets', 'public']) {
    assert.throws(() => radioOutputDirectory(projectRoot, unsafe));
  }
});

test('radio pointer publication bootstraps only when explicitly allowed', () => {
  const next = { schemaVersion: 1, manifestKey: `radio/manifests/${'a'.repeat(64)}.json` };
  assert.deepEqual(prepareRadioPointer(next, null, { firstPublication: true }), next);
  assert.throws(() => prepareRadioPointer(next, null), /previous radio pointer is missing/);
  assert.equal(parsePreviousRadioPointer('', true), null);
  assert.throws(() => parsePreviousRadioPointer('', false), SyntaxError);
});

test('radio pointer scheduling rejects malformed stored pointers', () => {
  const next = { schemaVersion: 1, manifestKey: `radio/manifests/${'a'.repeat(64)}.json` };
  assert.throws(() => validateRadioPointer({
    schemaVersion: 2,
    manifestKey: next.manifestKey,
    previousManifestKey: 'invalid',
    activateAtMs: Date.now(),
  }), /previous manifest key is invalid/);
  assert.throws(() => prepareRadioPointer(next, {
    schemaVersion: 2,
    manifestKey: next.manifestKey,
    previousManifestKey: `radio/manifests/${'b'.repeat(64)}.json`,
    activateAtMs: Number.NaN,
  }), /activation time is invalid/);
});

test('radio publication never supersedes a release awaiting activation', () => {
  const next = { schemaVersion: 1, manifestKey: `radio/manifests/${'a'.repeat(64)}.json` };
  const pending = {
    schemaVersion: 2,
    manifestKey: `radio/manifests/${'b'.repeat(64)}.json`,
    previousManifestKey: `radio/manifests/${'c'.repeat(64)}.json`,
    activateAtMs: Date.now() + 60_000,
  };
  assert.throws(
    () => prepareRadioPointer(next, pending, { nowMs: Date.now() }),
    /already awaiting activation/,
  );
});

test('radio endpoint returns non-cacheable 503 for every missing R2 stage', async () => {
  const manifest = manifestFixture();
  const pointer = { schemaVersion: 1, manifestKey: `radio/manifests/${manifest.releaseId}.json` };
  const scenarios = [
    new Map(),
    new Map([['radio/current.json', jsonObject(pointer)]]),
    new Map([
      ['radio/current.json', jsonObject(pointer)],
      [pointer.manifestKey, jsonObject(manifest)],
    ]),
  ];

  for (const objects of scenarios) {
    const response = await onRequestGet(contextFor(objects));
    assert.equal(response.status, 503);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.match(await response.text(), /^radio unavailable:/);
  }
});

test('radio endpoint serves a frame-aligned, non-cacheable MP3 loop', async () => {
  const manifest = manifestFixture();
  const pointer = { schemaVersion: 1, manifestKey: `radio/manifests/${manifest.releaseId}.json` };
  const reel = streamObject(manifest.reel.bytes);
  const objects = new Map([
    ['radio/current.json', jsonObject(pointer)],
    [pointer.manifestKey, jsonObject(manifest)],
    [manifest.reel.key, reel],
  ]);
  const calls = [];
  const response = await onRequestGet(contextFor(objects, calls));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(response.headers.get('content-length'), null);
  assert.equal(Number(response.headers.get('x-radio-frame-offset')) % manifest.audio.frameBytes, 0);
  assert.equal(calls.at(-1).key, manifest.reel.key);
  assert.equal(calls.at(-1).options.range.offset % manifest.audio.frameBytes, 0);
});

test('radio endpoint reopens the current reel at a frame-aligned UTC offset', async () => {
  const manifest = manifestFixture();
  const pointer = { schemaVersion: 1, manifestKey: `radio/manifests/${manifest.releaseId}.json` };
  const calls = [];
  const context = contextFor(new Map([
    ['radio/current.json', jsonObject(pointer)],
    [pointer.manifestKey, jsonObject(manifest)],
    [manifest.reel.key, streamObject(manifest.reel.bytes)],
  ]), calls);
  context.env.RADIO_BUCKET.get = async (key, options) => {
    calls.push({ key, options });
    if (key === manifest.reel.key) return streamObject(manifest.reel.bytes);
    return context.objects.get(key) ?? null;
  };

  const response = await onRequestGet(context);
  const reader = response.body.getReader();
  for (let read = 0; read < 32 && calls.filter((call) => call.key === manifest.reel.key).length < 2; read += 1) {
    assert.equal((await reader.read()).done, false);
  }
  await reader.cancel();

  const reelCalls = calls.filter((call) => call.key === manifest.reel.key);
  assert.ok(reelCalls.length >= 2);
  assert.equal(reelCalls[0].options.range.offset % manifest.audio.frameBytes, 0);
  assert.equal(reelCalls[1].options.range.offset % manifest.audio.frameBytes, 0);
  assert.ok(calls.filter((call) => call.key === 'radio/current.json').length >= 2);
});

test('connected listeners adopt a newly published release at the reel boundary', async () => {
  const oldManifest = manifestFixture('b');
  const newManifest = manifestFixture('c');
  const oldPointer = { schemaVersion: 1, manifestKey: `radio/manifests/${oldManifest.releaseId}.json` };
  const newPointer = { schemaVersion: 1, manifestKey: `radio/manifests/${newManifest.releaseId}.json` };
  const objects = new Map([
    ['radio/current.json', jsonObject(oldPointer)],
    [oldPointer.manifestKey, jsonObject(oldManifest)],
    [newPointer.manifestKey, jsonObject(newManifest)],
    [oldManifest.reel.key, streamObject(oldManifest.reel.bytes)],
    [newManifest.reel.key, streamObject(newManifest.reel.bytes)],
  ]);
  const calls = [];
  const context = contextFor(objects, calls);
  context.env.RADIO_BUCKET.get = async (key, options) => {
    calls.push({ key, options });
    if (key === oldManifest.reel.key) return streamObject(oldManifest.reel.bytes);
    if (key === newManifest.reel.key) return streamObject(newManifest.reel.bytes);
    return objects.get(key) ?? null;
  };

  const response = await onRequestGet(context);
  objects.set('radio/current.json', jsonObject(newPointer));
  const reader = response.body.getReader();
  for (let read = 0; read < 32 && calls.filter((call) => call.key.includes('/reels/')).length < 2; read += 1) {
    assert.equal((await reader.read()).done, false);
  }
  await reader.cancel();

  const reelKeys = calls.filter((call) => call.key.includes('/reels/')).map((call) => call.key);
  assert.deepEqual(reelKeys.slice(0, 2), [oldManifest.reel.key, newManifest.reel.key]);
});

test('scheduled pointer keeps every listener on the previous release until activation', async () => {
  const oldManifest = manifestFixture('b');
  const newManifest = manifestFixture('c');
  const pointer = {
    schemaVersion: 2,
    manifestKey: `radio/manifests/${newManifest.releaseId}.json`,
    previousManifestKey: `radio/manifests/${oldManifest.releaseId}.json`,
    activateAtMs: Date.now() + 60_000,
  };
  const objects = new Map([
    ['radio/current.json', jsonObject(pointer)],
    [pointer.previousManifestKey, jsonObject(oldManifest)],
    [pointer.manifestKey, jsonObject(newManifest)],
    [oldManifest.reel.key, streamObject(oldManifest.reel.bytes)],
    [newManifest.reel.key, streamObject(newManifest.reel.bytes)],
  ]);

  const response = await onRequestGet(contextFor(objects));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-radio-release'), oldManifest.releaseId);
  await response.body.cancel();
});

test('radio stream propagates R2 range body failures', async () => {
  const manifest = manifestFixture();
  const pointer = { schemaVersion: 1, manifestKey: `radio/manifests/${manifest.releaseId}.json` };
  const objects = new Map([
    ['radio/current.json', jsonObject(pointer)],
    [pointer.manifestKey, jsonObject(manifest)],
    [manifest.reel.key, streamObject(manifest.reel.bytes)],
  ]);
  const context = contextFor(objects);
  const originalGet = context.env.RADIO_BUCKET.get;
  context.env.RADIO_BUCKET.get = async (key, options) => key === manifest.reel.key
    ? failingStreamObject(manifest.reel.bytes)
    : originalGet(key, options);

  const response = await onRequestGet(context);
  assert.equal(response.status, 200);
  const reader = response.body.getReader();
  await assert.rejects(reader.read(), /R2 range failed/);
});

test('radio endpoint converts R2 failures to a non-cacheable 503', async () => {
  const response = await onRequestGet({
    request: new Request('https://d10g3n.live/radio.mp3'),
    env: { RADIO_BUCKET: { async get() { throw new Error('R2 unavailable'); } } },
  });
  assert.equal(response.status, 503);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.match(await response.text(), /storage error/);
});

function manifestFixture(release = 'b') {
  return {
    schemaVersion: 1,
    releaseId: release.repeat(64),
    stationName: 'Diogen Live Radio',
    epochMs: Date.parse('2026-01-01T00:00:00.000Z'),
    audio: {
      contentType: 'audio/mpeg',
      bitrateKbps: 128,
      sampleRateHz: 48000,
      channels: 2,
      frameBytes: 384,
      frameDurationMs: 24,
    },
    cycle: {
      bytes: 38400,
      frames: 100,
      durationMs: 2400,
    },
    reel: {
      key: `radio/reels/${release.repeat(64)}.mp3`,
      bytes: 76800,
      copies: 2,
      sha256: 'd'.repeat(64),
    },
  };
}

function jsonObject(value) {
  return {
    size: JSON.stringify(value).length,
    body: new ReadableStream(),
    async json() { return value; },
  };
}

function streamObject(size) {
  return {
    size,
    body: new ReadableStream({
      start(controller) {
        const bytes = new Uint8Array(size);
        bytes.set([0xff, 0xfb, 0x94, 0x00]);
        controller.enqueue(bytes);
        controller.close();
      },
    }),
    async json() { throw new Error('not JSON'); },
  };
}

function failingStreamObject(size) {
  return {
    size,
    body: new ReadableStream({
      start(controller) { controller.error(new Error('R2 range failed')); },
    }),
    async json() { throw new Error('not JSON'); },
  };
}

function contextFor(objects, calls = []) {
  return {
    objects,
    request: new Request('https://d10g3n.live/radio.mp3'),
    env: {
      RADIO_BUCKET: {
        async get(key, options) {
          calls.push({ key, options });
          return objects.get(key) ?? null;
        },
        async head(key) { return objects.has(key) ? objects.get(key) : null; },
      },
    },
  };
}

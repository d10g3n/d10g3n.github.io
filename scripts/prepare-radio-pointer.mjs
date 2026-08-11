import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDirectory = resolve('.radio-build');
const nextPath = resolve(outputDirectory, 'current.json');
const previousPath = resolve(outputDirectory, 'previous-current.json');
const manifestKeyPattern = /^radio\/manifests\/[a-f0-9]{64}\.json$/;
const activationIntervalMs = 10 * 60 * 1000;
const activationLeadMs = 2 * activationIntervalMs;

function assertManifestKey(value, label) {
  if (typeof value !== 'string' || !manifestKeyPattern.test(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

export function validateRadioPointer(value, label = 'radio pointer') {
  if (!value || typeof value !== 'object') throw new Error(`${label} is invalid`);
  const manifestKey = assertManifestKey(value.manifestKey, `${label} manifest key`);
  if (value.schemaVersion === 1) return { schemaVersion: 1, manifestKey };
  if (value.schemaVersion !== 2) throw new Error(`${label} schema version is invalid`);
  const previousManifestKey = assertManifestKey(
    value.previousManifestKey,
    `${label} previous manifest key`,
  );
  if (!Number.isFinite(value.activateAtMs) || value.activateAtMs <= 0) {
    throw new Error(`${label} activation time is invalid`);
  }
  return {
    schemaVersion: 2,
    manifestKey,
    previousManifestKey,
    activateAtMs: value.activateAtMs,
  };
}

function effectiveManifestKey(pointer, nowMs) {
  return pointer.schemaVersion === 2 && nowMs < pointer.activateAtMs
    ? pointer.previousManifestKey
    : pointer.manifestKey;
}

export function prepareRadioPointer(nextValue, previousValue, {
  nowMs = Date.now(),
  firstPublication = false,
} = {}) {
  const next = validateRadioPointer(nextValue, 'next radio pointer');
  if (next.schemaVersion !== 1) throw new Error('generated radio pointer must use schema version 1');

  if (previousValue === null) {
    if (!firstPublication) throw new Error('previous radio pointer is missing');
    return next;
  }

  const previous = validateRadioPointer(previousValue, 'previous radio pointer');
  if (previous.schemaVersion === 2 && previous.manifestKey === next.manifestKey) {
    return previous;
  }
  if (previous.schemaVersion === 2 && nowMs < previous.activateAtMs) {
    throw new Error('a different radio release is already awaiting activation');
  }

  const previousManifestKey = effectiveManifestKey(previous, nowMs);
  if (previousManifestKey === next.manifestKey) return next;

  const activateAtMs = Math.ceil(
    (nowMs + activationLeadMs) / activationIntervalMs,
  ) * activationIntervalMs;
  return {
    schemaVersion: 2,
    manifestKey: next.manifestKey,
    previousManifestKey,
    activateAtMs,
  };
}

export function parsePreviousRadioPointer(text, firstPublication) {
  if (text.trim()) return JSON.parse(text);
  if (firstPublication) return null;
  return JSON.parse(text);
}

async function main() {
  const next = JSON.parse(await readFile(nextPath, 'utf8'));
  const firstPublication = process.env.RADIO_FIRST_PUBLICATION === 'true';
  let previous = null;
  try {
    const previousText = await readFile(previousPath, 'utf8');
    previous = parsePreviousRadioPointer(previousText, firstPublication);
  } catch (error) {
    if (!firstPublication || error?.code !== 'ENOENT') throw error;
  }

  const prepared = prepareRadioPointer(next, previous, { firstPublication });
  await writeFile(nextPath, `${JSON.stringify(prepared, null, 2)}\n`);
  if (previous === null) {
    console.log('Prepared first radio publication.');
  } else if (prepared.schemaVersion === 2) {
    console.log(`Radio release activates at ${new Date(prepared.activateAtMs).toISOString()}.`);
  } else {
    console.log('Radio release is unchanged.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}

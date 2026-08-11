type R2Object = {
  size: number;
};

type R2ObjectBody = R2Object & {
  body: ReadableStream<Uint8Array>;
  json<T>(): Promise<T>;
};

type R2Bucket = {
  get(key: string, options?: { range?: { offset: number; length?: number } }): Promise<R2ObjectBody | null>;
  head(key: string): Promise<R2Object | null>;
};

type Env = {
  RADIO_BUCKET: R2Bucket;
};

type RadioContext = {
  env: Env;
  request: Request;
};

type RadioPointerV1 = {
  schemaVersion: 1;
  manifestKey: string;
};

type RadioPointerV2 = {
  schemaVersion: 2;
  manifestKey: string;
  previousManifestKey: string;
  activateAtMs: number;
};

type RadioPointer = RadioPointerV1 | RadioPointerV2;

export type RadioManifest = {
  schemaVersion: 1;
  releaseId: string;
  stationName: string;
  epochMs: number;
  audio: {
    contentType: 'audio/mpeg';
    bitrateKbps: number;
    sampleRateHz: number;
    channels: number;
    frameBytes: number;
    frameDurationMs: number;
  };
  cycle: {
    bytes: number;
    frames: number;
    durationMs: number;
  };
  reel: {
    key: string;
    bytes: number;
    copies: number;
    sha256: string;
  };
};

const CURRENT_POINTER_KEY = 'radio/current.json';
const MANIFEST_KEY = /^radio\/manifests\/[a-f0-9]{64}\.json$/;
const REEL_KEY = /^radio\/reels\/[a-f0-9]{64}\.mp3$/;
const SEGMENT_DURATION_MS = 10 * 60 * 1000;
const STARTUP_LEAD_MS = 1000;

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function validPointer(value: unknown): value is RadioPointer {
  if (!value || typeof value !== 'object') return false;
  const pointer = value as {
    schemaVersion?: unknown;
    manifestKey?: unknown;
    previousManifestKey?: unknown;
    activateAtMs?: unknown;
  };
  if (typeof pointer.manifestKey !== 'string' || !MANIFEST_KEY.test(pointer.manifestKey)) return false;
  if (pointer.schemaVersion === 1) return true;
  return pointer.schemaVersion === 2
    && typeof pointer.previousManifestKey === 'string'
    && MANIFEST_KEY.test(pointer.previousManifestKey)
    && Number.isFinite(pointer.activateAtMs)
    && Number(pointer.activateAtMs) > 0;
}

function effectiveManifestKey(pointer: RadioPointer, nowMs: number): string {
  return pointer.schemaVersion === 2 && nowMs < pointer.activateAtMs
    ? pointer.previousManifestKey
    : pointer.manifestKey;
}

function validManifest(value: unknown): value is RadioManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<RadioManifest>;
  return manifest.schemaVersion === 1
    && typeof manifest.releaseId === 'string'
    && /^[a-f0-9]{64}$/.test(manifest.releaseId)
    && typeof manifest.stationName === 'string'
    && Number.isFinite(manifest.epochMs)
    && manifest.audio?.contentType === 'audio/mpeg'
    && manifest.audio.bitrateKbps === 128
    && manifest.audio.sampleRateHz === 48000
    && manifest.audio.channels === 2
    && manifest.audio.frameBytes === 384
    && manifest.audio.frameDurationMs === 24
    && positiveInteger(manifest.cycle?.bytes)
    && positiveInteger(manifest.cycle?.frames)
    && positiveInteger(manifest.cycle?.durationMs)
    && manifest.cycle.bytes === manifest.cycle.frames * manifest.audio.frameBytes
    && manifest.cycle.durationMs === manifest.cycle.frames * manifest.audio.frameDurationMs
    && typeof manifest.reel?.key === 'string'
    && REEL_KEY.test(manifest.reel.key)
    && manifest.reel.key === `radio/reels/${manifest.releaseId}.mp3`
    && positiveInteger(manifest.reel.bytes)
    && positiveInteger(manifest.reel.copies)
    && manifest.reel.copies >= 2
    && typeof manifest.reel.sha256 === 'string'
    && /^[a-f0-9]{64}$/.test(manifest.reel.sha256)
    && manifest.reel.bytes === manifest.cycle.bytes * manifest.reel.copies;
}

export function radioFrameOffset(nowMs: number, manifest: RadioManifest): number {
  const elapsedMs = ((nowMs - manifest.epochMs) % manifest.cycle.durationMs + manifest.cycle.durationMs)
    % manifest.cycle.durationMs;
  const frame = Math.floor(elapsedMs / manifest.audio.frameDurationMs);
  return frame * manifest.audio.frameBytes;
}

function headers(manifest?: RadioManifest): Headers {
  const result = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': manifest?.audio.contentType ?? 'text/plain; charset=utf-8',
  });
  if (manifest) {
    result.set('Icy-Br', String(manifest.audio.bitrateKbps));
    result.set('Icy-Name', manifest.stationName);
  }
  return result;
}

function unavailable(reason: string): Response {
  return new Response(`radio unavailable: ${reason}\n`, {
    status: 503,
    headers: headers(),
  });
}

class RadioUnavailableError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.reason = reason;
  }
}

async function readJson<T>(object: R2ObjectBody | null): Promise<T | null> {
  if (!object) return null;
  try {
    return await object.json<T>();
  } catch {
    return null;
  }
}

async function loadCurrentRadio(bucket: R2Bucket, nowMs = Date.now()): Promise<{
  manifest: RadioManifest;
  pointer: RadioPointer;
}> {
  const pointer = await readJson<unknown>(await bucket.get(CURRENT_POINTER_KEY));
  if (!pointer) throw new RadioUnavailableError('pointer missing');
  if (!validPointer(pointer)) throw new RadioUnavailableError('pointer invalid');

  const loaded = await loadManifestForPointer(bucket, pointer, nowMs);
  return effectiveManifestKey(pointer, Date.now()) === `radio/manifests/${loaded.manifest.releaseId}.json`
    ? loaded
    : loadManifestForPointer(bucket, pointer, Date.now());
}

async function loadManifestForPointer(
  bucket: R2Bucket,
  pointer: RadioPointer,
  nowMs: number,
): Promise<{ manifest: RadioManifest; pointer: RadioPointer }> {
  const manifestKey = effectiveManifestKey(pointer, nowMs);
  const manifest = await readJson<unknown>(await bucket.get(manifestKey));
  if (!manifest) throw new RadioUnavailableError('manifest missing');
  if (!validManifest(manifest)) throw new RadioUnavailableError('manifest invalid');
  if (manifestKey !== `radio/manifests/${manifest.releaseId}.json`) {
    throw new RadioUnavailableError('release mismatch');
  }

  const reelHead = await bucket.head(manifest.reel.key);
  if (!reelHead) throw new RadioUnavailableError('reel missing');
  if (reelHead.size !== manifest.reel.bytes) throw new RadioUnavailableError('reel size mismatch');
  return { manifest, pointer };
}

type RadioContinuation = {
  releaseId: string;
  nextOffset: number;
  nextPlayheadMs: number;
  manifest: RadioManifest;
};

function nextFrameAtOrAfter(targetMs: number, manifest: RadioManifest): number {
  const frames = Math.ceil((targetMs - manifest.epochMs) / manifest.audio.frameDurationMs);
  return manifest.epochMs + frames * manifest.audio.frameDurationMs;
}

async function openCurrentRadioBody(
  bucket: R2Bucket,
  continuation?: RadioContinuation,
): Promise<{
  body: ReadableStream<Uint8Array>;
  manifest: RadioManifest;
  offset: number;
  playheadMs: number;
  continuation: RadioContinuation;
}> {
  let selectionMs = continuation?.nextPlayheadMs ?? Date.now();
  let loaded: { manifest: RadioManifest; pointer: RadioPointer };
  if (continuation) {
    const pointer = await readJson<unknown>(await bucket.get(CURRENT_POINTER_KEY));
    if (!pointer) throw new RadioUnavailableError('pointer missing');
    if (!validPointer(pointer)) throw new RadioUnavailableError('pointer invalid');
    const activeKey = effectiveManifestKey(pointer, selectionMs);
    loaded = activeKey === `radio/manifests/${continuation.releaseId}.json`
      ? { manifest: continuation.manifest, pointer }
      : await loadManifestForPointer(bucket, pointer, selectionMs);
  } else {
    loaded = await loadCurrentRadio(bucket);
    selectionMs = nextFrameAtOrAfter(Date.now() + STARTUP_LEAD_MS, loaded.manifest);
    if (effectiveManifestKey(loaded.pointer, selectionMs)
      !== `radio/manifests/${loaded.manifest.releaseId}.json`) {
      loaded = await loadManifestForPointer(bucket, loaded.pointer, selectionMs);
    }
  }
  const { manifest, pointer } = loaded;
  const sameRelease = continuation?.releaseId === manifest.releaseId;
  const offset = sameRelease
    ? continuation.nextOffset
    : radioFrameOffset(selectionMs, manifest);

  const untilClockBoundary = SEGMENT_DURATION_MS - (selectionMs % SEGMENT_DURATION_MS);
  const untilActivation = pointer.schemaVersion === 2 && selectionMs < pointer.activateAtMs
    ? pointer.activateAtMs - selectionMs
    : Number.POSITIVE_INFINITY;
  const segmentMs = Math.max(
    manifest.audio.frameDurationMs,
    Math.min(untilClockBoundary, untilActivation),
  );
  const requestedFrames = Math.ceil(segmentMs / manifest.audio.frameDurationMs);
  const availableFrames = Math.floor((manifest.reel.bytes - offset) / manifest.audio.frameBytes);
  const segmentFrames = Math.min(requestedFrames, availableFrames);
  if (segmentFrames < 1) throw new RadioUnavailableError('segment is empty');
  const length = segmentFrames * manifest.audio.frameBytes;
  const reel = await bucket.get(manifest.reel.key, { range: { offset, length } });
  if (!reel) throw new RadioUnavailableError('reel missing');
  if (!continuation && Date.now() >= selectionMs) {
    await reel.body.cancel();
    throw new RadioUnavailableError('storage startup too slow');
  }

  return {
    body: reel.body,
    manifest,
    offset,
    playheadMs: selectionMs,
    continuation: {
      releaseId: manifest.releaseId,
      nextOffset: (offset + length) % manifest.cycle.bytes,
      nextPlayheadMs: selectionMs + segmentFrames * manifest.audio.frameDurationMs,
      manifest,
    },
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new Error('radio stream cancelled'));
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('radio stream cancelled'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function reopenWithRetry(
  bucket: R2Bucket,
  continuation: RadioContinuation,
  signal: AbortSignal,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await openCurrentRadioBody(bucket, continuation);
    } catch (error) {
      lastError = error;
      await delay(250 * (attempt + 1), signal);
    }
  }
  throw lastError;
}

function loopRadioBody(
  bucket: R2Bucket,
  first: Awaited<ReturnType<typeof openCurrentRadioBody>>,
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const bridge = new TransformStream<Uint8Array, Uint8Array>();
  let prefetched: Awaited<ReturnType<typeof openCurrentRadioBody>> | null = null;
  void (async () => {
    let opened = first;
    while (!signal.aborted) {
      const startWaitMs = opened.playheadMs - Date.now();
      if (startWaitMs > 0) await delay(startWaitMs, signal);
      await opened.body.pipeTo(bridge.writable, { preventClose: true, signal });
      prefetched = await reopenWithRetry(bucket, opened.continuation, signal);
      if (signal.aborted) throw new Error('radio stream cancelled');
      const waitMs = opened.continuation.nextPlayheadMs - Date.now();
      if (waitMs > 0) await delay(waitMs, signal);
      opened = prefetched;
      prefetched = null;
    }
  })().catch(async (error) => {
    await prefetched?.body.cancel(error).catch(() => undefined);
    prefetched = null;
    try {
      await bridge.writable.abort(error);
    } catch {
      // The client already closed the response.
    }
  });
  return bridge.readable;
}

async function radioResponse(context: RadioContext, headOnly: boolean): Promise<Response> {
  if (headOnly) {
    const { manifest } = await loadCurrentRadio(context.env.RADIO_BUCKET);
    return new Response(null, { status: 200, headers: headers(manifest) });
  }

  const opened = await openCurrentRadioBody(context.env.RADIO_BUCKET);
  const responseHeaders = headers(opened.manifest);
  responseHeaders.set('X-Radio-Frame-Offset', String(opened.offset));
  responseHeaders.set('X-Radio-Release', opened.manifest.releaseId);
  return new Response(loopRadioBody(context.env.RADIO_BUCKET, opened, context.request.signal), {
    status: 200,
    headers: responseHeaders,
  });
}

export function onRequestGet(context: RadioContext): Promise<Response> {
  return radioResponse(context, false).catch((error) => unavailable(
    error instanceof RadioUnavailableError ? error.reason : 'storage error',
  ));
}

export function onRequestHead(context: RadioContext): Promise<Response> {
  return radioResponse(context, true).catch((error) => unavailable(
    error instanceof RadioUnavailableError ? error.reason : 'storage error',
  ));
}

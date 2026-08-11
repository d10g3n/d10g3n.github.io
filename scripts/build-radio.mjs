import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function seededRandom(seed) {
  const digest = createHash('sha256').update(seed).digest();
  let state = digest.readUInt32LE(0);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function frameGeometry(encoding) {
  assert(encoding.codec === 'mp3', 'radio encoding must be MP3');
  assert(encoding.bitrateKbps === 128, 'radio bitrate must be 128 kbps CBR');
  assert(encoding.sampleRateHz === 48000, 'radio sample rate must be 48 kHz');
  assert(encoding.channels === 2, 'radio output must be stereo');
  return {
    frameBytes: 384,
    frameDurationMs: 24,
  };
}

export function createRadioPlan(catalog, config) {
  assert(Array.isArray(catalog.tracks), 'catalog tracks are required');
  assert(config.jingleProbability >= 0 && config.jingleProbability <= 1, 'jingle probability must be between 0 and 1');

  for (const track of catalog.tracks) {
    assert(
      track.availability?.radio === undefined || typeof track.availability.radio === 'boolean',
      `availability.radio must be boolean for ${track.id}`,
    );
  }

  const tracks = catalog.tracks
    .filter((track) => track.availability?.radio !== false)
    .map((track) => ({
      kind: 'track',
      trackId: track.id,
      title: track.title,
      source: track.audioFile,
    }));
  assert(tracks.length > 0, 'at least one radio-eligible track is required');

  const random = seededRandom(config.seed);
  for (let index = tracks.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [tracks[index], tracks[swap]] = [tracks[swap], tracks[index]];
  }

  const items = [];
  for (let index = 0; index < tracks.length; index += 1) {
    items.push(tracks[index]);
    if (index < tracks.length - 1 && random() < config.jingleProbability) {
      items.push({
        kind: 'jingle',
        title: config.stationName,
        source: config.jingleFile,
      });
    }
  }

  return { items, eligibleTrackIds: tracks.map((track) => track.trackId) };
}

function transitionSeconds(left, right, config) {
  return left.kind === 'jingle' || right.kind === 'jingle'
    ? config.jingleCrossfadeSeconds
    : config.crossfadeSeconds;
}

export function buildProgramOffsets(plan, durations, config, geometry, boundaryFadeSeconds) {
  const boundaryFade = boundaryFadeSeconds
    ?? transitionSeconds(plan.items.at(-1), plan.items[0], config);
  let cursorMs = -boundaryFade * 1000;
  return plan.items.map((item, index) => {
    const durationSeconds = durations.get(item.source);
    assert(Number.isFinite(durationSeconds) && durationSeconds > 0, `missing duration for ${item.source}`);
    const startFrame = Math.max(0, Math.floor(cursorMs / geometry.frameDurationMs));
    const result = {
      kind: item.kind,
      ...(item.trackId ? { trackId: item.trackId } : {}),
      title: item.title,
      startFrame,
      startByte: startFrame * geometry.frameBytes,
      startMs: startFrame * geometry.frameDurationMs,
    };
    cursorMs += durationSeconds * 1000;
    if (index < plan.items.length - 1) {
      cursorMs -= transitionSeconds(item, plan.items[index + 1], config) * 1000;
    }
    return result;
  });
}

export function radioOutputDirectory(projectRoot, configuredDirectory) {
  const outputDirectory = resolve(projectRoot, configuredDirectory);
  assert(relative(projectRoot, outputDirectory) === '.radio-build', 'radio output directory must be .radio-build');
  return outputDirectory;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  assert(result.status === 0, `${command} exited with status ${result.status}`);
}

function probeDuration(file) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ], { encoding: 'utf8' });
  if (result.error) throw result.error;
  assert(result.status === 0, `ffprobe failed for ${file}`);
  const duration = Number(result.stdout.trim());
  assert(Number.isFinite(duration) && duration > 0, `invalid duration for ${file}`);
  return duration;
}

function probeSamples(file) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=duration_ts',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    file,
  ], { encoding: 'utf8' });
  if (result.error) throw result.error;
  assert(result.status === 0, `ffprobe failed for ${file}`);
  const samples = Number(result.stdout.trim());
  assert(Number.isInteger(samples) && samples > 0, `invalid sample count for ${file}`);
  return samples;
}

function validateMp3Frames(buffer, geometry) {
  assert(buffer.length > 0, 'radio cycle is empty');
  assert(buffer.length % geometry.frameBytes === 0, 'radio cycle is not frame aligned');
  for (let offset = 0; offset < buffer.length; offset += geometry.frameBytes) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    const third = buffer[offset + 2];
    assert(first === 0xff && (second & 0xfe) === 0xfa, `invalid MPEG-1 Layer III frame at byte ${offset}`);
    assert((third >> 4) === 9, `non-128-kbps frame at byte ${offset}`);
    assert(((third >> 2) & 3) === 1, `non-48-kHz frame at byte ${offset}`);
    assert((third & 2) === 0, `padded MP3 frame at byte ${offset}`);
    const sideInfoOffset = offset + ((second & 1) === 1 ? 4 : 6);
    const mainDataBegin = (buffer[sideInfoOffset] << 1) | (buffer[sideInfoOffset + 1] >> 7);
    assert(mainDataBegin === 0, `MP3 bit reservoir is used at byte ${offset}`);
  }
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

function renderPcmCycle(plan, config, cycleFile, boundaryFade) {
  const inputArgs = plan.items.flatMap((item) => ['-i', resolve(root, item.source)]);
  const filters = plan.items.map((_, index) => (
    `[${index}:a:0]aresample=${config.encoding.sampleRateHz},` +
    `aformat=sample_fmts=fltp:channel_layouts=stereo,` +
    `loudnorm=I=${config.loudness.integratedLufs}:TP=${config.loudness.truePeakDb}:LRA=${config.loudness.rangeLufs}` +
    `[a${index}${index === 0 ? 'full' : ''}]`
  ));

  filters.push('[a0full]asplit=2[a0body_source][a0head_source]');
  filters.push(`[a0body_source]atrim=start=${boundaryFade},asetpts=PTS-STARTPTS[a0]`);
  filters.push(`[a0head_source]atrim=end=${boundaryFade},asetpts=PTS-STARTPTS[a0head]`);

  let mixed = 'a0';
  for (let index = 1; index < plan.items.length; index += 1) {
    const output = `mix${index}`;
    const fade = transitionSeconds(plan.items[index - 1], plan.items[index], config);
    filters.push(`[${mixed}][a${index}]acrossfade=d=${fade}:c1=qsin:c2=qsin[${output}]`);
    mixed = output;
  }
  filters.push(`[${mixed}][a0head]acrossfade=d=${boundaryFade}:c1=qsin:c2=qsin[cycle]`);

  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning', '-nostdin', '-y',
    ...inputArgs,
    '-filter_complex', filters.join(';'),
    '-map', '[cycle]',
    '-vn', '-threads', '1',
    '-codec:a', 'pcm_s16le',
    '-ar', String(config.encoding.sampleRateHz),
    '-ac', String(config.encoding.channels),
    '-map_metadata', '-1',
    cycleFile,
  ]);
}

function encodeRepeatedPcm(cycleFile, encodedFile, config) {
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'warning', '-nostdin', '-y',
    '-stream_loop', String(config.copies + 1),
    '-i', cycleFile,
    '-map', '0:a:0',
    '-vn', '-threads', '1',
    '-codec:a', 'libmp3lame',
    '-b:a', `${config.encoding.bitrateKbps}k`,
    '-reservoir', '0',
    '-ar', String(config.encoding.sampleRateHz),
    '-ac', String(config.encoding.channels),
    '-write_xing', '0',
    '-id3v2_version', '0',
    '-map_metadata', '-1',
    encodedFile,
  ]);
}

function extractSteadyReel(encoded, cycleFrames, copies, geometry) {
  validateMp3Frames(encoded, geometry);
  const totalFrames = encoded.length / geometry.frameBytes;
  const requiredBlocks = copies + 1;

  for (let startFrame = 0; startFrame + requiredBlocks * cycleFrames <= totalFrames; startFrame += 1) {
    const firstStart = startFrame * geometry.frameBytes;
    const firstEnd = firstStart + cycleFrames * geometry.frameBytes;
    const first = encoded.subarray(firstStart, firstEnd);
    let stable = true;
    for (let block = 1; block < requiredBlocks; block += 1) {
      const start = firstStart + block * cycleFrames * geometry.frameBytes;
      const candidate = encoded.subarray(start, start + cycleFrames * geometry.frameBytes);
      if (!first.equals(candidate)) {
        stable = false;
        break;
      }
    }
    if (stable) {
      return {
        cycle: first,
        reel: encoded.subarray(firstStart, firstStart + copies * cycleFrames * geometry.frameBytes),
      };
    }
  }

  throw new Error('could not find a steady-state MP3 cycle');
}

export function createRadioRelease(coreManifest) {
  const releaseId = createHash('sha256').update(JSON.stringify(coreManifest)).digest('hex');
  const manifest = {
    ...coreManifest,
    releaseId,
    reel: {
      ...coreManifest.reel,
      key: `radio/reels/${releaseId}.mp3`,
    },
  };
  return {
    manifest,
    pointer: { schemaVersion: 1, manifestKey: `radio/manifests/${releaseId}.json` },
  };
}

function validateConfig(config) {
  assert(typeof config.stationName === 'string' && config.stationName, 'station name is required');
  assert(typeof config.seed === 'string' && config.seed, 'radio seed is required');
  assert(typeof config.epoch === 'string' && config.epoch.endsWith('Z') && Number.isFinite(Date.parse(config.epoch)), 'explicit UTC epoch is required');
  assert(config.copies === 2, 'radio reel must contain exactly two cycle copies');
  assert(config.limits?.maxCycleMinutes > 0, 'maximum cycle duration is required');
  assert(Number.isInteger(config.limits?.maxReelBytes) && config.limits.maxReelBytes > 0, 'maximum reel size is required');
  assert(config.crossfadeSeconds > 0, 'crossfade must be positive');
  assert(config.jingleCrossfadeSeconds > 0, 'jingle crossfade must be positive');
}

export async function buildRadio() {
  const catalog = JSON.parse(await readFile(resolve(root, 'web.json'), 'utf8'));
  const config = JSON.parse(await readFile(resolve(root, 'radio.config.json'), 'utf8'));
  validateConfig(config);
  const geometry = frameGeometry(config.encoding);
  const plan = createRadioPlan(catalog, config);

  const outputDirectory = radioOutputDirectory(root, config.outputDirectory);

  const durations = new Map();
  for (const item of plan.items) {
    const source = resolve(root, item.source);
    await access(source);
    if (!durations.has(item.source)) durations.set(item.source, probeDuration(source));
  }
  for (let index = 0; index < plan.items.length; index += 1) {
    const left = plan.items[index];
    const right = plan.items[(index + 1) % plan.items.length];
    const fade = transitionSeconds(left, right, config);
    assert(fade <= Math.min(durations.get(left.source), durations.get(right.source)), `crossfade exceeds source duration between ${left.title} and ${right.title}`);
  }
  const estimatedCycleSeconds = plan.items.reduce(
    (total, item) => total + durations.get(item.source),
    0,
  ) - plan.items.reduce((total, item, index) => (
    total + transitionSeconds(item, plan.items[(index + 1) % plan.items.length], config)
  ), 0);
  assert(
    estimatedCycleSeconds <= config.limits.maxCycleMinutes * 60,
    `radio cycle exceeds ${config.limits.maxCycleMinutes} minutes`,
  );

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const cycleFile = resolve(outputDirectory, 'radio-cycle.wav');
  const encodedFile = resolve(outputDirectory, 'radio-encoded.mp3');
  const reelFile = resolve(outputDirectory, 'radio-reel.mp3');
  let boundaryFade = transitionSeconds(plan.items.at(-1), plan.items[0], config);
  renderPcmCycle(plan, config, cycleFile, boundaryFade);
  let cycleSamples = probeSamples(cycleFile);
  const samplesPerFrame = config.encoding.sampleRateHz * geometry.frameDurationMs / 1000;
  const remainder = cycleSamples % samplesPerFrame;
  if (remainder !== 0) {
    boundaryFade += remainder / config.encoding.sampleRateHz;
    await rm(cycleFile);
    renderPcmCycle(plan, config, cycleFile, boundaryFade);
    cycleSamples = probeSamples(cycleFile);
  }
  assert(cycleSamples % samplesPerFrame === 0, 'PCM cycle is not MP3-frame aligned');
  const cycleFrames = cycleSamples / samplesPerFrame;

  encodeRepeatedPcm(cycleFile, encodedFile, config);
  const steady = extractSteadyReel(await readFile(encodedFile), cycleFrames, config.copies, geometry);
  await writeFile(reelFile, steady.reel);

  const reelStats = await stat(reelFile);
  assert(reelStats.size <= config.limits.maxReelBytes, 'radio reel exceeds configured size limit');
  assert(reelStats.size === steady.cycle.length * config.copies, 'duplicated reel size is inconsistent');
  const program = buildProgramOffsets(plan, durations, config, geometry, boundaryFade);
  assert(program.every((item) => item.startFrame < cycleFrames), 'program offsets exceed the rendered cycle');
  const reelSha256 = await sha256(reelFile);
  const coreManifest = {
    schemaVersion: 1,
    stationName: config.stationName,
    epochMs: Date.parse(config.epoch),
    seed: config.seed,
    audio: {
      codec: 'mp3',
      contentType: 'audio/mpeg',
      bitrateKbps: config.encoding.bitrateKbps,
      sampleRateHz: config.encoding.sampleRateHz,
      channels: config.encoding.channels,
      ...geometry,
    },
    cycle: {
      bytes: steady.cycle.length,
      frames: cycleFrames,
      durationMs: cycleFrames * geometry.frameDurationMs,
    },
    reel: {
      bytes: reelStats.size,
      copies: config.copies,
      sha256: reelSha256,
    },
    eligibleTrackIds: plan.eligibleTrackIds,
    program,
  };
  const { manifest, pointer } = createRadioRelease(coreManifest);

  await Promise.all([
    writeFile(resolve(outputDirectory, 'radio-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(resolve(outputDirectory, 'current.json'), `${JSON.stringify(pointer, null, 2)}\n`),
  ]);
  await Promise.all([rm(cycleFile), rm(encodedFile)]);

  console.log(`Built ${plan.eligibleTrackIds.length}-track radio reel (${(reelStats.size / 1048576).toFixed(2)} MiB).`);
  console.log(`Release: ${manifest.releaseId}`);
  console.log(`Output: ${relative(root, outputDirectory)}`);
  return { manifest, pointer, outputDirectory, reelFile };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await buildRadio();
}

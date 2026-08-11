export type RepeatMode = 'off' | 'all' | 'one';

export type StoredPlayerState = {
  trackId: string;
  currentTime: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
};

const repeatModes: RepeatMode[] = ['off', 'all', 'one'];

export function parsePlayerState(
  raw: string | null,
  validTrackIds: ReadonlySet<string>,
): StoredPlayerState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredPlayerState>;
    if (!value.trackId || !validTrackIds.has(value.trackId)) return null;
    if (!Number.isFinite(value.currentTime) || Number(value.currentTime) < 0) return null;
    if (!Number.isFinite(value.volume) || Number(value.volume) < 0 || Number(value.volume) > 1) return null;
    if (typeof value.shuffle !== 'boolean' || !repeatModes.includes(value.repeat as RepeatMode)) return null;
    return {
      trackId: value.trackId,
      currentTime: Number(value.currentTime),
      volume: Number(value.volume),
      shuffle: value.shuffle,
      repeat: value.repeat as RepeatMode,
    };
  } catch {
    return null;
  }
}

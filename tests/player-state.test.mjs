import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePlayerState } from '../lib/player-state.ts';

const validIds = new Set(['track1']);

test('valid paused player state is restored', () => {
  const state = parsePlayerState(JSON.stringify({
    trackId: 'track1', currentTime: 42.5, volume: 0.4, shuffle: true, repeat: 'all',
  }), validIds);
  assert.deepEqual(state, {
    trackId: 'track1', currentTime: 42.5, volume: 0.4, shuffle: true, repeat: 'all',
  });
});

test('invalid or stale player state is discarded', () => {
  assert.equal(parsePlayerState('{broken', validIds), null);
  assert.equal(parsePlayerState(JSON.stringify({ trackId: 'missing', currentTime: 1, volume: 1, shuffle: false, repeat: 'off' }), validIds), null);
  assert.equal(parsePlayerState(JSON.stringify({ trackId: 'track1', currentTime: -1, volume: 2, shuffle: false, repeat: 'off' }), validIds), null);
});

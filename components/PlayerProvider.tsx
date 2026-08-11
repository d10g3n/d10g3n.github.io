'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getTrackById, publicPath, tracks } from '../lib/catalog';
import { parsePlayerState, type RepeatMode } from '../lib/player-state';
import type { Track } from '../lib/types';

const STORAGE_KEY = 'd10g3n_player_state_v1';
const validTrackIds = new Set(tracks.map((track) => track.id));

type PlayerContextValue = {
  ready: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  selectTrack: (trackId: string, autoplay?: boolean) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const previousVolumeRef = useRef(1);
  const [ready, setReady] = useState(false);
  const [trackId, setTrackId] = useState(tracks[0]?.id ?? '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');

  const snapshotRef = useRef({ trackId, currentTime, volume, shuffle, repeat });
  snapshotRef.current = { trackId, currentTime, volume, shuffle, repeat };

  const selectTrack = useCallback((nextTrackId: string, autoplay = true) => {
    const track = getTrackById(nextTrackId);
    const audio = audioRef.current;
    if (!track || !audio) return;

    const nextSource = new URL(publicPath(track.audioFile), window.location.origin).href;
    if (audio.src !== nextSource) {
      audio.src = nextSource;
      audio.load();
      setCurrentTime(0);
    }
    setTrackId(track.id);
    if (autoplay) void audio.play().catch(() => setIsPlaying(false));
  }, []);

  const playNext = useCallback(() => {
    if (!tracks.length) return;
    const currentIndex = Math.max(0, tracks.findIndex((track) => track.id === snapshotRef.current.trackId));
    let nextIndex = (currentIndex + 1) % tracks.length;
    if (snapshotRef.current.shuffle && tracks.length > 1) {
      do nextIndex = Math.floor(Math.random() * tracks.length); while (nextIndex === currentIndex);
    }
    selectTrack(tracks[nextIndex].id, true);
  }, [selectTrack]);

  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !tracks.length) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const currentIndex = Math.max(0, tracks.findIndex((track) => track.id === snapshotRef.current.trackId));
    selectTrack(tracks[(currentIndex - 1 + tracks.length) % tracks.length].id, true);
  }, [selectTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) selectTrack(snapshotRef.current.trackId || tracks[0]?.id, true);
    else audio.pause();
  }, [selectTrack]);

  useEffect(() => {
    let rawState: string | null = null;
    try {
      rawState = window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    const stored = parsePlayerState(rawState, validTrackIds);
    if (stored) {
      setTrackId(stored.trackId);
      setVolumeState(stored.volume);
      setShuffle(stored.shuffle);
      setRepeat(stored.repeat);
      pendingSeekRef.current = stored.currentTime;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const track = getTrackById(trackId);
    if (!audio || !track) return;
    const source = new URL(publicPath(track.audioFile), window.location.origin).href;
    if (audio.src !== source) {
      audio.src = source;
      audio.load();
    }
  }, [trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (volume > 0) previousVolumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      if (pendingSeekRef.current !== null && audio.readyState >= 2 && audio.seekable.length > 0) {
        audio.currentTime = Math.min(pendingSeekRef.current, audio.duration || pendingSeekRef.current);
        pendingSeekRef.current = null;
      }
    };
    const onEnded = () => {
      if (snapshotRef.current.repeat === 'one') {
        audio.currentTime = 0;
        void audio.play();
      } else if (snapshotRef.current.repeat === 'all' || tracks.findIndex((track) => track.id === snapshotRef.current.trackId) < tracks.length - 1) {
        playNext();
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('durationchange', onMetadata);
    audio.addEventListener('canplay', onMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMetadata);
      audio.removeEventListener('durationchange', onMetadata);
      audio.removeEventListener('canplay', onMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [playNext]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        trackId,
        currentTime,
        volume,
        shuffle,
        repeat,
      }));
    } catch {
      // Keep playback functional when storage is denied.
    }
  }, [ready, trackId, currentTime, volume, shuffle, repeat]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, button, a, [role], [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.ctrlKey && event.code === 'ArrowLeft') {
        event.preventDefault();
        playPrevious();
      } else if (event.ctrlKey && event.code === 'ArrowRight') {
        event.preventDefault();
        playNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playNext, playPrevious, togglePlay]);

  const value = useMemo<PlayerContextValue>(() => ({
    ready,
    currentTrack: getTrackById(trackId) ?? null,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    selectTrack,
    togglePlay,
    playNext,
    playPrevious,
    seek(time) {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(time)) return;
      const nextTime = Math.max(0, Math.min(time, audio.duration || time));
      if (audio.readyState >= 2 && audio.seekable.length > 0) audio.currentTime = nextTime;
      else pendingSeekRef.current = nextTime;
    },
    setVolume(nextVolume) { setVolumeState(Math.max(0, Math.min(1, nextVolume))); },
    toggleMute() { setVolumeState((current) => current > 0 ? 0 : previousVolumeRef.current || 1); },
    toggleShuffle() { setShuffle((current) => !current); },
    toggleRepeat() { setRepeat((current) => current === 'off' ? 'all' : current === 'all' ? 'one' : 'off'); },
  }), [currentTime, duration, isPlaying, playNext, playPrevious, ready, repeat, selectTrack, shuffle, togglePlay, trackId, volume]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" data-global-audio />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

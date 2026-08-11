'use client';

import Link from 'next/link';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import { getAlbumById, publicPath, trackPath } from '../lib/catalog';
import { useLanguage } from './LanguageProvider';
import { PlatformIcon } from './PlatformIcon';
import { usePlayer } from './PlayerProvider';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export function GlobalPlayer() {
  const player = usePlayer();
  const { t } = useLanguage();
  const track = player.currentTrack;
  const album = track ? getAlbumById(track.albumId) : undefined;
  const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
  const backgroundStyle = track ? ({ '--cover-image': `url("${publicPath(track.cover)}")` } as CSSProperties) : undefined;

  const seek = (event: MouseEvent<HTMLDivElement>) => {
    if (!player.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    player.seek(((event.clientX - rect.left) / rect.width) * player.duration);
  };

  const seekWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const destinations: Partial<Record<string, number>> = {
      ArrowLeft: player.currentTime - 5,
      ArrowDown: player.currentTime - 5,
      ArrowRight: player.currentTime + 5,
      ArrowUp: player.currentTime + 5,
      Home: 0,
      End: player.duration,
    };
    const destination = destinations[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    player.seek(destination);
  };

  return (
    <div className="player" id="audioPlayer">
      <div className={`player-background${track ? ' loaded' : ''}`} style={backgroundStyle} />
      <div className="player-container">
        <div className="player-info">
          <img src={track ? publicPath(track.cover) : '/assets/placeholder.svg'} alt="Track cover" className="player-cover" />
          <div className="player-details">
            {track ? (
              <Link href={trackPath(track)} className="player-title clickable">{track.title}</Link>
            ) : <div className="player-title">{t('player.select')}</div>}
            <div className="player-artist">D10G3N{album ? ` • ${album.title}` : ''}</div>
          </div>
        </div>
        <div className="player-controls">
          <button className="control-btn" type="button" aria-label={t('aria.prev')} onClick={player.playPrevious}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
          </button>
          <button className="control-btn control-btn-play" type="button" aria-label={t('aria.play')} onClick={player.togglePlay}>
            {player.isPlaying
              ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zm8 0h4v16h-4z" /></svg>
              : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
          </button>
          <button className="control-btn" type="button" aria-label={t('aria.next')} onClick={player.playNext}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 18h2V6h-2zM5 17l8.5-6L5 5z" /></svg>
          </button>
        </div>
        <div className="player-track-actions" aria-label={t('aria.trackActions')}>
          {track?.links?.map((link) => (
            <a className="track-action-btn" href={link.url} target="_blank" rel="noopener noreferrer" title={link.platform} key={`${link.platform}-${link.url}`}>
              <PlatformIcon platform={link.platform} />
            </a>
          ))}
          {track && (
            <Link href={trackPath(track)} className="track-action-btn info-btn" title="Details" aria-label="Track details">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" /></svg>
            </Link>
          )}
        </div>
        <div className="player-progress">
          <span className="player-time">{formatTime(player.currentTime)}</span>
          <div className="progress-bar" role="slider" tabIndex={0} aria-label="Playback position" aria-valuemin={0} aria-valuemax={Math.round(player.duration)} aria-valuenow={Math.round(player.currentTime)} onClick={seek} onKeyDown={seekWithKeyboard}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-handle" style={{ left: `${progress}%` }} />
          </div>
          <span className="player-time">{formatTime(player.duration)}</span>
        </div>
        <div className="player-extra">
          <button className={`control-btn control-btn-small${player.shuffle ? ' active' : ''}`} type="button" aria-label={t('aria.shuffle')} aria-pressed={player.shuffle} onClick={player.toggleShuffle}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="m10.59 9.17-5.18-5.17L4 5.41l5.17 5.17 1.42-1.41ZM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5Zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13Z" /></svg>
          </button>
          <button className={`control-btn control-btn-small${player.repeat !== 'off' ? ' active' : ''}`} type="button" aria-label={`${t('aria.repeat')}: ${player.repeat}`} onClick={player.toggleRepeat}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4Z" /></svg>
            {player.repeat === 'one' && <span className="repeat-one">1</span>}
          </button>
          <button className="control-btn control-btn-small" type="button" aria-label={t('aria.volume')} onClick={player.toggleMute}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02Z" /></svg>
          </button>
          <input className="volume-slider" type="range" min="0" max="100" value={Math.round(player.volume * 100)} aria-label={t('aria.volume')} onChange={(event) => player.setVolume(Number(event.target.value) / 100)} />
        </div>
      </div>
    </div>
  );
}

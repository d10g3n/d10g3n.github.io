'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { publicPath, trackPath } from '../lib/catalog';
import type { Album, Track } from '../lib/types';
import { useLanguage } from './LanguageProvider';
import { PlatformIcon } from './PlatformIcon';
import { usePlayer } from './PlayerProvider';
import { SiteFooter } from './SiteFooter';

export function TrackPage({ track, album, requestedSlug }: { track: Track; album: Album; requestedSlug: string }) {
  const { t } = useLanguage();
  const player = usePlayer();
  const router = useRouter();
  const canonicalPath = trackPath(track);
  const isCurrent = player.currentTrack?.id === track.id;

  useEffect(() => {
    if (!canonicalPath.includes(`/track/${requestedSlug}/`)) router.replace(canonicalPath);
  }, [canonicalPath, requestedSlug, router]);

  return (
    <>
      <main className="track-page-container">
        <div className="track-page-content">
          <Link href="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            <span>{t('track.backToHome')}</span>
          </Link>
          <div className="track-header-static">
            <img src={publicPath(track.cover)} alt={`${track.title} cover`} className="track-cover-large" />
            <div className="track-details-static">
              <h1>{track.title}</h1>
              <p className="artist">D10G3N</p>
              <p className="album-info">{t('track.album')}: {album.title} • {track.year}</p>
              {track.isrc && <p className="album-info">ISRC: {track.isrc}</p>}
              <div className="track-links-static">
                <h3>{t('track.listenOn')}</h3>
                <button className="modal-link play-pause-link" type="button" onClick={() => isCurrent && player.isPlaying ? player.togglePlay() : player.selectTrack(track.id, true)}>
                  {isCurrent && player.isPlaying
                    ? <><span className="modal-playing-animation" aria-hidden="true"><span className="bar" /><span className="bar" /><span className="bar" /><span className="bar" /></span><span>{t('modal.nowPlaying')}</span></>
                    : <><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg><span>{t('modal.playNow')}</span></>}
                </button>
                {track.links?.map((link) => (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="modal-link" key={`${link.platform}-${link.url}`}>
                    <PlatformIcon platform={link.platform} /><span>{link.platform[0].toUpperCase() + link.platform.slice(1)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          {track.lyrics && (
            <section className="track-lyrics-static">
              <h2>{t('track.lyrics')}</h2>
              <div>{track.lyrics}</div>
            </section>
          )}
          {track.youtubeId && (
            <section className="track-video-static">
              <h3>{t('track.watchOnYouTube')}</h3>
              <div className="video-container">
                <iframe src={`https://www.youtube.com/embed/${track.youtubeId}`} title={`${track.title} on YouTube`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  albums,
  artistLinks,
  getAlbumById,
  getTracksByAlbum,
  publicPath,
  trackPath,
  tracks,
} from '../lib/catalog';
import { pluralizeTracks } from '../lib/i18n';
import { PlatformIcon } from './PlatformIcon';
import { SiteFooter } from './SiteFooter';
import { useLanguage } from './LanguageProvider';
import { usePlayer } from './PlayerProvider';

export function HomePage() {
  const [albumFilter, setAlbumFilter] = useState('all');
  const { language, t } = useLanguage();
  const player = usePlayer();
  const visibleTracks = albumFilter === 'all' ? tracks : getTracksByAlbum(albumFilter);

  const chooseAlbum = (albumId: string) => {
    setAlbumFilter(albumId);
    document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <main className="main">
        <section id="home" className="hero">
          <div className="container">
            <div className="hero-content">
              <div className="hero-icon"><img src="/assets/placeholder.svg" alt="D10G3N Logo" className="hero-logo" /></div>
              <h1 className="hero-title">{t('hero.title')}</h1>
              <p className="hero-subtitle">{t('hero.subtitle')}</p>
              <div className="hero-buttons">
                <button className="btn btn-primary" type="button" onClick={() => document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth' })}>{t('hero.button.listen')}</button>
                <a href="https://play.google.com/store/apps/details?id=com.d10g3n.live.music" target="_blank" rel="noopener noreferrer" className="google-play-badge">
                  <img src="/assets/ui/GetItOnGooglePlay_Badge_Web_color_English.svg" alt="Get it on Google Play" />
                </a>
                <a href="https://apps.apple.com/app/id6758684399" target="_blank" rel="noopener noreferrer" className="app-store-badge">
                  <img src="/assets/ui/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg" alt="Download on the App Store" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="albums" className="albums-section section">
          <div className="container">
            <h2 className="section-title">{t('section.albums')}</h2>
            <div className="albums-grid">
              {albums.map((album) => {
                const albumTracks = getTracksByAlbum(album.id);
                return (
                  <button className="album-card" type="button" onClick={() => chooseAlbum(album.id)} key={album.id}>
                    <img src={publicPath(album.cover)} alt={album.title} className="album-cover" />
                    <span className="album-info">
                      <span className="album-title">{album.title}</span>
                      <span className="album-meta">
                        <span>{album.year}</span>
                        <span>{albumTracks.length} {pluralizeTracks(language, albumTracks.length)}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="tracks" className="tracks-section section">
          <div className="container">
            <h2 className="section-title">{t('section.tracks')}</h2>
            <div className="filter-buttons">
              <button className={`filter-btn${albumFilter === 'all' ? ' active' : ''}`} type="button" onClick={() => setAlbumFilter('all')}>{t('filter.all')}</button>
              {albums.map((album) => (
                <button className={`filter-btn${albumFilter === album.id ? ' active' : ''}`} type="button" onClick={() => setAlbumFilter(album.id)} key={album.id}>{album.title}</button>
              ))}
            </div>
            <div className="tracks-list">
              {visibleTracks.map((track) => {
                const album = getAlbumById(track.albumId);
                const selected = player.currentTrack?.id === track.id;
                return (
                  <article className={`track-item${selected ? ' playing' : ''}${selected && player.isPlaying ? ' is-playing' : ''}`} data-track-id={track.id} key={track.id}>
                    <div className="track-cover-wrapper">
                      <img src={publicPath(track.cover)} alt={track.title} className="track-cover" />
                      <button className="track-play-overlay" type="button" aria-label={`Play ${track.title}`} onClick={() => player.selectTrack(track.id, true)}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </button>
                      <div className="playing-animation" aria-hidden="true"><div className="bar" /><div className="bar" /><div className="bar" /><div className="bar" /></div>
                    </div>
                    <div className="track-info">
                      <Link href={trackPath(track)} className="track-title hoverable">{track.title}</Link>
                      <div className="track-meta">{album?.title ?? ''} • {track.year}</div>
                    </div>
                    <div className="track-actions">
                      <Link href={trackPath(track)} className="track-btn" aria-label={`Details for ${track.title}`} title="View track details">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" /></svg>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="about-section section">
          <div className="container">
            <h2 className="section-title">{t('section.about')}</h2>
            <div className="about-content">
              <p>{t('about.text1')}</p><p>{t('about.text2')}</p><p>{t('about.text3')}</p><p>{t('about.text4')}</p><p>{t('about.text5')}</p>
            </div>
            <div className="about-links">
              <h3>{t('about.findUs')}</h3>
              <div className="modal-links" aria-label="Artist links">
                {artistLinks.map((link) => (
                  <a className="modal-link" href={link.url} target="_blank" rel="noopener noreferrer" key={`${link.platform}-${link.url}`}>
                    <PlatformIcon platform={link.platform} /><span>{link.platform[0].toUpperCase() + link.platform.slice(1)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter padded />
    </>
  );
}

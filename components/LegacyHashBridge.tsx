'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getTrackById, trackPath } from '../lib/catalog';
import { usePlayer } from './PlayerProvider';

export function LegacyHashBridge() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, selectTrack } = usePlayer();

  useEffect(() => {
    if (!ready || pathname !== '/') return;
    const resolveHash = () => {
      const match = window.location.hash.match(/^#track-(.+)$/);
      if (!match) return;
      let trackId: string;
      try {
        trackId = decodeURIComponent(match[1]);
      } catch {
        history.replaceState(null, '', '/');
        return;
      }
      const track = getTrackById(trackId);
      if (!track) {
        history.replaceState(null, '', '/');
        return;
      }
      selectTrack(track.id, false);
      router.replace(trackPath(track));
    };
    resolveHash();
    window.addEventListener('hashchange', resolveHash);
    return () => window.removeEventListener('hashchange', resolveHash);
  }, [pathname, ready, router, selectTrack]);

  return null;
}

export const TRACK_SLUGS = {
  track21: 'type-it-ship-it',
  track20: 'dimon-dimon',
  track18: 'sdai',
  track19: 'morozoff-club-kings-d10g3n-remix',
  track17: 'uniform-without-a-face-english-version',
  track16: 'forma-bez-oblichchya-ukrayinska-versiya',
  track15: 'forma-bez-litsa',
  track14: 'sboy-v-matritse',
  track13: 'ban',
  track12: 'npcexe',
  track11: 'house-of-pain',
  track6: 'suschestvo',
  track5: '404-vhod-v-it-not-found',
  track4: 'gimn-ayti-shnika',
  track3: 'ne-sdelal-bekap-dannye-v-util',
  track1: 'you-okey-dronchik-andrey',
  track10: 'no-one-can-stop-smd-pro-cover',
  track9: 'runaway-groove-coverage-cover',
  track8: 'never-meet-again-smd-pro-cover',
  track7: 'beyond-the-sunset-horizon',
  track2: '16-enter-1-leaves',
} as const;

export const TRACK_ALIASES = {
  'club-kings': 'track19',
  'club-kings-bootleg-remix': 'track19',
} as const;

export type PublishedTrackId = keyof typeof TRACK_SLUGS;

export function slugForTrack(trackId: string): string | undefined {
  return TRACK_SLUGS[trackId as PublishedTrackId];
}

export function trackIdForSlug(slug: string): string | undefined {
  const canonical = Object.entries(TRACK_SLUGS).find(([, value]) => value === slug)?.[0];
  return canonical ?? TRACK_ALIASES[slug as keyof typeof TRACK_ALIASES];
}

export function canonicalSlugFor(slug: string): string | undefined {
  const trackId = trackIdForSlug(slug);
  return trackId ? slugForTrack(trackId) : undefined;
}

export const CANONICAL_TRACK_SLUGS = Object.values(TRACK_SLUGS);
export const ALL_STATIC_TRACK_SLUGS = [
  ...CANONICAL_TRACK_SLUGS,
  ...Object.keys(TRACK_ALIASES),
];

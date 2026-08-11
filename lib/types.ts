export type Availability = {
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  radio?: boolean;
};

export type PlatformLink = {
  platform: string;
  url: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  cover: string;
  tracks: string[];
  upc?: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  year: number;
  language?: string;
  albumId: string;
  cover: string;
  audioFile: string;
  lyrics: string;
  youtubeId?: string;
  isrc?: string;
  links?: PlatformLink[];
  availability?: Availability;
};

export type Catalog = {
  albums: Album[];
  tracks: Track[];
  artistLinks: PlatformLink[];
};

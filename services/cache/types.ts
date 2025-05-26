// types.ts

export interface MangaLastRead {
  chapterId: string;
  page: number;
}

export interface ReaderMode {
  label: string; // Required string
  value: {
    inverted: boolean;
    horizontal: boolean;
  };
  desc: string; // Required string
}

export interface MangaOptions {
  readingMode?: ReaderMode;
  // Add more options here in the future
}

export interface MangaCache {
  lastRead?: MangaLastRead;
  readChapters?: string[];
  options?: MangaOptions;
}

// types.ts

export interface MangaLastRead {
  chapterId: string;
  chapterUrl: string;
  page: number;
}

export interface ReaderMode {
  label: string; 
  value: {
    inverted: boolean;
    horizontal: boolean;
  };
  desc: string; 
}

export interface MangaOptions {
  readingMode?: ReaderMode;
}

export interface MangaCache {
  lastRead?: MangaLastRead;
  readChapters?: string[];
  options?: MangaOptions;
}

// types.ts

export interface MangaLastRead {
    chapterId: string;
    page: number;
  }
  
  export interface MangaReadingOptions {
    horizontal: boolean;
    inverted: boolean;
  }
  
  export interface MangaCache {
    lastRead?: MangaLastRead;
    readChapters?: string[];
    options?: MangaReadingOptions;
  }
  
export interface Manga {
  mangaId: string;
  mangaTitle: string;
  mangaUrl: string;
  mangaCover: string;
}


export interface MangaChapterPage {
  pageId: string;
  pageUrl: string;
  pageImageUrl: string;
  pageHeight: number;
  pageWidth: number;
}

export interface LatestMangaListResponse {
  source: string;
  latest_manga: Manga[];
}

export interface PopularMangaListResponse {
  source: string;
  popular_manga: Manga[];
}

export interface MangaDetails {
  mangaDescription: string;
  mangaAuthor: string;
  mangaStatus: string;
  mangaTags: string[];
  mangaAlternativeNames: string[];
}

export interface MangaChapter {
  chapterId: string;
  chapterTitle: string;
  chapterUrl: string;
  chapterTimeUploaded: string;
  isRead?: boolean;
}

export interface ChapterNavigation {
  prev?: MangaChapter;
  next?: MangaChapter;
}

export interface ChapterNavigationMap {
  [chapterId: string]: ChapterNavigation;
}

export interface MangaInfoResponse {
  mangaChapters: MangaChapter[];
  mangaDetails: MangaDetails;
  chaptersNavigationMap: ChapterNavigationMap;
}


export interface MangaSearchResponse {
  source: string;
  results: Manga[];
}

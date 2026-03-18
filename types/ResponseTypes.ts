export interface MangaBase {
  mangaId: string;
  mangaTitle: string;
  mangaUrl: string;
  mangaCover: string;
}

export interface MangaRender extends MangaBase {
  mangaSourceId: string;
}

export interface MangaResponse extends MangaBase {
  mangaSource: Source;
}

export interface MangaChapterPage {
  pageId: string;
  pageUrl: string;
  pageImageUrl: string;
  pageHeight: number;
  pageWidth: number;
  pageIndex?: number;
  pageBlurhash?: string;
}

export interface LatestMangaListResponse {
  source: string;
  latest_manga: MangaResponse[];
}

export interface PopularMangaListResponse {
  source: string;
  popular_manga: MangaResponse[];
}

export interface MangaDetails {
  mangaDescription: string;
  mangaAuthor: string;
  mangaStatus: string;
  mangaTags: string[];
  mangaAlternativeNames: string[];
}

export interface MangaChapter extends MangaChapterResponse {
  isRead?: boolean;
  isSelected?: boolean;
}

interface MangaChapterResponse {
  chapterId: string;
  chapterTitle: string;
  chapterUrl: string;
  chapterTimeUploaded: string;
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
  results: MangaResponse[];
}

export enum SourceStatus {
  READY_TO_USE = "ready to use",
  IN_DEVELOPMENT = "in development",
  DEPRECATED = "deprecated",
}

export interface Source {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceStatus: SourceStatus;
  sourceIcon?: string | null;
}

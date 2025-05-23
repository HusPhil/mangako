export interface Manga {
    mangaId: string;
    mangaTitle: string;
    mangaUrl: string;
    mangaCover: string;
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
}

export interface MangaInfoResponse {
  mangaDetails: MangaDetails;
  mangaChapters: MangaChapter[];
}


export interface MangaSearchResponse {
    source: string;
    results: Manga[];
}
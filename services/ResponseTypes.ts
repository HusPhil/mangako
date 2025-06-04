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
	pageIndex?: number;
	pageBlurhash?: string;
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
	results: Manga[];
}

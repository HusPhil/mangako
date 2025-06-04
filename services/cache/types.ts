// types.ts

export interface MangaLastRead {
	chapterId: string;
	chapterTitle: string;
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

export interface MangaLastReadProgress {
	lastRead: MangaLastRead;
	progress: {
		[chapterId: string]: {
			lastPage: number;
			lastPageUrl: string;
		};
	};
}

export interface MangaCache {
	lastRead?: MangaLastRead;
	readingProgress?: MangaLastReadProgress;
	readChapters?: string[];
	options?: MangaOptions;
}

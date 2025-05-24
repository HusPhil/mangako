import { MangaChapter } from '../ResponseTypes';

export const mergeReadStatus = (
  chapters: MangaChapter[],
  readChapters: string[]
): MangaChapter[] => {
  const readSet = new Set(readChapters);
  return chapters.map(ch => ({
    ...ch,
    isRead: readSet.has(ch.chapterId),
  }));
};

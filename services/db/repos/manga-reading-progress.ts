import { SQLiteDatabase } from "expo-sqlite";
import { ChapterMetadata, ReadingProgress } from "../types";

/**
 * 1. Mark multiple chapters as read or unread.
 * Parent existence is now guaranteed by the MangaCard/Ghost logic.
 */
export const setChaptersReadStatus = (
  db: SQLiteDatabase,
  mangaId: string,
  chapters: ChapterMetadata[],
  isRead: boolean,
) => {
  db.withTransactionSync(() => {
    if (isRead) {
      const statement = db.prepareSync(
        `INSERT OR IGNORE INTO chapter_read (manga_id, chapter_id, chapter_title, chapter_url) VALUES (?, ?, ?, ?)`,
      );
      try {
        chapters.forEach((ch) =>
          statement.executeSync([mangaId, ch.id, ch.title, ch.url]),
        );
      } finally {
        statement.finalizeSync();
      }
    } else {
      const statement = db.prepareSync(
        `DELETE FROM chapter_read WHERE manga_id = ? AND chapter_id = ?`,
      );
      try {
        chapters.forEach((ch) => statement.executeSync([mangaId, ch.id]));
      } finally {
        statement.finalizeSync();
      }
    }
  });
};

/**
 * 2. Save page where left off (Upsert into reading_progress).
 * Updates both the current progress position and the history mapping.
 */
export const saveReadingProgress = (
  db: SQLiteDatabase,
  mangaId: string,
  chapter: ChapterMetadata,
  page: number,
) => {
  db.withTransactionSync(() => {
    // Update main progress entry
    db.runSync(
      `INSERT OR REPLACE INTO reading_progress 
       (manga_id, last_read_chapter_id, last_read_chapter_title, last_read_chapter_url, last_read_page, last_read_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mangaId, chapter.id, chapter.title, chapter.url, page, Date.now()],
    );

    // Also ensure this chapter is marked as read in the junction table
    db.runSync(
      `INSERT OR IGNORE INTO chapter_read (manga_id, chapter_id, chapter_title, chapter_url) VALUES (?, ?, ?, ?)`,
      [mangaId, chapter.id, chapter.title, chapter.url],
    );
  });
};

/**
 * 3. Get the most recently read manga details.
 * Used for the "Continue Reading" shelf on the home screen.
 */
export const getLastReadManga = (db: SQLiteDatabase) => {
  return db.getFirstSync<
    ReadingProgress & { title: string; cover_url: string }
  >(
    `SELECT rp.*, lm.title, lm.cover_url 
     FROM reading_progress rp
     JOIN library_manga lm ON rp.manga_id = lm.manga_id
     ORDER BY rp.last_read_at DESC 
     LIMIT 1`,
  );
};

export const getReadChapterIds = (
  db: SQLiteDatabase,
  mangaId: string,
): string[] => {
  const rows = db.getAllSync<{ chapter_id: string }>(
    `SELECT chapter_id FROM chapter_read WHERE manga_id = ?`,
    [mangaId],
  );
  return rows.map((r) => r.chapter_id);
};

export const getReadingProgressByMangaId = (
  db: SQLiteDatabase,
  mangaId: string,
): ReadingProgress | null => {
  return db.getFirstSync<ReadingProgress>(
    `SELECT * FROM reading_progress WHERE manga_id = ?`,
    [mangaId],
  );
};

export const getChapterLastReadPage = (
  db: SQLiteDatabase,
  mangaId: string,
  chapterId: string,
): number | null => {
  const result = db.getFirstSync<{ last_read_page: number }>(
    `SELECT last_read_page 
     FROM reading_progress 
     WHERE manga_id = ? AND last_read_chapter_id = ?`,
    [mangaId, chapterId],
  );

  return result ? result.last_read_page : null;
};

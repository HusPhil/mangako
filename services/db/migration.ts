import { SQLiteDatabase } from "expo-sqlite";

type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => void;
  down: (db: SQLiteDatabase) => void;
};

type MetaRow = { value: string };

const getVersion = (db: SQLiteDatabase): number => {
  // Ensure the meta table exists first
  db.execSync(
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);`,
  );

  const row: MetaRow | null = db.getFirstSync(
    `SELECT value FROM meta WHERE key = 'db_version'`,
  );
  return row ? Number(row.value) : 0;
};

const setVersion = (db: SQLiteDatabase, version: number) => {
  db.runSync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('db_version', ?)`,
    [version.toString()],
  );
};

const migrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      console.log("Migration v1: Initial setup applied");
    },
    down: (db) => {
      console.log("Migration v1: Rollback (No-op)");
    },
  },
  {
    version: 2,
    up: (db) => {
      db.execSync(
        `ALTER TABLE library_manga ADD COLUMN is_favorite INTEGER DEFAULT 0;`,
      );
      console.log("Migration v2: Added is_favorite column");
    },
    down: (db) => {
      db.execSync(`ALTER TABLE library_manga DROP COLUMN is_favorite;`);
      console.log("Migration v2: Removed is_favorite column");
    },
  },
  {
    version: 3,
    up: (db) => {
      const tableInfo = db.getAllSync<{ name: string }>(
        `PRAGMA table_info(library_manga);`,
      );
      const columnExists = tableInfo.some((col) => col.name === "manga_url");

      if (!columnExists) {
        db.execSync(`ALTER TABLE library_manga ADD COLUMN manga_url TEXT;`);
        console.log("Migration v3: Added manga_url column successfully.");
      }
    },
    down: (db) => {
      console.warn(
        "Migration v3: Rollback requested. Note: Column 'manga_url' was not removed to prevent data loss.",
      );
    },
  },
  {
    version: 4,
    up: (db) => {
      console.log(
        "Migration v4: Removing manga_url to prepare for backfill reset",
      );
      try {
        // This resets the column so v5 can apply it cleanly with data
        db.execSync(`ALTER TABLE library_manga DROP COLUMN manga_url;`);
      } catch (e) {
        console.warn(
          "DROP COLUMN failed (likely unsupported). Proceeding to v5 anyway.",
        );
      }
    },
    down: (db) => {},
  },
  {
    version: 5,
    up: (db) => {
      console.log("Migration v5: Re-adding manga_url with backfill logic");

      try {
        db.execSync(`ALTER TABLE library_manga ADD COLUMN manga_url TEXT;`);
      } catch (e) {
        console.log("Column already exists, skipping ADD COLUMN");
      }
      db.execSync(`
        UPDATE library_manga 
        SET manga_url = 'NONE' 
        WHERE manga_url IS NULL OR manga_url = '';
      `);

      console.log("Migration v5: Backfill complete.");
    },
    down: (db) => {
      // Logic to revert if necessary
    },
  },
  {
    version: 6,
    up: (db) => {
      console.log("Migration v6: Adding sort_order to categories");
      try {
        // 1. Add the column
        db.execSync(
          `ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;`,
        );

        // 2. (Optional) Initialize sort_order based on existing alphabetical order
        // This prevents all existing categories from having the same index (0)
        const categories = db.getAllSync<{ category_id: string }>(
          `SELECT category_id FROM categories ORDER BY name ASC`,
        );

        categories.forEach((cat, index) => {
          db.execSync(
            `UPDATE categories SET sort_order = ${index} WHERE category_id = '${cat.category_id}';`,
          );
        });

        console.log("Migration v6: sort_order added and initialized.");
      } catch (e) {
        console.warn("Migration v6 failed or column already exists:");
      }
    },
    down: (db) => {
      // Note: SQLite does not support DROP COLUMN in many environments.
      // Usually, we leave the column to avoid complex table recreation.
      console.warn(
        "Migration v6: Rollback not supported for ALTER TABLE ADD COLUMN.",
      );
    },
  },

  {
    version: 7,
    up: (db) => {
      console.log("Migration v7: Adding Chapter Title and URL metadata");

      // 1. Remove the withTransactionSync wrapper for ALTER TABLE
      try {
        // Check if columns exist first to prevent double-add errors
        const tableInfo = db.getAllSync<{ name: string }>(
          `PRAGMA table_info(reading_progress);`,
        );
        const hasTitle = tableInfo.some(
          (col) => col.name === "last_read_chapter_title",
        );

        if (!hasTitle) {
          // Run these as individual commands
          db.execSync(
            `ALTER TABLE reading_progress ADD COLUMN last_read_chapter_title TEXT;`,
          );
          db.execSync(
            `ALTER TABLE reading_progress ADD COLUMN last_read_chapter_url TEXT;`,
          );

          db.execSync(
            `ALTER TABLE chapter_read ADD COLUMN chapter_title TEXT;`,
          );
          db.execSync(`ALTER TABLE chapter_read ADD COLUMN chapter_url TEXT;`);

          console.log("Migration v7: Metadata columns added successfully.");
        }
      } catch (e) {
        console.error("Migration v7 Error:", e);
        // We don't throw here so the setVersion can still mark progress if partially successful
      }
    },
    down: (db) => {
      console.warn("Migration v7: Rollback not supported.");
    },
  },
  {
    version: 8,
    up: (db) => {
      // 1. Add the column to distinguish between "Library" and "Just Tracking"
      db.execSync(
        `ALTER TABLE library_manga ADD COLUMN is_in_library INTEGER DEFAULT 1;`,
      );

      // 2. Existing manga are obviously in the library
      db.execSync(`UPDATE library_manga SET is_in_library = 1;`);
    },
    down: (db) => {
      console.warn("No rollback");
    },
  },
];

export const migrateTo = (db: SQLiteDatabase, targetVersion: number) => {
  const currentVersion = getVersion(db);

  if (targetVersion === currentVersion) return;

  db.withTransactionSync(() => {
    if (targetVersion > currentVersion) {
      const toApply = migrations
        .filter((m) => m.version > currentVersion && m.version <= targetVersion)
        .sort((a, b) => a.version - b.version);

      for (const m of toApply) {
        m.up(db);
        setVersion(db, m.version);
      }
    } else {
      const toUndo = migrations
        .filter((m) => m.version <= currentVersion && m.version > targetVersion)
        .sort((a, b) => b.version - a.version);

      for (const m of toUndo) {
        m.down(db);
        setVersion(db, m.version - 1);
      }
    }
  });

  console.log(`Database is now at version: ${getVersion(db)}`);
};

export const runMigrations = async (db: SQLiteDatabase) => {
  const latest = Math.max(...migrations.map((m) => m.version), 0);
  migrateTo(db, latest);
};

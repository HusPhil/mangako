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

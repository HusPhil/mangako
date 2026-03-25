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

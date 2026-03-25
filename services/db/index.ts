import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("app.db");

db.execSync(`PRAGMA foreign_keys = ON;`);

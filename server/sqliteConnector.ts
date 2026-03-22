import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { migrations } from "./migrations/index.js";

type RunResult = { lastID?: number };

type DbAdapter = {
  exec: (sql: string) => Promise<void>;
  run: (sql: string, ...params: SQLInputValue[]) => Promise<RunResult>;
  get: <T>(sql: string, ...params: SQLInputValue[]) => Promise<T | undefined>;
  all: <T>(sql: string, ...params: SQLInputValue[]) => Promise<T[]>;
  close: () => Promise<void>;
};

let db: DbAdapter | null = null;

async function runMigrations(connectedDb: DbAdapter) {
  await connectedDb.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const appliedRows = await connectedDb.all<{ id: string }>(
    "SELECT id FROM schema_migrations ORDER BY id;"
  );
  const applied = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    console.log(`Applying migration ${migration.id}`);
    await connectedDb.exec("BEGIN;");
    try {
      await migration.up(connectedDb);
      await connectedDb.run(
        "INSERT INTO schema_migrations (id) VALUES (?);",
        migration.id
      );
      await connectedDb.exec("COMMIT;");
    } catch (err) {
      await connectedDb.exec("ROLLBACK;");
      throw err;
    }
  }
}

export async function connectToDatabase(filename: string) {
  const database = new DatabaseSync(filename);

  const exec = (sql: string) => {
    database.exec(sql);
  };

  const run = (sql: string, ...params: SQLInputValue[]) => {
    const stmt = database.prepare(sql);
    const result = stmt.run(...params);
    const lastInsertRowid =
      (result as { lastInsertRowid?: number | bigint })?.lastInsertRowid ??
      (result as { last_insert_rowid?: number })?.last_insert_rowid;
    return {
      lastID:
        typeof lastInsertRowid === "bigint"
          ? Number(lastInsertRowid)
          : lastInsertRowid,
    };
  };

  const get = <T>(sql: string, ...params: SQLInputValue[]) => {
    const stmt = database.prepare(sql);
    return stmt.get(...params) as T | undefined;
  };

  const all = <T>(sql: string, ...params: SQLInputValue[]) => {
    const stmt = database.prepare(sql);
    return stmt.all(...params) as T[];
  };

  db = {
    exec: async (sql) => exec(sql),
    run: async (sql, ...params: SQLInputValue[]) => run(sql, ...params),
    get: async (sql, ...params: SQLInputValue[]) => get(sql, ...params),
    all: async (sql, ...params: SQLInputValue[]) => all(sql, ...params),
    close: async () => database.close(),
  };

  const connectedDb = db;

  await connectedDb.exec("PRAGMA foreign_keys = ON;");
  await runMigrations(connectedDb);

  console.log("Connected to SQLite:", filename);

  process.on("exit", async () => {
    await closeDatabase();
    console.log("SQLite connection closed due to process exit");
  });
  process.on("SIGINT", async () => {
    await closeDatabase();
    console.log("SQLite connection closed due to app termination");
    process.exit(0);
  });

  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not connected. Call connectToDatabase first.");
  return db;
}

export async function closeDatabase() {
  if (db) await db.close();
  db = null;
}

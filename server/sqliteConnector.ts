import { DatabaseSync, type SQLInputValue } from "node:sqlite";

type RunResult = { lastID?: number };

type DbAdapter = {
  exec: (sql: string) => Promise<void>;
  run: (sql: string, ...params: SQLInputValue[]) => Promise<RunResult>;
  get: <T>(sql: string, ...params: SQLInputValue[]) => Promise<T | undefined>;
  all: <T>(sql: string, ...params: SQLInputValue[]) => Promise<T[]>;
  close: () => Promise<void>;
};

let db: DbAdapter | null = null;

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
  await connectedDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_users (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_user_id INTEGER,
      req_analysis_hours INTEGER,
      design_hours INTEGER,
      coding_hours INTEGER,
      testing_hours INTEGER,
      proj_mgmt_hours INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS risks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      impact TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

  `);

  const columns = await connectedDb.all<{ name: string }>(
    "PRAGMA table_info(users);"
  );
  const hasPasswordHash = columns.some((col) => col.name === "password_hash");
  if (!hasPasswordHash) {
    await connectedDb.exec(
      "ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';"
    );
  }

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

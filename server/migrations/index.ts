export type Migration = {
  id: string;
  up: (db: {
    exec: (sql: string) => Promise<void>;
    run: (sql: string, ...params: never[]) => Promise<{ lastID?: number }>;
    all: <T>(sql: string, ...params: never[]) => Promise<T[]>;
  }) => Promise<void>;
};

const ensureColumn = async (
  db: { all: <T>(sql: string, ...params: never[]) => Promise<T[]> },
  table: string,
  column: string
) => {
  const columns = await db.all<{ name: string }>(
    `PRAGMA table_info(${table});`
  );
  return columns.some((col) => col.name === column);
};

export const migrations: Migration[] = [
  {
    id: "20260322_0001_initial",
    up: async (db) => {
      await db.exec(`
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
          manager_name TEXT,
          team_members_json TEXT NOT NULL DEFAULT '[]',
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
          req_analysis_hours INTEGER DEFAULT 0,
          design_hours INTEGER DEFAULT 0,
          coding_hours INTEGER DEFAULT 0,
          testing_hours INTEGER DEFAULT 0,
          proj_mgmt_hours INTEGER DEFAULT 0,
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
    },
  },
  {
    id: "20260322_0002_requirements_updates",
    up: async (db) => {
      const hasPasswordHash = await ensureColumn(db, "users", "password_hash");
      if (!hasPasswordHash) {
        await db.exec(
          "ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';"
        );
      }

      const hasManagerName = await ensureColumn(db, "projects", "manager_name");
      if (!hasManagerName) {
        await db.exec("ALTER TABLE projects ADD COLUMN manager_name TEXT;");
      }

      const hasTeamMembersJson = await ensureColumn(
        db,
        "projects",
        "team_members_json"
      );
      if (!hasTeamMembersJson) {
        await db.exec(
          "ALTER TABLE projects ADD COLUMN team_members_json TEXT NOT NULL DEFAULT '[]';"
        );
      }

      const hasAssignedUserId = await ensureColumn(
        db,
        "requirements",
        "assigned_user_id"
      );
      if (!hasAssignedUserId) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN assigned_user_id INTEGER;"
        );
      }

      const hasReqAnalysisHours = await ensureColumn(
        db,
        "requirements",
        "req_analysis_hours"
      );
      if (!hasReqAnalysisHours) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN req_analysis_hours INTEGER DEFAULT 0;"
        );
      }

      const hasDesignHours = await ensureColumn(
        db,
        "requirements",
        "design_hours"
      );
      if (!hasDesignHours) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN design_hours INTEGER DEFAULT 0;"
        );
      }

      const hasCodingHours = await ensureColumn(
        db,
        "requirements",
        "coding_hours"
      );
      if (!hasCodingHours) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN coding_hours INTEGER DEFAULT 0;"
        );
      }

      const hasTestingHours = await ensureColumn(
        db,
        "requirements",
        "testing_hours"
      );
      if (!hasTestingHours) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN testing_hours INTEGER DEFAULT 0;"
        );
      }

      const hasProjMgmtHours = await ensureColumn(
        db,
        "requirements",
        "proj_mgmt_hours"
      );
      if (!hasProjMgmtHours) {
        await db.exec(
          "ALTER TABLE requirements ADD COLUMN proj_mgmt_hours INTEGER DEFAULT 0;"
        );
      }
    },
  },
];

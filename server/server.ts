import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectToDatabase, getDb } from './sqliteConnector.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const SQLITE_DB = process.env.SQLITE_DB ?? 'trackit.db';

const parseTeamMembers = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((member) => String(member ?? '').trim())
    .filter(Boolean);
};

const parseStoredTeamMembers = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
          .map((member) => String(member ?? '').trim())
          .filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

const hydrateProject = <
  T extends {
    team_members_json?: string | null;
    [key: string]: unknown;
  },
>(
  project: T | undefined
) => {
  if (!project) {
    return project;
  }

  const { team_members_json, ...rest } = project;
  return {
    ...rest,
    team_members: parseStoredTeamMembers(team_members_json),
  };
};

type ProjectRow = {
  id: number;
  name: string;
  description: string | null;
  manager_name: string | null;
  team_members_json?: string | null;
  owner_user_id: number;
  created_at: string;
  current_user_role?: string | null;
  requirements_count?: number;
  risks_count?: number;
  team_count?: number;
};

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Backend server is running',
    port: PORT
  });
});

app.get('/api/hello', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM users;');
    const projects = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM projects;');
    res.json({ message: 'Hello from the server!', users: users?.count ?? 0, projects: projects?.count ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/users', async (req, res) => {
  const email = String(req.query.email ?? '').trim();
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const db = getDb();
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE email = ?;',
      email
    );
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  try {
    const db = getDb();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?);',
      name,
      email,
      passwordHash
    );
    const insertedId = result.lastID;
    if (!insertedId) {
      throw new Error('Failed to create user.');
    }
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?;',
      insertedId
    );
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const db = getDb();
    const user = await db.get<{
      id: number;
      name: string;
      email: string;
      password_hash: string;
      created_at: string;
    }>('SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?;', email);

    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };
    res.json({ user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects', async (req, res) => {
  const ownerUserId = Number(req.query.ownerUserId ?? 0);
  if (!ownerUserId) {
    return res.status(400).json({ error: 'ownerUserId is required' });
  }

  try {
    const db = getDb();
    const projects = await db.all(
      `SELECT p.id, p.name, p.description, p.owner_user_id, p.created_at
       FROM projects p
       INNER JOIN project_users pu ON pu.project_id = p.id
       WHERE pu.user_id = ?
       ORDER BY p.id DESC;`,
      ownerUserId
    );
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects-summary', async (req, res) => {
  const ownerUserId = Number(req.query.ownerUserId ?? 0);
  if (!ownerUserId) {
    return res.status(400).json({ error: 'ownerUserId is required' });
  }

  try {
    const db = getDb();
    const projects = await db.all<ProjectRow>(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.manager_name,
        p.team_members_json,
        p.owner_user_id,
        p.created_at,
        pu.role as current_user_role,
        (SELECT COUNT(*) FROM requirements r WHERE r.project_id = p.id) as requirements_count,
        (SELECT COUNT(*) FROM risks rk WHERE rk.project_id = p.id) as risks_count,
        (SELECT COUNT(*) FROM project_users pu2 WHERE pu2.project_id = p.id) as team_count
       FROM projects p
       INNER JOIN project_users pu ON pu.project_id = p.id
       WHERE pu.user_id = ?
       ORDER BY p.id DESC;`,
      ownerUserId
    );
    res.json({ projects: projects.map((project) => hydrateProject(project)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  if (!id) {
    return res.status(400).json({ error: 'valid project id is required' });
  }

  try {
    const db = getDb();
    const project = await db.get<ProjectRow>(
      'SELECT id, name, description, manager_name, team_members_json, owner_user_id, created_at FROM projects WHERE id = ?;',
      id
    );
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }
    res.json({ project: hydrateProject(project) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description, managerName, teamMembers, ownerUserId } = req.body ?? {};
  if (!name || !ownerUserId) {
    return res.status(400).json({ error: 'name and ownerUserId are required' });
  }

  try {
    const db = getDb();
    const normalizedTeamMembers = parseTeamMembers(teamMembers);
    const result = await db.run(
      'INSERT INTO projects (name, description, manager_name, team_members_json, owner_user_id) VALUES (?, ?, ?, ?, ?);',
      name,
      description ?? null,
      managerName ?? null,
      JSON.stringify(normalizedTeamMembers),
      ownerUserId
    );
    const projectId = result.lastID;
    if (!projectId) {
      throw new Error('Failed to create project.');
    }
    await db.run(
      'INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?);',
      projectId,
      ownerUserId,
      'Lead'
    );
    const project = await db.get<ProjectRow>(
      'SELECT id, name, description, manager_name, team_members_json, owner_user_id, created_at FROM projects WHERE id = ?;',
      projectId
    );
    res.status(201).json({ project: hydrateProject(project) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  const payload = req.body ?? {};
  const { name } = payload;
  if (!id || !name) {
    return res.status(400).json({ error: 'id and name are required' });
  }

  try {
    const db = getDb();
    const currentProject = await db.get<{
      description: string | null;
      manager_name: string | null;
      team_members_json: string | null;
    }>(
      'SELECT description, manager_name, team_members_json FROM projects WHERE id = ?;',
      id
    );
    if (!currentProject) {
      return res.status(404).json({ error: 'project not found' });
    }

    const hasDescription = Object.prototype.hasOwnProperty.call(
      payload,
      'description'
    );
    const hasManagerName = Object.prototype.hasOwnProperty.call(
      payload,
      'managerName'
    );
    const hasTeamMembers = Object.prototype.hasOwnProperty.call(
      payload,
      'teamMembers'
    );

    await db.run(
      'UPDATE projects SET name = ?, description = ?, manager_name = ?, team_members_json = ? WHERE id = ?;',
      name,
      hasDescription ? payload.description ?? null : currentProject.description,
      hasManagerName ? payload.managerName ?? null : currentProject.manager_name,
      hasTeamMembers
        ? JSON.stringify(parseTeamMembers(payload.teamMembers))
        : currentProject.team_members_json ?? '[]',
      id
    );
    const project = await db.get<ProjectRow>(
      'SELECT id, name, description, manager_name, team_members_json, owner_user_id, created_at FROM projects WHERE id = ?;',
      id
    );
    res.json({ project: hydrateProject(project) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  if (!id) {
    return res.status(400).json({ error: 'valid project id is required' });
  }

  try {
    const db = getDb();
    await db.run('DELETE FROM projects WHERE id = ?;', id);
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects/:projectId/users', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  if (!projectId) {
    return res.status(400).json({ error: 'valid project id is required' });
  }

  try {
    const db = getDb();
    const users = await db.all(
      `SELECT u.id, u.name, u.email, pu.role
       FROM project_users pu
       INNER JOIN users u ON u.id = pu.user_id
       WHERE pu.project_id = ?
       ORDER BY pu.created_at ASC;`,
      projectId
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/projects/:projectId/users', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  const { userId, role } = req.body ?? {};
  if (!projectId || !userId || !role) {
    return res.status(400).json({ error: 'projectId, userId, and role are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'INSERT INTO project_users (project_id, user_id, role) VALUES (?, ?, ?);',
      projectId,
      userId,
      role
    );
    const member = await db.get(
      `SELECT u.id, u.name, u.email, pu.role
       FROM project_users pu
       INNER JOIN users u ON u.id = pu.user_id
       WHERE pu.project_id = ? AND pu.user_id = ?;`,
      projectId,
      userId
    );
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/projects/:projectId/users/:userId', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  const userId = Number(req.params.userId ?? 0);
  const { role } = req.body ?? {};
  if (!projectId || !userId || !role) {
    return res.status(400).json({ error: 'projectId, userId, and role are required' });
  }

  try {
    const db = getDb();
    if (role === 'Lead') {
      await db.run(
        'UPDATE project_users SET role = ? WHERE project_id = ?;',
        'Member',
        projectId
      );
    }
    await db.run(
      'UPDATE project_users SET role = ? WHERE project_id = ? AND user_id = ?;',
      role,
      projectId,
      userId
    );
    const member = await db.get(
      `SELECT u.id, u.name, u.email, pu.role
       FROM project_users pu
       INNER JOIN users u ON u.id = pu.user_id
       WHERE pu.project_id = ? AND pu.user_id = ?;`,
      projectId,
      userId
    );
    res.json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/projects/:projectId/users/:userId', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  const userId = Number(req.params.userId ?? 0);
  if (!projectId || !userId) {
    return res.status(400).json({ error: 'projectId and userId are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'DELETE FROM project_users WHERE project_id = ? AND user_id = ?;',
      projectId,
      userId
    );
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects/:projectId/requirements', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  if (!projectId) {
    return res.status(400).json({ error: 'valid project id is required' });
  }

  try {
    const db = getDb();
    const requirements = await db.all(
      'SELECT id, project_id, title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours, created_at FROM requirements WHERE project_id = ? ORDER BY id DESC;',
      projectId
    );
    res.json({ requirements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/projects/:projectId/requirements', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  const { title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours } = req.body ?? {};
  if (!projectId || !title || !type || !status) {
    return res.status(400).json({ error: 'projectId, title, type, and status are required' });
  }

  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO requirements (project_id, title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      projectId,
      title,
      type,
      status,
      assigned_user_id ?? null,
      req_analysis_hours ?? 0,
      design_hours ?? 0,
      coding_hours ?? 0,
      testing_hours ?? 0,
      proj_mgmt_hours ?? 0
    );
    const requirementId = result.lastID;
    if (!requirementId) {
      throw new Error('Failed to create requirement.');
    }
    const requirement = await db.get(
      'SELECT id, project_id, title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours, created_at FROM requirements WHERE id = ?;',
      requirementId
    );
    res.status(201).json({ requirement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/requirements/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  const { title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours } = req.body ?? {};
  if (!id || !title || !type || !status) {
    return res.status(400).json({ error: 'id, title, type, and status are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'UPDATE requirements SET title = ?, type = ?, status = ?, assigned_user_id = ?, req_analysis_hours = ?, design_hours = ?, coding_hours = ?, testing_hours = ?, proj_mgmt_hours = ? WHERE id = ?;',
      title,
      type,
      status,
      assigned_user_id ?? null,
      req_analysis_hours ?? 0,
      design_hours ?? 0,
      coding_hours ?? 0,
      testing_hours ?? 0,
      proj_mgmt_hours ?? 0,
      id
    );
    const requirement = await db.get(
      'SELECT id, project_id, title, type, status, assigned_user_id, req_analysis_hours, design_hours, coding_hours, testing_hours, proj_mgmt_hours, created_at FROM requirements WHERE id = ?;',
      id
    );
    res.json({ requirement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/requirements/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  if (!id) {
    return res.status(400).json({ error: 'valid requirement id is required' });
  }

  try {
    const db = getDb();
    await db.run('DELETE FROM requirements WHERE id = ?;', id);
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/projects/:projectId/risks', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  if (!projectId) {
    return res.status(400).json({ error: 'valid project id is required' });
  }

  try {
    const db = getDb();
    const risks = await db.all(
      'SELECT id, project_id, title, impact, status, created_at FROM risks WHERE project_id = ? ORDER BY id DESC;',
      projectId
    );
    res.json({ risks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/projects/:projectId/risks', async (req, res) => {
  const projectId = Number(req.params.projectId ?? 0);
  const { title, impact, status } = req.body ?? {};
  if (!projectId || !title || !impact || !status) {
    return res.status(400).json({ error: 'projectId, title, impact, and status are required' });
  }

  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO risks (project_id, title, impact, status) VALUES (?, ?, ?, ?);',
      projectId,
      title,
      impact,
      status
    );
    const riskId = result.lastID;
    if (!riskId) {
      throw new Error('Failed to create risk.');
    }
    const risk = await db.get(
      'SELECT id, project_id, title, impact, status, created_at FROM risks WHERE id = ?;',
      riskId
    );
    res.status(201).json({ risk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/risks/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  const { title, impact, status } = req.body ?? {};
  if (!id || !title || !impact || !status) {
    return res.status(400).json({ error: 'id, title, impact, and status are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'UPDATE risks SET title = ?, impact = ?, status = ? WHERE id = ?;',
      title,
      impact,
      status,
      id
    );
    const risk = await db.get(
      'SELECT id, project_id, title, impact, status, created_at FROM risks WHERE id = ?;',
      id
    );
    res.json({ risk });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/risks/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  if (!id) {
    return res.status(400).json({ error: 'valid risk id is required' });
  }

  try {
    const db = getDb();
    await db.run('DELETE FROM risks WHERE id = ?;', id);
    res.json({ status: 'deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

connectToDatabase(SQLITE_DB)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to SQLite', err);
    process.exit(1);
  });

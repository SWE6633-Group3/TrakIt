import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { connectToDatabase, getDb } from './sqliteConnector.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const SQLITE_DB = process.env.SQLITE_DB ?? 'trackit.db';
const SEED_SECRET = process.env.SEED_SECRET;
const AUTO_SEED_IF_EMPTY = process.env.AUTO_SEED_IF_EMPTY === 'true';

const normalizeEmail = (email: unknown) => String(email ?? '').trim().toLowerCase();
const hashResetCode = (code: string) =>
  crypto.createHash('sha256').update(code).digest('hex');

const seedDatabaseIfEmpty = async () => {
  if (!AUTO_SEED_IF_EMPTY) {
    return;
  }

  const db = getDb();
  const users = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM users;'
  );
  const projects = await db.get<{ count: number }>(
    'SELECT COUNT(*) as count FROM projects;'
  );
  const userCount = users?.count ?? 0;
  const projectCount = projects?.count ?? 0;

  if (userCount > 0 || projectCount > 0) {
    console.log(
      `Auto seed skipped. Existing data found: ${userCount} users, ${projectCount} projects.`
    );
    return;
  }

  console.log('Auto seed enabled and database is empty. Seeding demo data...');
  await seedDatabase({ closeWhenDone: false, databasePath: SQLITE_DB });
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

app.post('/api/admin/seed', async (req, res) => {
  if (!SEED_SECRET) {
    return res.status(404).json({ error: 'Seed endpoint is disabled.' });
  }

  const providedSecret = String(
    req.header('x-seed-secret') ?? req.body?.seedSecret ?? ''
  );

  if (providedSecret !== SEED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    await seedDatabase({ closeWhenDone: false, databasePath: SQLITE_DB });
    return res.json({
      message: 'Seed complete.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Seed failed.' });
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

app.post('/api/verify-email', async (req, res) => {
    const { email } = req.body;
    console.log('Verifying email:', email);
    
    try {
        const db = getDb();
        const user = await db.get('SELECT id FROM users WHERE email = ?', email?.trim().toLowerCase());
        
        console.log('User found:', !!user);
        
        if (!user) {
            return res.status(200).json({ exists: false, error: "Account not found" });
        }
        return res.status(200).json({ exists: true });
    } catch (err) {
        console.error('Error in verify-email:', err);
        res.status(500).json({ error: "Server error" });
    }
});


app.get('/api/users/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (!q) {
    return res.json({ users: [] });
  }

  try {
    const db = getDb();
    const users = await db.all(
      'SELECT id, name, email FROM users WHERE LOWER(email) LIKE ? LIMIT 10;',
      `%${q}%`
    );

    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/password-reset/request', async (req, res) => {
  const email = normalizeEmail(req.body?.email);


  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const db = getDb();
    const user = await db.get<{ id: number }>(
      'SELECT id FROM users WHERE email = ?;',
      email
    );

    if (!user) {
      return res.status(404).json({ error: 'No account was found for that email.' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = hashResetCode(code);

    await db.run(
      'UPDATE password_reset_codes SET used_at = datetime(\'now\') WHERE user_id = ? AND used_at IS NULL;',
      user.id
    );

    await db.run(
      `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
       VALUES (?, ?, datetime('now', '+10 minutes'));`,
      user.id,
      codeHash
    );

    return res.json({
      message: 'Password reset code generated.',
      demoCode: code,
      expiresInMinutes: 10,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error while generating reset code' });
  }
});

app.post('/api/password-reset/confirm', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code ?? '').trim();
  const newPassword = String(req.body?.newPassword ?? '');

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'email, code, and newPassword are required' });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'Reset code must be 6 digits.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const db = getDb();
    const codeHash = hashResetCode(code);
    const resetCode = await db.get<{ id: number; user_id: number }>(
      `SELECT prc.id, prc.user_id
       FROM password_reset_codes prc
       INNER JOIN users u ON u.id = prc.user_id
       WHERE u.email = ?
         AND prc.code_hash = ?
         AND prc.used_at IS NULL
         AND prc.expires_at > datetime('now')
       ORDER BY prc.created_at DESC
       LIMIT 1;`,
      email,
      codeHash
    );

    if (!resetCode) {
      return res.status(400).json({ error: 'Reset code is invalid or expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?;',
      passwordHash,
      resetCode.user_id
    );

    await db.run(
      'UPDATE password_reset_codes SET used_at = datetime(\'now\') WHERE id = ?;',
      resetCode.id
    );

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error while resetting password' });
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
    const projects = await db.all(
      `SELECT
        p.id,
        p.name,
        p.description,
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
    res.json({ projects });
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
    const project = await db.get(
      'SELECT id, name, description, owner_user_id, created_at FROM projects WHERE id = ?;',
      id
    );
    if (!project) {
      return res.status(404).json({ error: 'project not found' });
    }
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description, ownerUserId } = req.body ?? {};
  if (!name || !ownerUserId) {
    return res.status(400).json({ error: 'name and ownerUserId are required' });
  }

  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO projects (name, description, owner_user_id) VALUES (?, ?, ?);',
      name,
      description ?? null,
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
    const project = await db.get(
      'SELECT id, name, description, owner_user_id, created_at FROM projects WHERE id = ?;',
      projectId
    );
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id ?? 0);
  const { name, description } = req.body ?? {};
  if (!id || !name) {
    return res.status(400).json({ error: 'id and name are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?;',
      name,
      description ?? null,
      id
    );
    const project = await db.get(
      'SELECT id, name, description, owner_user_id, created_at FROM projects WHERE id = ?;',
      id
    );
    res.json({ project });
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
      'SELECT id, project_id, title, type, status, created_at FROM requirements WHERE project_id = ? ORDER BY id DESC;',
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
  const { title, type, status } = req.body ?? {};
  if (!projectId || !title || !type || !status) {
    return res.status(400).json({ error: 'projectId, title, type, and status are required' });
  }

  try {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO requirements (project_id, title, type, status) VALUES (?, ?, ?, ?);',
      projectId,
      title,
      type,
      status
    );
    const requirementId = result.lastID;
    if (!requirementId) {
      throw new Error('Failed to create requirement.');
    }
    const requirement = await db.get(
      'SELECT id, project_id, title, type, status, created_at FROM requirements WHERE id = ?;',
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
  const { title, type, status } = req.body ?? {};
  if (!id || !title || !type || !status) {
    return res.status(400).json({ error: 'id, title, type, and status are required' });
  }

  try {
    const db = getDb();
    await db.run(
      'UPDATE requirements SET title = ?, type = ?, status = ? WHERE id = ?;',
      title,
      type,
      status,
      id
    );
    const requirement = await db.get(
      'SELECT id, project_id, title, type, status, created_at FROM requirements WHERE id = ?;',
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
  .then(async () => {
    await seedDatabaseIfEmpty();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    // Keep the server reference so it doesn't get garbage collected
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  })
  .catch((err) => {
    console.error('Failed to connect to SQLite', err);
    process.exit(1);
  });

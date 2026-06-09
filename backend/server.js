const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config();

const app = express();
const PORT = 5000;

const IS_VERCEL = !!process.env.VERCEL;
const uploadDir = IS_VERCEL ? '/tmp/fenelons-uploads' : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const sql = neon(process.env.DATABASE_URL);

// snake_case DB rows → camelCase JS objects
const toCamel = (obj) => {
  if (!obj) return null;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v instanceof Date ? v.toISOString() : v,
    ])
  );
};

// ── DB Init ────────────────────────────────────────────────────────────────
async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title            TEXT NOT NULL,
      department       TEXT,
      location         TEXT,
      type             TEXT,
      experience       TEXT,
      salary           TEXT,
      description      TEXT,
      working_hours    TEXT,
      responsibilities TEXT,
      requirements     TEXT,
      training_info    TEXT,
      active           BOOLEAN DEFAULT true,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_id               TEXT,
      job_title            TEXT,
      name                 TEXT,
      email                TEXT,
      phone                TEXT,
      cover_letter         TEXT,
      resume_file          TEXT,
      resume_original_name TEXT,
      applied_at           TIMESTAMPTZ DEFAULT NOW(),
      status               TEXT DEFAULT 'pending'
    )
  `;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM jobs`;
  if (count === 0) {
    const t  = 'Butcher Assistant';
    const dp = 'Butchery';
    const lo = 'Stillorgan Village Centre, Dublin, Ireland';
    const ty = 'Part-Time';
    const ex = 'No experience required, full training provided';
    const sa = '€14.15/hr (Basic Pay)';
    const de = 'Fenelons Butchers is currently looking for a Part-Time Butcher Assistant to join our team at our store in Stillorgan Village Centre. We are looking for hardworking, reliable, and energetic individuals who can assist with the daily operations of a busy butcher shop. Previous butcher or meat-handling experience is an advantage, but full training will be provided to the right candidates.';
    const wh = '• Shift: 8:00 AM - 6:00 PM\n• 9 working hours per shift\n• 1-hour break (including a 20-minute tea break)\n• Applicants should be available to work at least 2 days per week\n• Suitable for students seeking part-time work';
    const re = '• Assisting butchers and other team members with daily tasks\n• Serving customers and providing excellent customer service\n• Assisting with meat preparation and packaging\n• Learning till/cashier operations\n• Opening and closing duties\n• General cleaning and maintaining store hygiene standards\n• Stock handling and replenishment\n• Supporting the team wherever assistance is required\n\nYou will be working alongside a team of 4-5 staff members each day, so teamwork and a positive attitude are essential.';
    const rq = '• Fluent English communication skills\n• Friendly and confident when dealing with customers\n• Fast learner with a strong work ethic\n• Ability to work efficiently in a busy environment\n• Reliable, punctual, and professional\n• Basic knowledge of meat products is beneficial\n• Previous butcher, retail, food service, or customer service experience is an advantage';
    const tr = '• Successful applicants will complete a 2-day trial period\n• Full training will be provided\n• Candidates who perform well during the trial will be offered a part-time position';
    await sql`
      INSERT INTO jobs (title, department, location, type, experience, salary, description, working_hours, responsibilities, requirements, training_info)
      VALUES (${t}, ${dp}, ${lo}, ${ty}, ${ex}, ${sa}, ${de}, ${wh}, ${re}, ${rq}, ${tr})
    `;
  }
}

initDb().catch(err => console.error('DB init error:', err.message));

app.use(cors());
app.use(express.json());

// ── Rate limiting ──────────────────────────────────────────────────────────
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS  = 60 * 60 * 1000;
const LOCKOUT_MS = 60 * 60 * 1000;

function getRateLimit(ip) {
  const now = Date.now();
  const e = loginAttempts.get(ip);
  if (!e) return { blocked: false, remaining: MAX_ATTEMPTS };
  if (e.lockedUntil && now < e.lockedUntil)
    return { blocked: true, retryAfter: Math.ceil((e.lockedUntil - now) / 1000) };
  if (now - e.firstAttempt > WINDOW_MS) { loginAttempts.delete(ip); return { blocked: false, remaining: MAX_ATTEMPTS }; }
  return { blocked: false, remaining: Math.max(0, MAX_ATTEMPTS - e.count) };
}
function recordLoginFailure(ip) {
  const now = Date.now();
  const e = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: null };
  e.count += 1;
  if (e.count >= MAX_ATTEMPTS) e.lockedUntil = now + LOCKOUT_MS;
  loginAttempts.set(ip, e);
}
function recordLoginSuccess(ip) { loginAttempts.delete(ip); }
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of loginAttempts.entries())
    if (now - e.firstAttempt > WINDOW_MS * 2) loginAttempts.delete(ip);
}, 30 * 60 * 1000);

// ── Auth ───────────────────────────────────────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Fenelons@2024';
const ADMIN_TOKEN    = 'fenelons-admin-secure-token-2024';

const verifyAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN)
    return res.status(401).json({ message: 'Unauthorized' });
  next();
};

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const limit = getRateLimit(ip);
  if (limit.blocked)
    return res.status(429).json({ success: false, message: `Too many failed attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).` });

  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Username and password are required.' });

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    recordLoginSuccess(ip);
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  recordLoginFailure(ip);
  const nl = getRateLimit(ip);
  return res.status(401).json({ success: false, message: nl.blocked ? 'Account locked due to too many failed attempts.' : 'Invalid credentials.' });
});

// ── File upload ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `resume_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    allowed.includes(path.extname(file.originalname).toLowerCase()) ? cb(null, true) : cb(new Error('Only PDF and Word documents are allowed'));
  },
});
app.use('/uploads', express.static(uploadDir));

// ── Public Jobs ────────────────────────────────────────────────────────────
app.get('/api/jobs', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM jobs WHERE active = true ORDER BY created_at DESC`;
    res.json(rows.map(toCamel));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM jobs WHERE id = ${req.params.id}`;
    if (!rows.length) return res.status(404).json({ message: 'Job not found' });
    res.json(toCamel(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Admin Jobs ─────────────────────────────────────────────────────────────
app.get('/api/admin/jobs', verifyAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
    res.json(rows.map(toCamel));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/admin/jobs', verifyAdmin, async (req, res) => {
  try {
    const { title, department, location, type, experience, salary, description, workingHours, responsibilities, requirements, trainingInfo } = req.body;
    const rows = await sql`
      INSERT INTO jobs (title, department, location, type, experience, salary, description, working_hours, responsibilities, requirements, training_info, active)
      VALUES (${title}, ${department || null}, ${location || null}, ${type || null}, ${experience || null}, ${salary || null}, ${description || null}, ${workingHours || null}, ${responsibilities || null}, ${requirements || null}, ${trainingInfo || null}, true)
      RETURNING *
    `;
    res.json(toCamel(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/jobs/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, department, location, type, experience, salary, description, workingHours, responsibilities, requirements, trainingInfo, active } = req.body;
    const rows = await sql`
      UPDATE jobs SET
        title            = ${title},
        department       = ${department || null},
        location         = ${location || null},
        type             = ${type || null},
        experience       = ${experience || null},
        salary           = ${salary || null},
        description      = ${description || null},
        working_hours    = ${workingHours || null},
        responsibilities = ${responsibilities || null},
        requirements     = ${requirements || null},
        training_info    = ${trainingInfo || null},
        active           = ${active !== undefined ? active : true}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    if (!rows.length) return res.status(404).json({ message: 'Job not found' });
    res.json(toCamel(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/jobs/:id', verifyAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM jobs WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Applications ───────────────────────────────────────────────────────────
app.post('/api/applications', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, coverLetter, jobId, jobTitle } = req.body;
    const resumeFile = req.file?.filename || null;
    const resumeOriginalName = req.file?.originalname || null;
    await sql`
      INSERT INTO applications (job_id, job_title, name, email, phone, cover_letter, resume_file, resume_original_name)
      VALUES (${jobId || null}, ${jobTitle || null}, ${name}, ${email}, ${phone || null}, ${coverLetter || null}, ${resumeFile}, ${resumeOriginalName})
    `;
    res.json({ success: true, message: 'Application submitted successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/applications', verifyAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM applications ORDER BY applied_at DESC`;
    res.json(rows.map(toCamel));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/api/admin/applications/:id/status', verifyAdmin, async (req, res) => {
  try {
    const rows = await sql`
      UPDATE applications SET status = ${req.body.status} WHERE id = ${req.params.id} RETURNING *
    `;
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(toCamel(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/admin/applications/:id', verifyAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM applications WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Analytics ──────────────────────────────────────────────────────────────
app.get('/api/admin/analytics', verifyAdmin, async (req, res) => {
  try {
    const [
      [jobStats],
      [appStats],
      [weeklyApps],
      byJob,
      trend,
      [sb],
      recentApps,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total, SUM(CASE WHEN active THEN 1 ELSE 0 END)::int AS active FROM jobs`,
      sql`SELECT COUNT(*)::int AS total FROM applications`,
      sql`SELECT COUNT(*)::int AS count FROM applications WHERE applied_at > NOW() - INTERVAL '7 days'`,
      sql`SELECT COALESCE(job_title, 'Unknown') AS name, COUNT(*)::int AS count
          FROM applications GROUP BY job_title ORDER BY count DESC LIMIT 8`,
      sql`SELECT TO_CHAR(d::date, 'Dy') AS date, COUNT(a.id)::int AS count
          FROM generate_series(NOW() - INTERVAL '6 days', NOW(), '1 day') d
          LEFT JOIN applications a ON DATE(a.applied_at) = d::date
          GROUP BY d ORDER BY d`,
      sql`SELECT
            SUM(CASE WHEN status = 'pending'     THEN 1 ELSE 0 END)::int AS pending,
            SUM(CASE WHEN status = 'reviewed'    THEN 1 ELSE 0 END)::int AS reviewed,
            SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END)::int AS shortlisted,
            SUM(CASE WHEN status = 'rejected'    THEN 1 ELSE 0 END)::int AS rejected
          FROM applications`,
      sql`SELECT * FROM applications ORDER BY applied_at DESC LIMIT 5`,
    ]);

    res.json({
      totalJobs: jobStats.total,
      activeJobs: jobStats.active,
      totalApplications: appStats.total,
      weeklyApplications: weeklyApps.count,
      applicationsByJob: byJob.map(r => ({
        name: r.name.length > 22 ? r.name.substring(0, 20) + '…' : r.name,
        count: r.count,
      })),
      applicationTrend: trend,
      statusBreakdown: sb,
      recentApplications: recentApps.map(toCamel),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`\n🥩 Fenelons API running at http://localhost:${PORT}\n`));
}

module.exports = app;

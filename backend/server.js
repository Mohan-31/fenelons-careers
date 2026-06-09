const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

const IS_VERCEL = !!process.env.VERCEL;
const dataDir = IS_VERCEL ? '/tmp/fenelons-data' : path.join(__dirname, 'data');
const uploadDir = IS_VERCEL ? '/tmp/fenelons-uploads' : path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.json());

[uploadDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const JOBS_FILE = path.join(dataDir, 'jobs.json');
const APPLICATIONS_FILE = path.join(dataDir, 'applications.json');

const readData = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
};
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ── Rate limiting (in-memory) ──────────────────────────────────────────────
const loginAttempts = new Map(); // ip -> { count, firstAttempt, lockedUntil }
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000;    // 1-hour window
const LOCKOUT_MS = 60 * 60 * 1000;   // 1-hour lockout

function getRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) return { blocked: false, remaining: MAX_ATTEMPTS };
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }
  return { blocked: false, remaining: Math.max(0, MAX_ATTEMPTS - entry.count) };
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) entry.lockedUntil = now + LOCKOUT_MS;
  loginAttempts.set(ip, entry);
}

function recordLoginSuccess(ip) {
  loginAttempts.delete(ip);
}

// Clean up old entries every 30 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS * 2) loginAttempts.delete(ip);
  }
}, 30 * 60 * 1000);
// ──────────────────────────────────────────────────────────────────────────

// Seed jobs if not present
if (!fs.existsSync(JOBS_FILE)) {
  writeData(JOBS_FILE, [
    {
      id: uuidv4(),
      title: 'Butcher Assistant (Part-Time)',
      department: 'Butchery',
      location: 'Stillorgan Village Centre, Dublin, Ireland',
      type: 'Part-Time',
      experience: 'No experience required, full training provided',
      salary: '€14.15/hr (Basic Pay)',
      description: "Fenelons Butchers is currently looking for a Part-Time Butcher Assistant to join our team at our store in Stillorgan Village Centre. We are looking for hardworking, reliable, and energetic individuals who can assist with the daily operations of a busy butcher shop. Previous butcher or meat-handling experience is an advantage, but full training will be provided to the right candidates.",
      workingHours: "• Shift: 8:00 AM – 6:00 PM\n• 9 working hours per shift\n• 1-hour break (including a 20-minute tea break)\n• Applicants should be available to work at least 2 days per week\n• Suitable for students seeking part-time work",
      responsibilities: "• Assisting butchers and other team members with daily tasks\n• Serving customers and providing excellent customer service\n• Assisting with meat preparation and packaging\n• Learning till/cashier operations\n• Opening and closing duties\n• General cleaning and maintaining store hygiene standards\n• Stock handling and replenishment\n• Supporting the team wherever assistance is required\n\nYou will be working alongside a team of 4–5 staff members each day, so teamwork and a positive attitude are essential.",
      requirements: "• Fluent English communication skills\n• Friendly and confident when dealing with customers\n• Fast learner with a strong work ethic\n• Ability to work efficiently in a busy environment\n• Reliable, punctual, and professional\n• Basic knowledge of meat products is beneficial\n• Previous butcher, retail, food service, or customer service experience is an advantage",
      trainingInfo: "• Successful applicants will complete a 2-day trial period\n• Full training will be provided\n• Candidates who perform well during the trial will be offered a part-time position",
      active: true,
      createdAt: new Date().toISOString(),
    }
  ]);
}

if (!fs.existsSync(APPLICATIONS_FILE)) writeData(APPLICATIONS_FILE, []);

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `resume_${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  },
});

app.use('/uploads', express.static(uploadDir));

// ── Admin credentials ──────────────────────────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Fenelons@2024';
const ADMIN_TOKEN = 'fenelons-admin-secure-token-2024';

const verifyAdmin = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.split(' ')[1] !== ADMIN_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Admin login with rate limiting
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const limit = getRateLimit(ip);

  if (limit.blocked) {
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).`,
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    recordLoginSuccess(ip);
    return res.json({ success: true, token: ADMIN_TOKEN });
  }

  recordLoginFailure(ip);
  const newLimit = getRateLimit(ip);
  return res.status(401).json({
    success: false,
    message: newLimit.blocked
      ? 'Account locked due to too many failed attempts.'
      : 'Invalid credentials.',
  });
});

// Public Jobs
app.get('/api/jobs', (req, res) => {
  const jobs = readData(JOBS_FILE);
  res.json(jobs.filter(j => j.active).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = readData(JOBS_FILE).find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
});

// Admin Jobs (protected)
app.get('/api/admin/jobs', verifyAdmin, (req, res) => {
  res.json(readData(JOBS_FILE).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/admin/jobs', verifyAdmin, (req, res) => {
  const jobs = readData(JOBS_FILE);
  const newJob = { id: uuidv4(), ...req.body, active: true, createdAt: new Date().toISOString() };
  jobs.unshift(newJob);
  writeData(JOBS_FILE, jobs);
  res.json(newJob);
});

app.put('/api/admin/jobs/:id', verifyAdmin, (req, res) => {
  const jobs = readData(JOBS_FILE);
  const idx = jobs.findIndex(j => j.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Job not found' });
  jobs[idx] = { ...jobs[idx], ...req.body };
  writeData(JOBS_FILE, jobs);
  res.json(jobs[idx]);
});

app.delete('/api/admin/jobs/:id', verifyAdmin, (req, res) => {
  writeData(JOBS_FILE, readData(JOBS_FILE).filter(j => j.id !== req.params.id));
  res.json({ success: true });
});

// Applications
app.post('/api/applications', upload.single('resume'), (req, res) => {
  const apps = readData(APPLICATIONS_FILE);
  const newApp = {
    id: uuidv4(), ...req.body,
    resumeFile: req.file?.filename || null,
    resumeOriginalName: req.file?.originalname || null,
    appliedAt: new Date().toISOString(),
    status: 'pending',
  };
  apps.unshift(newApp);
  writeData(APPLICATIONS_FILE, apps);
  res.json({ success: true, message: 'Application submitted successfully!' });
});

app.get('/api/admin/applications', verifyAdmin, (req, res) => {
  res.json(readData(APPLICATIONS_FILE).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
});

app.put('/api/admin/applications/:id/status', verifyAdmin, (req, res) => {
  const apps = readData(APPLICATIONS_FILE);
  const idx = apps.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  apps[idx].status = req.body.status;
  writeData(APPLICATIONS_FILE, apps);
  res.json(apps[idx]);
});

app.delete('/api/admin/applications/:id', verifyAdmin, (req, res) => {
  writeData(APPLICATIONS_FILE, readData(APPLICATIONS_FILE).filter(a => a.id !== req.params.id));
  res.json({ success: true });
});

// Analytics (protected)
app.get('/api/admin/analytics', verifyAdmin, (req, res) => {
  const jobs = readData(JOBS_FILE);
  const applications = readData(APPLICATIONS_FILE);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const byJob = {};
  applications.forEach(app => {
    const key = app.jobTitle || 'Unknown';
    byJob[key] = (byJob[key] || 0) + 1;
  });

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    trend.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: applications.filter(a => a.appliedAt?.startsWith(dateStr)).length,
    });
  }

  res.json({
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.active).length,
    totalApplications: applications.length,
    weeklyApplications: applications.filter(a => new Date(a.appliedAt) > sevenDaysAgo).length,
    applicationsByJob: Object.entries(byJob)
      .map(([name, count]) => ({ name: name.length > 22 ? name.substring(0, 20) + '…' : name, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8),
    applicationTrend: trend,
    statusBreakdown: {
      pending: applications.filter(a => a.status === 'pending').length,
      reviewed: applications.filter(a => a.status === 'reviewed').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    },
    recentApplications: applications.slice(0, 5),
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🥩 Fenelons Butchers Admin API running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;

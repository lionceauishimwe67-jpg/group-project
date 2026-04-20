const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function uid() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
}

// -------------------------
// In-memory "database"
// -------------------------
const db = {
  users: [],
  sessions: new Map(), // token -> userId
  groups: [] // {id, ownerId, name, monthlyAmount, durationMonths, startDate, createdAt, members: [{id,name,phone}], rotation: [memberId], contributions: [], payouts: []}
};

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing Authorization token' });

  const token = match[1];
  const userId = db.sessions.get(token);
  if (!userId) return res.status(401).json({ error: 'Invalid session' });

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  req.user = user;
  next();
}

function publicUser(u) {
  return { id: u.id, fullName: u.fullName, email: u.email, createdAt: u.createdAt };
}

function computeCycleIndex(group) {
  const start = new Date(group.startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, Math.min(group.durationMonths - 1, months));
}

function computePayoutRecipient(group, cycleIndex) {
  const rotation = group.rotation || [];
  if (!rotation.length) return null;
  const idx = cycleIndex % rotation.length;
  const memberId = rotation[idx];
  return group.members.find((m) => m.id === memberId) || null;
}

function ensureSchedule(group) {
  // contributions: one record per member per month
  const members = group.members || [];
  const duration = group.durationMonths || 0;
  const start = new Date(group.startDate);
  const monthlyAmount = Number(group.monthlyAmount) || 0;

  const byKey = new Map(group.contributions.map((c) => [`${c.monthKey}:${c.memberId}`, c]));

  for (let i = 0; i < duration; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    for (const m of members) {
      const key = `${monthKey}:${m.id}`;
      if (!byKey.has(key)) {
        group.contributions.push({
          id: uid(),
          groupId: group.id,
          monthKey,
          memberId: m.id,
          amount: monthlyAmount,
          status: 'Pending',
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // payouts: one per cycle/month
  const payoutByMonth = new Map(group.payouts.map((p) => [p.monthKey, p]));
  for (let i = 0; i < duration; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    if (!payoutByMonth.has(monthKey)) {
      group.payouts.push({
        id: uid(),
        groupId: group.id,
        monthKey,
        cycleIndex: i,
        memberId: null,
        amount: monthlyAmount * Math.max(1, members.length),
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      });
    }
  }
}

// -------------------------
// Auth
// -------------------------
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName || !String(fullName).trim()) return res.status(400).json({ error: 'Full name is required' });
  if (!email || !String(email).trim()) return res.status(400).json({ error: 'Email is required' });
  if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = db.users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const user = {
    id: uid(),
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password: String(password), // demo only; use hashing in production
    createdAt: new Date().toISOString()
  };
  db.users.push(user);

  const token = uid();
  db.sessions.set(token, user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== String(password || '')) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = uid();
  db.sessions.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// -------------------------
// Dashboard
// -------------------------
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const groups = db.groups.filter((g) => g.ownerId === req.user.id);
  for (const g of groups) ensureSchedule(g);

  let totalContributed = 0;
  for (const g of groups) {
    for (const c of g.contributions || []) {
      if (c.status === 'Paid') totalContributed += Number(c.amount) || 0;
    }
  }

  // Next payout: pick the soonest "current cycle" monthKey across all groups
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let next = null;

  for (const g of groups) {
    const cycleIndex = computeCycleIndex(g);
    const payout = (g.payouts || []).find((p) => p.cycleIndex === cycleIndex);
    const recipient = computePayoutRecipient(g, cycleIndex);
    const monthKey = payout?.monthKey || nowKey;

    const candidate = {
      groupId: g.id,
      groupName: g.name,
      cycleIndex,
      monthKey,
      recipientName: recipient?.name || null,
      amount: (Number(g.monthlyAmount) || 0) * Math.max(1, (g.members || []).length)
    };

    if (!next) next = candidate;
    else if (String(candidate.monthKey).localeCompare(String(next.monthKey)) < 0) next = candidate;
  }

  res.json({
    totalGroups: groups.length,
    totalContributed,
    currentCycleMonthKey: nowKey,
    nextPayout: next
  });
});

// -------------------------
// Groups
// -------------------------
app.get('/api/groups', authMiddleware, (req, res) => {
  const groups = db.groups
    .filter((g) => g.ownerId === req.user.id)
    .map((g) => ({
      id: g.id,
      name: g.name,
      monthlyAmount: g.monthlyAmount,
      durationMonths: g.durationMonths,
      startDate: g.startDate,
      createdAt: g.createdAt,
      membersCount: (g.members || []).length
    }));
  res.json(groups);
});

app.post('/api/groups', authMiddleware, (req, res) => {
  const { name, monthlyAmount, durationMonths, startDate } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Group name is required' });

  const amount = Number(monthlyAmount);
  const duration = Number(durationMonths);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Monthly amount must be a positive number' });
  if (!Number.isFinite(duration) || duration <= 0) return res.status(400).json({ error: 'Duration must be a positive number of months' });
  if (!startDate || Number.isNaN(new Date(startDate).getTime())) return res.status(400).json({ error: 'Start date is invalid' });

  const group = {
    id: uid(),
    ownerId: req.user.id,
    name: String(name).trim(),
    monthlyAmount: amount,
    durationMonths: duration,
    startDate: new Date(startDate).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
    members: [],
    rotation: [],
    contributions: [],
    payouts: []
  };

  ensureSchedule(group);
  db.groups.push(group);
  res.status(201).json(group);
});

app.get('/api/groups/:groupId', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  ensureSchedule(group);
  const cycleIndex = computeCycleIndex(group);
  const recipient = computePayoutRecipient(group, cycleIndex);
  res.json({
    ...group,
    computed: {
      currentCycleIndex: cycleIndex,
      currentCycleMonthKey: group.payouts.find((p) => p.cycleIndex === cycleIndex)?.monthKey || null,
      nextPayoutRecipient: recipient
    }
  });
});

app.post('/api/groups/:groupId/members', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const { name, phone } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Member name is required' });

  const member = { id: uid(), name: String(name).trim(), phone: String(phone || '').trim() };
  group.members.push(member);
  group.rotation.push(member.id); // default: join order
  ensureSchedule(group);
  res.status(201).json(member);
});

app.post('/api/groups/:groupId/rotation', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const { rotation } = req.body || {};
  if (!Array.isArray(rotation)) return res.status(400).json({ error: 'rotation must be an array of memberIds' });
  const memberIds = new Set((group.members || []).map((m) => m.id));
  const sanitized = rotation.filter((id) => memberIds.has(id));
  if (sanitized.length !== group.members.length) {
    return res.status(400).json({ error: 'Rotation must include all members exactly once' });
  }
  group.rotation = sanitized;
  res.json({ rotation: group.rotation });
});

// Contributions: list and update status
app.get('/api/groups/:groupId/contributions', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  ensureSchedule(group);
  res.json(group.contributions);
});

app.post('/api/groups/:groupId/contributions/:contributionId', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  ensureSchedule(group);

  const c = group.contributions.find((x) => x.id === req.params.contributionId);
  if (!c) return res.status(404).json({ error: 'Contribution not found' });

  const { status } = req.body || {};
  const allowed = new Set(['Paid', 'Pending', 'Late']);
  if (!allowed.has(status)) return res.status(400).json({ error: 'Invalid status' });
  c.status = status;
  c.updatedAt = new Date().toISOString();
  res.json(c);
});

// Payouts
app.get('/api/groups/:groupId/payouts', authMiddleware, (req, res) => {
  const group = db.groups.find((g) => g.id === req.params.groupId && g.ownerId === req.user.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  ensureSchedule(group);

  const cycleIndex = computeCycleIndex(group);
  const currentMonthKey = group.payouts.find((p) => p.cycleIndex === cycleIndex)?.monthKey || null;
  const recipient = computePayoutRecipient(group, cycleIndex);

  // Keep payouts memberId aligned with rotation
  for (const p of group.payouts) {
    const r = computePayoutRecipient(group, p.cycleIndex);
    p.memberId = r ? r.id : null;
    p.amount = Number(group.monthlyAmount) * Math.max(1, (group.members || []).length);
  }

  res.json({
    currentCycleIndex: cycleIndex,
    currentMonthKey,
    currentRecipient: recipient,
    history: group.payouts
      .slice()
      .sort((a, b) => (a.cycleIndex ?? 0) - (b.cycleIndex ?? 0))
  });
});

// Serve static frontend
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback to index.html for root
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Ikimina server listening on http://localhost:${PORT}`);
});


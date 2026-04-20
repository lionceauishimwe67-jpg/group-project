const { useEffect, useMemo, useState } = React;
const {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams
} = ReactRouterDOM;

const storage = {
  getToken() {
    return localStorage.getItem('ikimina_token');
  },
  setToken(token) {
    localStorage.setItem('ikimina_token', token);
  },
  clearToken() {
    localStorage.removeItem('ikimina_token');
  }
};

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function currency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(n);
}

function monthLabel(monthKey) {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map((x) => Number(x));
  const d = new Date(Date.UTC(y, (m || 1) - 1, 1));
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function useAuth() {
  const [token, setToken] = useState(storage.getToken());
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const t = storage.getToken();
      if (!t) {
        setBooting(false);
        return;
      }
      try {
        const me = await api('/api/me', { token: t });
        if (!cancelled) {
          setToken(t);
          setUser(me.user);
        }
      } catch (e) {
        storage.clearToken();
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    token,
    user,
    booting,
    async register({ fullName, email, password }) {
      const res = await api('/api/auth/register', { method: 'POST', body: { fullName, email, password } });
      storage.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    async login({ email, password }) {
      const res = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      storage.setToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    },
    logout() {
      storage.clearToken();
      setToken(null);
      setUser(null);
    }
  };
}

function AppShell({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If logged out and currently in app routes, redirect to landing
    if (!auth.token && location.pathname.startsWith('/app')) {
      navigate('/', { replace: true });
    }
  }, [auth.token, location.pathname, navigate]);

  return (
    <div className="ds-root">
      <Outlet />
    </div>
  );
}

function Landing() {
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="brand">
          <div className="brand-mark">DI</div>
          <div className="brand-text">
            <h1>Digital Ikimina</h1>
            <p>
              Gucunga ibimina byawe: groups, contributions, rotation, na payouts — byose hamwe.
            </p>
          </div>
        </div>

        <div className="landing-actions">
          <Link className="btn primary" to="/login">
            Login
          </Link>
          <Link className="btn ghost" to="/register">
            Register
          </Link>
        </div>

        <div className="landing-meta">
          <span>React + Node.js</span>
          <span>Demo (in-memory data)</span>
        </div>
      </div>
    </div>
  );
}

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-head">
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function Login({ auth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setBusy(true);
      await auth.login({ email, password });
      navigate('/app/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Login"
      subtitle="Injira muri Digital Ikimina."
      footer={
        <span>
          Nta konti ufite? <Link to="/register">Register</Link>
        </span>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            type="password"
          />
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Loading…' : 'Login'}
        </button>
      </form>
    </AuthCard>
  );
}

function Register({ auth }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setBusy(true);
      await auth.register({ fullName, email, password });
      navigate('/app/dashboard');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Register"
      subtitle="Kora konti nshya."
      footer={
        <span>
          Usanzwe ufite konti? <Link to="/login">Login</Link>
        </span>
      }
    >
      <form className="form" onSubmit={onSubmit}>
        <div className="field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 4 characters"
            type="password"
          />
        </div>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}

function RequireAuth({ auth, children }) {
  if (auth.booting) return <div className="center-muted">Loading…</div>;
  if (!auth.token) return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ auth }) {
  const navigate = useNavigate();
  const location = useLocation();

  function onLogout() {
    auth.logout();
    navigate('/', { replace: true });
  }

  const nav = [
    { to: '/app/dashboard', label: 'Dashboard' },
    { to: '/app/groups', label: 'My Groups' },
    { to: '/app/groups/new', label: 'Create Group' }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">DI</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-title">Digital Ikimina</div>
            <div className="sidebar-sub">{auth.user?.fullName || 'Member'}</div>
          </div>
        </div>

        <nav className="nav">
          {nav.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              {i.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-hint">You are on: {location.pathname.replace('/app/', '')}</div>
          <button className="btn ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function Dashboard({ auth }) {
  const [groups, setGroups] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [dash, data] = await Promise.all([
          api('/api/dashboard', { token: auth.token }),
          api('/api/groups', { token: auth.token })
        ]);
        if (!cancelled) {
          setKpis(dash);
          setGroups(data);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  const totals = useMemo(() => {
    const totalGroups = kpis?.totalGroups ?? groups.length;
    const totalContributed = kpis?.totalContributed ?? 0;
    const nextPayout = kpis?.nextPayout
      ? `${kpis.nextPayout.recipientName || '—'} • ${monthLabel(kpis.nextPayout.monthKey)}`
      : '—';
    const currentCycle = kpis?.currentCycleMonthKey ? monthLabel(kpis.currentCycleMonthKey) : '—';
    return { totalGroups, totalContributed, nextPayout, currentCycle };
  }, [groups.length, kpis]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p>Quick summary of your Ikimina activity.</p>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid4">
        <div className="kpi">
          <div className="kpi-label">Total groups</div>
          <div className="kpi-value">{loading ? '…' : totals.totalGroups}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total contributed</div>
          <div className="kpi-value">{loading ? '…' : currency(totals.totalContributed)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Next payout</div>
          <div className="kpi-value">{totals.nextPayout}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Current cycle</div>
          <div className="kpi-value">{totals.currentCycle}</div>
        </div>
      </div>

      <div className="card ds-card">
        <div className="card-head">
          <div>
            <h3>Your groups</h3>
            <p>Open a group to manage members, contributions, and payouts.</p>
          </div>
          <Link className="btn primary" to="/app/groups/new">
            Create group
          </Link>
        </div>

        {loading ? (
          <div className="center-muted">Loading groups…</div>
        ) : groups.length === 0 ? (
          <div className="center-muted">No groups yet. Create your first Ikimina group.</div>
        ) : (
          <div className="table">
            <div className="tr th">
              <div>Group</div>
              <div>Monthly</div>
              <div>Duration</div>
              <div>Members</div>
              <div></div>
            </div>
            {groups.map((g) => (
              <div className="tr" key={g.id}>
                <div className="td-strong">{g.name}</div>
                <div>{currency(g.monthlyAmount)}</div>
                <div>{g.durationMonths} months</div>
                <div>{g.membersCount}</div>
                <div className="td-actions">
                  <Link className="btn sm ghost" to={`/app/groups/${g.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Groups({ auth }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const data = await api('/api/groups', { token: auth.token });
      setGroups(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [auth.token]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>My Groups</h2>
          <p>List y’ibimina byawe.</p>
        </div>
        <Link className="btn primary" to="/app/groups/new">
          Create Group
        </Link>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="card ds-card">
        {loading ? (
          <div className="center-muted">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="center-muted">Nta group urakora. Kanda “Create Group”.</div>
        ) : (
          <div className="table">
            <div className="tr th">
              <div>Name</div>
              <div>Monthly</div>
              <div>Duration</div>
              <div>Start</div>
              <div></div>
            </div>
            {groups.map((g) => (
              <div className="tr" key={g.id}>
                <div className="td-strong">{g.name}</div>
                <div>{currency(g.monthlyAmount)}</div>
                <div>{g.durationMonths} months</div>
                <div>{g.startDate}</div>
                <div className="td-actions">
                  <Link className="btn sm ghost" to={`/app/groups/${g.id}`}>
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateGroup({ auth }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [durationMonths, setDurationMonths] = useState(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      setBusy(true);
      const g = await api('/api/groups', {
        method: 'POST',
        token: auth.token,
        body: { name, monthlyAmount: Number(monthlyAmount), durationMonths: Number(durationMonths), startDate }
      });
      navigate(`/app/groups/${g.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Create Group</h2>
          <p>Shyiraho ikimina gishya.</p>
        </div>
      </div>

      <div className="card ds-card">
        <form className="form grid2" onSubmit={onSubmit}>
          <div className="field span2">
            <label>Group name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ikimina y'Abakozi" />
          </div>
          <div className="field">
            <label>Monthly amount (RWF)</label>
            <input
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
              placeholder="e.g. 10000"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label>Duration (months)</label>
            <input
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              placeholder="e.g. 12"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label>Start date</label>
            <input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" />
          </div>
          <div className="field">
            <label>Estimated payout / month</label>
            <div className="pill soft">{currency(Number(monthlyAmount || 0) * 1)}</div>
          </div>
          {error ? (
            <div className="error span2">{error}</div>
          ) : null}
          <div className="span2 actions">
            <button className="btn primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create group'}
            </button>
            <Link className="btn ghost" to="/app/groups">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupDetails({ auth }) {
  const params = useParams();
  const groupId = params.groupId;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const g = await api(`/api/groups/${groupId}`, { token: auth.token });
      setGroup(g);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId, auth.token]);

  async function addMember(e) {
    e.preventDefault();
    setError('');
    try {
      setAdding(true);
      await api(`/api/groups/${groupId}/members`, {
        method: 'POST',
        token: auth.token,
        body: { name: memberName, phone: memberPhone }
      });
      setMemberName('');
      setMemberPhone('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="center-muted">Loading group…</div>;
  if (!group) return <div className="center-muted">Group not found.</div>;

  const rotationMembers = (group.rotation || [])
    .map((id) => group.members.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>{group.name}</h2>
          <p>
            Monthly: <b>{currency(group.monthlyAmount)}</b> • Duration: <b>{group.durationMonths} months</b> • Start:{' '}
            <b>{group.startDate}</b>
          </p>
        </div>
        <div className="head-actions">
          <Link className="btn ghost" to={`/app/groups/${group.id}/contributions`}>
            Contributions
          </Link>
          <Link className="btn primary" to={`/app/groups/${group.id}/payouts`}>
            Payouts
          </Link>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid2">
        <div className="card ds-card">
          <div className="card-head tight">
            <div>
              <h3>Members</h3>
              <p>Abanyamuryango b’ikimina.</p>
            </div>
            <span className="pill">{group.members.length}</span>
          </div>

          {group.members.length === 0 ? (
            <div className="center-muted">No members yet. Add the first member below.</div>
          ) : (
            <div className="list">
              {group.members.map((m) => (
                <div className="list-row" key={m.id}>
                  <div>
                    <div className="td-strong">{m.name}</div>
                    <div className="muted">{m.phone || '—'}</div>
                  </div>
                  <div className="pill soft">Member</div>
                </div>
              ))}
            </div>
          )}

          <form className="form inline" onSubmit={addMember}>
            <div className="field">
              <label>Add member</label>
              <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Name" />
            </div>
            <div className="field">
              <label>Phone (optional)</label>
              <input value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+250…" />
            </div>
            <button className="btn primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>
        </div>

        <div className="card ds-card">
          <div className="card-head tight">
            <div>
              <h3>Rotation order</h3>
              <p>Uko payout izajya itangwa (default: join order).</p>
            </div>
          </div>

          {rotationMembers.length === 0 ? (
            <div className="center-muted">Add members to generate a rotation order.</div>
          ) : (
            <ol className="ol">
              {rotationMembers.map((m) => (
                <li key={m.id}>
                  <span className="td-strong">{m.name}</span>
                </li>
              ))}
            </ol>
          )}

          <div className="callout">
            <div className="callout-title">Current cycle</div>
            <div className="callout-body">
              Cycle #{(group.computed?.currentCycleIndex ?? 0) + 1} •{' '}
              {group.computed?.currentCycleMonthKey ? monthLabel(group.computed.currentCycleMonthKey) : '—'}
              <div className="muted">
                Next payout: <b>{group.computed?.nextPayoutRecipient?.name || '—'}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Contributions({ auth }) {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const g = await api(`/api/groups/${groupId}`, { token: auth.token });
      const c = await api(`/api/groups/${groupId}/contributions`, { token: auth.token });
      setGroup(g);
      setRows(c);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId, auth.token]);

  async function setStatus(contributionId, status) {
    setError('');
    try {
      await api(`/api/groups/${groupId}/contributions/${contributionId}`, {
        method: 'POST',
        token: auth.token,
        body: { status }
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const memberById = useMemo(() => {
    const m = new Map();
    for (const mem of group?.members || []) m.set(mem.id, mem);
    return m;
  }, [group]);

  const grouped = useMemo(() => {
    const byMonth = new Map();
    for (const r of rows) {
      const key = r.monthKey;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key).push(r);
    }
    return [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Contributions</h2>
          <p>
            {group ? (
              <>
                Group: <b>{group.name}</b>
              </>
            ) : (
              'Loading…'
            )}
          </p>
        </div>
        <Link className="btn ghost" to={`/app/groups/${groupId}`}>
          Back to group
        </Link>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="card ds-card">
        {loading ? (
          <div className="center-muted">Loading contributions…</div>
        ) : rows.length === 0 ? (
          <div className="center-muted">No contributions yet (add members first).</div>
        ) : (
          grouped.map(([monthKey, list]) => (
            <div key={monthKey} className="month-block">
              <div className="month-head">
                <div className="month-title">{monthLabel(monthKey)}</div>
                <div className="pill soft">{currency(group?.monthlyAmount)}</div>
              </div>
              <div className="table">
                <div className="tr th">
                  <div>Member</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div></div>
                </div>
                {list.map((r) => (
                  <div className="tr" key={r.id}>
                    <div className="td-strong">{memberById.get(r.memberId)?.name || '—'}</div>
                    <div>{currency(r.amount)}</div>
                    <div>
                      <span className={`badge ${String(r.status).toLowerCase()}`}>{r.status}</span>
                    </div>
                    <div className="td-actions">
                      <button className="btn sm ghost" onClick={() => setStatus(r.id, 'Paid')}>
                        Paid
                      </button>
                      <button className="btn sm ghost" onClick={() => setStatus(r.id, 'Pending')}>
                        Pending
                      </button>
                      <button className="btn sm ghost" onClick={() => setStatus(r.id, 'Late')}>
                        Late
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Payouts({ auth }) {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      const g = await api(`/api/groups/${groupId}`, { token: auth.token });
      const p = await api(`/api/groups/${groupId}/payouts`, { token: auth.token });
      setGroup(g);
      setData(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [groupId, auth.token]);

  const memberById = useMemo(() => {
    const m = new Map();
    for (const mem of group?.members || []) m.set(mem.id, mem);
    return m;
  }, [group]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h2>Payouts</h2>
          <p>
            {group ? (
              <>
                Group: <b>{group.name}</b>
              </>
            ) : (
              'Loading…'
            )}
          </p>
        </div>
        <Link className="btn ghost" to={`/app/groups/${groupId}`}>
          Back to group
        </Link>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid2">
        <div className="card ds-card">
          <div className="card-head tight">
            <div>
              <h3>Current cycle</h3>
              <p>Cycle & recipient for this month.</p>
            </div>
          </div>
          {loading || !data ? (
            <div className="center-muted">Loading…</div>
          ) : (
            <div className="callout">
              <div className="callout-title">
                Cycle #{(data.currentCycleIndex ?? 0) + 1} • {monthLabel(data.currentMonthKey)}
              </div>
              <div className="callout-body">
                Uhabwa payout: <b>{data.currentRecipient?.name || '—'}</b>
                <div className="muted">Amount: {currency((group?.monthlyAmount || 0) * Math.max(1, group?.members?.length || 0))}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card ds-card">
          <div className="card-head tight">
            <div>
              <h3>Payout history</h3>
              <p>Planned rotation schedule.</p>
            </div>
          </div>
          {loading || !data ? (
            <div className="center-muted">Loading…</div>
          ) : (
            <div className="table">
              <div className="tr th">
                <div>Cycle</div>
                <div>Month</div>
                <div>Recipient</div>
                <div>Amount</div>
              </div>
              {data.history.map((p) => (
                <div className="tr" key={p.id}>
                  <div>#{(p.cycleIndex ?? 0) + 1}</div>
                  <div>{monthLabel(p.monthKey)}</div>
                  <div className="td-strong">{memberById.get(p.memberId)?.name || '—'}</div>
                  <div>{currency(p.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DigitalIkiminaApp() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell auth={auth} />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={auth.token ? <Navigate to="/app/dashboard" replace /> : <Login auth={auth} />} />
          <Route
            path="/register"
            element={auth.token ? <Navigate to="/app/dashboard" replace /> : <Register auth={auth} />}
          />

          <Route
            path="/app"
            element={
              <RequireAuth auth={auth}>
                <AppLayout auth={auth} />
              </RequireAuth>
            }
          >
            <Route path="dashboard" element={<Dashboard auth={auth} />} />
            <Route path="groups" element={<Groups auth={auth} />} />
            <Route path="groups/new" element={<CreateGroup auth={auth} />} />
            <Route path="groups/:groupId" element={<GroupDetails auth={auth} />} />
            <Route path="groups/:groupId/contributions" element={<Contributions auth={auth} />} />
            <Route path="groups/:groupId/payouts" element={<Payouts auth={auth} />} />
            <Route index element={<Navigate to="/app/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DigitalIkiminaApp />);


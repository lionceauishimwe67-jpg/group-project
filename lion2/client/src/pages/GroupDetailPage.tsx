import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

type DashboardData = {
  group: {
    _id: string;
    name: string;
    description?: string;
    monthlyContributionAmount: number;
    payoutDayOfMonth: number;
    startDate: string;
    owner: { name: string; email: string };
  };
  memberships: Array<{
    _id: string;
    user: { name: string; email: string };
    rotationPosition: number;
  }>;
  metrics: {
    totalContributed: number;
    nextPayoutMember: {
      member: string;
      cycleNumber: number;
      scheduledDate: string;
      memberUser?: { name: string; email: string } | null;
    } | null;
    remainingCycles: number;
    latePayments: Array<{ user: string; month: number; year: number; status: string }>;
  };
};

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionMonth, setContributionMonth] = useState(new Date().getMonth() + 1);
  const [contributionYear, setContributionYear] = useState(new Date().getFullYear());
  const [contributing, setContributing] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);

  const fetchDashboard = () => {
    if (!groupId) return;
    api
      .get(`/groups/${groupId}/dashboard`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    fetchDashboard();
  }, [groupId]);

  const handleRecordContribution = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    setContributing(true);
    setContribError(null);
    try {
      await api.post(`/groups/${groupId}/contributions`, {
        month: contributionMonth,
        year: contributionYear,
      });
      fetchDashboard();
    } catch (err: any) {
      setContribError(err.response?.data?.message || 'Failed to record contribution');
    } finally {
      setContributing(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!data) return null;

  const { group, memberships, metrics } = data;

  return (
    <div className="page dashboard-page">
      <div className="dashboard-header">
        <h1 className="page-title">{group.name}</h1>
        {group.description && <p className="page-subtitle">{group.description}</p>}
        <p className="card-meta">
          {group.monthlyContributionAmount} / month · Payout day: {group.payoutDayOfMonth} · Owner:{' '}
          {group.owner?.name}
        </p>
      </div>

      <div className="dashboard-metrics">
        <div className="metric-card">
          <span className="metric-label">Total contributed</span>
          <span className="metric-value">{metrics.totalContributed}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Remaining cycles</span>
          <span className="metric-value">{metrics.remainingCycles}</span>
        </div>
        <div className="metric-card highlight">
          <span className="metric-label">Next payout</span>
          <span className="metric-value">
            {metrics.nextPayoutMember
              ? metrics.nextPayoutMember.memberUser?.name ?? `Member #${metrics.nextPayoutMember.cycleNumber}`
              : 'None pending'}
          </span>
          {metrics.nextPayoutMember && (
            <span className="metric-sublabel">
              Cycle {metrics.nextPayoutMember.cycleNumber} ·{' '}
              {new Date(metrics.nextPayoutMember.scheduledDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Record my contribution</h2>
        <form className="form form-inline" onSubmit={handleRecordContribution}>
          <label className="field">
            <span>Month</span>
            <select
              value={contributionMonth}
              onChange={(e) => setContributionMonth(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Year</span>
            <select
              value={contributionYear}
              onChange={(e) => setContributionYear(Number(e.target.value))}
            >
              {[0, 1, 2].map((i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </label>
          <button className="btn-primary" type="submit" disabled={contributing}>
            {contributing ? 'Recording…' : 'Record contribution'}
          </button>
        </form>
        {contribError && <div className="alert-error">{contribError}</div>}
      </section>

      {metrics.latePayments.length > 0 && (
        <section className="dashboard-section">
          <h2>Late payments</h2>
          <ul className="list">
            {metrics.latePayments.map((p, i) => (
              <li key={i}>
                {p.month}/{p.year} – {p.status}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dashboard-section">
        <h2>Members ({memberships.length})</h2>
        <ul className="list">
          {memberships
            .sort((a, b) => a.rotationPosition - b.rotationPosition)
            .map((m) => (
              <li key={m._id}>
                Position {m.rotationPosition}: {m.user?.name} ({m.user?.email})
              </li>
            ))}
        </ul>
      </section>

      <div className="dashboard-actions">
        <Link to="/groups" className="btn-ghost">
          Back to groups
        </Link>
      </div>
    </div>
  );
}

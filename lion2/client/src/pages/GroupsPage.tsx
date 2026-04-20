import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

type Group = {
  _id: string;
  name: string;
  description?: string;
  monthlyContributionAmount: number;
  payoutDayOfMonth: number;
  startDate: string;
};

export function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/groups')
      .then((res) => setGroups(res.data.groups || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading your groups…</div>;
  if (error) return <div className="alert-error">{error}</div>;

  return (
    <div className="page">
      <h1 className="page-title">My Groups</h1>
      <p className="page-subtitle">Select a group to view its dashboard or create a new one.</p>
      <div className="card-list">
        {groups.length === 0 ? (
          <p className="empty-state">
            You have no groups yet.{' '}
            <Link to="/groups/new">Create your first savings group</Link>.
          </p>
        ) : (
          groups.map((g) => (
            <Link key={g._id} to={`/groups/${g._id}`} className="card card-link">
              <h3>{g.name}</h3>
              {g.description && <p className="card-desc">{g.description}</p>}
              <p className="card-meta">
                {g.monthlyContributionAmount} / month · Payout day: {g.payoutDayOfMonth}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

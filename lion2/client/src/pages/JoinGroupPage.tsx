import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function JoinGroupPage() {
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(`/groups/${groupId.trim()}/join`);
      navigate(`/groups/${groupId.trim()}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page form-page">
      <h1 className="page-title">Join a group</h1>
      <p className="page-subtitle">Enter the group ID shared by the group owner.</p>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Group ID</span>
          <input
            type="text"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            placeholder="e.g. 507f1f77bcf86cd799439011"
            required
          />
        </label>
        {error && <div className="alert-error">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Joining…' : 'Join group'}
        </button>
      </form>
    </div>
  );
}

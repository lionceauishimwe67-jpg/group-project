import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export function CreateGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyContributionAmount, setMonthlyContributionAmount] = useState('');
  const [payoutDayOfMonth, setPayoutDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/groups', {
        name,
        description: description || undefined,
        monthlyContributionAmount: Number(monthlyContributionAmount),
        payoutDayOfMonth: Number(payoutDayOfMonth),
        startDate: startDate || new Date().toISOString().slice(0, 10),
      });
      navigate(`/groups/${res.data.group._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page form-page">
      <h1 className="page-title">Create savings group</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Group name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </label>
        <label className="field">
          <span>Monthly contribution amount</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyContributionAmount}
            onChange={(e) => setMonthlyContributionAmount(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Payout day of month (1–28)</span>
          <input
            type="number"
            min="1"
            max="28"
            value={payoutDayOfMonth}
            onChange={(e) => setPayoutDayOfMonth(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Start date</span>
          <input
            type="date"
            value={startDate || today}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        {error && <div className="alert-error">{error}</div>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create group'}
        </button>
      </form>
    </div>
  );
}

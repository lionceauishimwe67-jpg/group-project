import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TeacherLogin = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verify2FA } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(userId, password);
    
    if (result.require2FA) {
      setRequire2FA(true);
    } else if (result.success) {
      const user = result.user;
      if (user.role === 'teacher') navigate('/teacher-portal');
    } else {
      setError(result.message || 'Login failed');
    }
    
    setLoading(false);
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await verify2FA(twoFactorCode);
    
    if (result.success) {
      const user = result.user;
      if (user.role === 'teacher') navigate('/teacher-portal');
    } else {
      setError('Invalid 2FA code');
    }
    
    setLoading(false);
  };

  return (
    <div className="student-login-page">
      <div className="login-container">
        <div className="login-header">
          <BookOpen className="login-icon" size={48} />
          <h1>Teacher Portal</h1>
          <p>Lycée du Muhura - Staff Login</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!require2FA ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <User size={16} />
                User ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your User ID"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Teacher'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="login-form">
            <div className="form-group">
              <label>
                <Lock size={16} />
                Two-Factor Authentication Code
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}

        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>User ID: teacher1</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;

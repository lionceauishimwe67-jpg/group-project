import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  GraduationCap, 
  User, 
  Users, 
  Lock, 
  BookOpen,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import './UnifiedLogin.css';

function UnifiedLogin() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, verify2FA } = useAuth();

  const roles = [
    { id: 'student', name: 'Student', icon: GraduationCap, color: '#3b82f6', description: 'Access grades, courses, attendance' },
    { id: 'teacher', name: 'Teacher', icon: BookOpen, color: '#10b981', description: 'Manage classes, grades, timetable' },
    { id: 'admin', name: 'Admin', icon: Shield, color: '#8b5cf6', description: 'Full system administration' },
    { id: 'parent', name: 'Parent', icon: Users, color: '#f59e0b', description: 'Monitor child progress' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(userId, password);
    
    if (result.require2FA) {
      setRequire2FA(true);
    } else if (result.success) {
      // Redirect based on role
      const user = result.user;
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher-portal');
      else if (user.role === 'student') navigate('/student-portal');
      else if (user.role === 'parent') navigate('/parent');
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
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'teacher') navigate('/teacher-portal');
      else if (user.role === 'student') navigate('/student-portal');
      else if (user.role === 'parent') navigate('/parent');
    } else {
      setError('Invalid 2FA code');
    }
    
    setLoading(false);
  };

  const selectedRoleConfig = roles.find(r => r.id === selectedRole);

  return (
    <div className="unified-login-page">
      <div className="login-background">
        <div className="login-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="school-logo">
              <GraduationCap size={48} />
            </div>
            <h1>Lycée du Muhura</h1>
            <p className="subtitle">School Management System</p>
          </div>

          {!require2FA ? (
            <>
              {/* Role Selection */}
              <div className="role-selector">
                {roles.map(role => (
                  <button
                    key={role.id}
                    className={`role-tab ${selectedRole === role.id ? 'active' : ''}`}
                    onClick={() => setSelectedRole(role.id)}
                    style={selectedRole === role.id ? { borderColor: role.color } : {}}
                  >
                    <div className="role-icon" style={{ color: selectedRole === role.id ? role.color : '#64748b' }}>
                      <role.icon size={24} />
                    </div>
                    <div className="role-info">
                      <span className="role-name">{role.name}</span>
                      <span className="role-desc">{role.description}</span>
                    </div>
                    <ChevronRight 
                      size={20} 
                      className="role-arrow" 
                      style={{ color: selectedRole === role.id ? role.color : '#cbd5e1' }}
                    />
                  </button>
                ))}
              </div>

              {/* Login Form */}
              <div className="login-form-section">
                <div className="form-header">
                  <div className="selected-role-badge" style={{ background: selectedRoleConfig.color }}>
                    <selectedRoleConfig.icon size={20} />
                    <span>{selectedRoleConfig.name} Login</span>
                  </div>
                </div>

                {error && (
                  <div className="error-banner">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label>
                      <User size={16} />
                      {selectedRoleConfig.name} ID
                    </label>
                    <input
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder={`Enter your ${selectedRoleConfig.name.toLowerCase()} ID`}
                      required
                      autoComplete="username"
                      style={{ borderColor: selectedRoleConfig.color }}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Lock size={16} />
                      Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        style={{ borderColor: selectedRoleConfig.color }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="login-btn"
                    disabled={loading}
                    style={{ background: selectedRoleConfig.color }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login as {selectedRoleConfig.name}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* Demo Credentials */}
                <div className="demo-credentials">
                  <p className="demo-title">Demo Credentials</p>
                  <div className="demo-grid">
                    <div key="id" className="demo-item">
                      <span className="demo-label">ID:</span>
                      <span className="demo-value">{selectedRole === 'student' ? 'STU001' : selectedRole === 'teacher' ? 'teacher1' : selectedRole === 'admin' ? 'admin' : 'parent1'}</span>
                    </div>
                    <div key="password" className="demo-item">
                      <span className="demo-label">Password:</span>
                      <span className="demo-value">password123</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* 2FA Form */
            <div className="login-form-section">
              <div className="form-header">
                <div className="selected-role-badge" style={{ background: selectedRoleConfig.color }}>
                  <Shield size={20} />
                  <span>Two-Factor Authentication</span>
                </div>
              </div>

              {error && (
                <div className="error-banner">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handle2FASubmit} className="login-form">
                <div className="form-group">
                  <label>
                    <Shield size={16} />
                    Authentication Code
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                    style={{ borderColor: selectedRoleConfig.color }}
                  />
                  <p className="input-hint">Enter the code from your authenticator app</p>
                </div>

                <button 
                  type="submit" 
                  className="login-btn"
                  disabled={loading}
                  style={{ background: selectedRoleConfig.color }}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Login
                      <CheckCircle size={18} />
                    </>
                  )}
                </button>
              </form>

              <button 
                onClick={() => {
                  setRequire2FA(false);
                  setTwoFactorCode('');
                }}
                className="back-btn"
              >
                Back to Login
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p>Need help? Contact <a href="#">IT Support</a></p>
            <p>© 2024 Lycée du Muhura. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnifiedLogin;

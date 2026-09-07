import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const res = await api.post('/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
        });
        login(res.data.token, res.data.user);
        navigate('/memos');
      } else {
        const res = await api.post('/auth/login', {
          email: email.trim(),
          password,
        });
        login(res.data.token, res.data.user);
        navigate('/memos');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-icon">
            <ShieldCheck size={24} />
          </div>
          <h1 className="login-title">AuditVault</h1>
          <p className="login-subtitle">
            Secure memo management with accountable access logging
          </p>
        </div>

        {/* Tab switch between Sign In and Register */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: 'none',
              borderBottom: !isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '0.625rem',
              background: 'transparent',
              border: 'none',
              borderBottom: isRegister ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div
            className="notice-box"
            style={{
              borderColor: 'var(--status-danger-border)',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} className="notice-box-icon" />
            <div>
              <div className="notice-box-title" style={{ color: 'var(--status-danger)' }}>
                Authentication Error
              </div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="login-name">
                Full Name
              </label>
              <div className="input-wrapper">
                <User size={16} className="input-icon-left" />
                <input
                  id="login-name"
                  type="text"
                  className="form-input has-icon-left"
                  placeholder="e.g. Alice Auditor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegister}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon-left" />
              <input
                id="login-email"
                type="email"
                className="form-input has-icon-left"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              {isRegister && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Min 6 characters
                </span>
              )}
            </div>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon-left" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-icon-left has-icon-right"
                placeholder={isRegister ? 'Create secure password' : 'Enter account password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                disabled={loading}
                minLength={6}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account & Sign In' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer-info">
          AuditVault &bull; Enterprise Access Governance &bull; JWT Authenticated
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Info } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // UI-only shell interaction — no backend call, no token storage
    setSubmitted(true);
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

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email or Username
            </label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon-left" />
              <input
                id="login-email"
                type="text"
                className="form-input has-icon-left"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
            </div>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon-left" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input has-icon-left has-icon-right"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <button type="submit" className="btn btn-primary login-submit-btn">
            Sign In
          </button>
        </form>

        {submitted && (
          <div className="notice-box" style={{ marginTop: '1rem' }}>
            <Info size={16} className="notice-box-icon" />
            <div>
              <div className="notice-box-title">Phase 1 UI Shell</div>
              <div>
                Authentication logic is scheduled for Phase 2. Use the link below to explore the application UI.
              </div>
            </div>
          </div>
        )}

        <div className="login-demo-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            <span>Explore Dashboard UI</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="login-footer-info">
          AuditVault &bull; Enterprise Access Governance &bull; Phase 1 UI Foundation
        </div>
      </div>
    </div>
  );
};

export default Login;

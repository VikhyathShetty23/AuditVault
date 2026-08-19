import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Server, Database, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const Home = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="home-page">
      <div className="card">
        <h1 className="card-title">AuditVault Foundation</h1>
        <p className="card-subtitle">
          Secure memo management with accountable access logging. Project foundation initialized.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>System Health Verification</h2>
          <button 
            onClick={checkHealth} 
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Check Connection
          </button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Checking server status...</p>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-danger)' }}>
            <XCircle size={18} />
            <span>Backend Server Unreachable: {error}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Server size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>API Service: <strong>{health?.service}</strong></span>
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> {health?.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Database size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>MongoDB Status: <strong>{health?.database}</strong></span>
              <span className={`badge ${health?.database === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                {health?.database === 'connected' ? <CheckCircle2 size={12} /> : null}
                {health?.database}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Last Verified: {new Date(health?.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;

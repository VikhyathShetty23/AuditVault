import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
  FileText,
  History,
  ShieldCheck,
  Plus,
  ArrowRight,
  Lock,
} from 'lucide-react';

const Dashboard = () => {
  const [recentMemos, setRecentMemos] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingMemos, setLoadingMemos] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchMemos = async () => {
      try {
        const res = await api.get('/memos');
        // Show at most 5 most recent
        setRecentMemos((res.data || []).slice(0, 5));
      } catch {
        setRecentMemos([]);
      } finally {
        setLoadingMemos(false);
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit');
        // Show at most 5 most recent
        setRecentLogs((res.data || []).slice(0, 5));
      } catch {
        setRecentLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchMemos();
    fetchLogs();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
  };

  const actionBadgeClass = (action) => {
    switch (action) {
      case 'CREATE': return 'badge badge-create';
      case 'READ':   return 'badge badge-read';
      case 'UPDATE': return 'badge badge-update';
      case 'DELETE': return 'badge badge-delete';
      default:       return 'badge';
    }
  };

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Security & System Dashboard"
        subtitle="Central monitoring console for memo lifecycle management and automated audit logging."
        actions={
          <Link to="/memos" className="btn btn-primary">
            <Plus size={15} />
            <span>New Memo</span>
          </Link>
        }
      />

      {/* Informational Architecture Banner */}
      <div className="notice-box">
        <ShieldCheck size={18} className="notice-box-icon" />
        <div>
          <div className="notice-box-title">AuditVault Architecture Overview</div>
          <div>
            Every memo transaction (CREATE, READ, UPDATE, DELETE) automatically triggers audit logging middleware to capture user identity, action type, timestamp, and IP address.
          </div>
        </div>
      </div>

      {/* Structural Overview Cards */}
      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-card-label">Memo Repository</span>
            <FileText size={18} className="overview-card-icon" />
          </div>
          <div className="overview-card-main">
            <span className="overview-card-value">Private Memos</span>
            <span className="overview-card-note">
              Secure text storage with strict ownership isolation and access control.
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-card-label">Audit Engine</span>
            <History size={18} className="overview-card-icon" />
          </div>
          <div className="overview-card-main">
            <span className="overview-card-value">Append-Only Logs</span>
            <span className="overview-card-note">
              Immutable activity ledger recording all lifecycle events without controller duplication.
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="overview-card-header">
            <span className="overview-card-label">Access Governance</span>
            <Lock size={18} className="overview-card-icon" />
          </div>
          <div className="overview-card-main">
            <span className="overview-card-value">Accountability</span>
            <span className="overview-card-note">
              Granular tracking of client IP address, user identity, and operation timestamps.
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Dual Grid: Recent Memos & Recent Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>

        {/* Recent Memos */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                Recent Memos
              </h2>
              <div className="card-subtitle">Recently created or modified documents</div>
            </div>
            <Link to="/memos" className="btn btn-outline btn-sm">
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {loadingMemos ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Loading memos...
            </div>
          ) : recentMemos.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Memos in Repository"
              description="You have not created any memos yet. Newly created memos will appear here."
              action={
                <Link to="/memos" className="btn btn-secondary btn-sm">
                  <Plus size={14} />
                  <span>Go to Memos</span>
                </Link>
              }
            />
          ) : (
            <table className="data-table">
              <tbody>
                {recentMemos.map((memo) => (
                  <tr key={memo._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {memo.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {formatDate(memo.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Audit Activity */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <History size={16} style={{ color: 'var(--status-info)' }} />
                Recent Audit Activity
              </h2>
              <div className="card-subtitle">Chronological ledger of latest security events</div>
            </div>
            <Link to="/audit" className="btn btn-outline btn-sm">
              <span>View Trail</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {loadingLogs ? (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Loading audit logs...
            </div>
          ) : recentLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Audit Records"
              description="No audit events have been logged yet. All CREATE, READ, UPDATE, and DELETE operations will appear here."
              action={
                <Link to="/audit" className="btn btn-secondary btn-sm">
                  <span>View Audit Trail</span>
                </Link>
              }
            />
          ) : (
            <table className="data-table">
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className={actionBadgeClass(log.actionType)}>
                        {log.actionType}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <code>{log.memoId?.toString().slice(-8) || '-'}</code>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

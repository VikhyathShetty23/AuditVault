import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  AlertCircle,
} from 'lucide-react';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/audit');
        setLogs(response.data || []);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
        setError(err.response?.data?.message || 'Failed to load audit logs. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.actionType === actionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (log.memoId && log.memoId.toString().toLowerCase().includes(q)) ||
      (log.userId && log.userId.toString().toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q));
    return matchesAction && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
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
    <div className="audit-trail-page">
      <PageHeader
        title="Audit Trail"
        subtitle="Chronological, append-only security log recording every memo lifecycle event and access attempt."
        actions={
          <div className="badge badge-primary" style={{ padding: '0.4375rem 0.75rem' }}>
            <Lock size={13} />
            <span>Append-Only Ledger</span>
          </div>
        }
      />

      {/* Governance & Integrity Policy Banner */}
      <div className="notice-box">
        <ShieldCheck size={18} className="notice-box-icon" />
        <div>
          <div className="notice-box-title">Audit Log Integrity Policy</div>
          <div>
            Audit records are append-only. Standard application users do not have permissions to modify, update, or delete historical audit entries. All events are captured automatically by backend middleware.
          </div>
        </div>
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
          <AlertCircle size={18} className="notice-box-icon" />
          <div>
            <div className="notice-box-title" style={{ color: 'var(--status-danger)' }}>
              Error Loading Audit Logs
            </div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Audit Filters Bar */}
      <div className="filter-bar">
        <div className="filter-bar-group">
          <div className="input-wrapper filter-input-search">
            <Search size={15} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Search by Memo ID, User ID, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="filter-select"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action type"
            >
              <option value="ALL">All Actions (CREATE, READ, UPDATE, DELETE)</option>
              <option value="CREATE">CREATE only</option>
              <option value="READ">READ only</option>
              <option value="UPDATE">UPDATE only</option>
              <option value="DELETE">DELETE only</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-create">CREATE</span>
          <span className="badge badge-read">READ</span>
          <span className="badge badge-update">UPDATE</span>
          <span className="badge badge-delete">DELETE</span>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Timestamp</th>
                <th style={{ width: '15%' }}>Action</th>
                <th style={{ width: '25%' }}>Memo ID</th>
                <th style={{ width: '20%' }}>User ID</th>
                <th style={{ width: '18%' }}>Origin IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="table-empty-row">
                    <div style={{ color: 'var(--text-muted)' }}>Loading audit logs...</div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty-row">
                    <EmptyState
                      icon={History}
                      title={
                        searchQuery || actionFilter !== 'ALL'
                          ? 'No Matching Audit Records'
                          : 'No Audit Records Found'
                      }
                      description={
                        searchQuery || actionFilter !== 'ALL'
                          ? 'No audit records matched the current filters.'
                          : 'The audit log ledger is currently empty. Whenever a memo is created, accessed, updated, or deleted, an immutable record will appear here.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <span className={actionBadgeClass(log.actionType)}>
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.memoId?.toString() || '-'}
                      </code>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.userId?.toString() || '-'}
                      </code>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredLogs.length > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'record' : 'records'} shown
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditTrail;

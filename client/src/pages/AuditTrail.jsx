import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  Layers,
  Calendar,
} from 'lucide-react';

const AuditTrail = () => {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="audit-trail-page">
      <PageHeader
        title="Audit Trail"
        subtitle="Chronological, append-only security log recording every memo lifecycle event and access attempt."
        badge="Phase 1 UI Shell"
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

      {/* Audit Filters Bar */}
      <div className="filter-bar">
        <div className="filter-bar-group">
          <div className="input-wrapper filter-input-search">
            <Search size={15} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Search by User, Memo ID, or IP..."
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

      {/* Audit Trail Table Shell */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Timestamp</th>
                <th style={{ width: '15%' }}>Action</th>
                <th style={{ width: '25%' }}>Memo Identifier</th>
                <th style={{ width: '20%' }}>User Identity</th>
                <th style={{ width: '18%' }}>Origin IP Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="table-empty-row">
                  <EmptyState
                    icon={History}
                    title="No Audit Records Found"
                    description="The audit log ledger is currently empty. Whenever a memo is created, accessed, updated, or deleted, an immutable record with user and IP metadata will appear here in reverse chronological order."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;

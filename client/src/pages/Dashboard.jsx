import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  FileText,
  History,
  ShieldCheck,
  Plus,
  ArrowRight,
  Database,
  Lock,
  Layers,
} from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <PageHeader
        title="Security & System Dashboard"
        subtitle="Central monitoring console for memo lifecycle management and automated audit logging."
        badge="Phase 1 UI Shell"
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

      {/* Structural Overview Cards (No fabricated metrics) */}
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
        
        {/* Recent Memos Container */}
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

          <EmptyState
            icon={FileText}
            title="No Memos in Repository"
            description="You have not created any memos yet. Newly created memos and their latest modification records will be displayed here."
            action={
              <Link to="/memos" className="btn btn-secondary btn-sm">
                <Plus size={14} />
                <span>Go to Memos</span>
              </Link>
            }
          />
        </div>

        {/* Recent Audit Activity Container */}
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

          <EmptyState
            icon={History}
            title="No Audit Records"
            description="No audit events have been logged yet. All CREATE, READ, UPDATE, and DELETE operations will automatically generate chronological records here."
            action={
              <Link to="/audit" className="btn btn-secondary btn-sm">
                <span>View Audit Trail</span>
              </Link>
            }
          />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

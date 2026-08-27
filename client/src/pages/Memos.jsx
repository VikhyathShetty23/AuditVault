import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  History,
  X,
  Shield,
  Info,
} from 'lucide-react';

const Memos = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState('newest');

  return (
    <div className="memos-page">
      <PageHeader
        title="Memos"
        subtitle="Manage and organize confidential text documents with automatic audit tracking."
        badge="Phase 1 UI Shell"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} />
            <span>New Memo</span>
          </button>
        }
      />

      {/* Filter and Search Toolbar */}
      <div className="filter-bar">
        <div className="filter-bar-group">
          <div className="input-wrapper filter-input-search">
            <Search size={15} className="input-icon-left" />
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Search memos by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              className="filter-select"
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              aria-label="Sort memos"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          0 memos found
        </div>
      </div>

      {/* Memo Table Shell */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Title / Subject</th>
                <th>Owner</th>
                <th>Created</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="table-empty-row">
                  <EmptyState
                    icon={FileText}
                    title="No Memos Available"
                    description="Your memo repository is currently empty. Click 'New Memo' to create your first confidential document."
                    action={
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus size={14} />
                        <span>Create Memo</span>
                      </button>
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Memo Modal UI Shell (Preview/Foundation) */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              margin: 0,
              backgroundColor: 'var(--bg-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                  Create New Memo
                </h2>
                <div className="card-subtitle">
                  Phase 1 Form UI Preview &mdash; Non-persisted shell
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon-only"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="notice-box" style={{ marginBottom: '1rem' }}>
              <Info size={16} className="notice-box-icon" />
              <div>
                <div className="notice-box-title">Frontend Shell Preview</div>
                <div>
                  This modal demonstrates the memo creation UI structure. Memo CRUD and backend persistence will be activated in Phase 3.
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowCreateModal(false); }}>
              <div className="form-group">
                <label className="form-label" htmlFor="memo-modal-title">
                  Memo Title
                </label>
                <input
                  id="memo-modal-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Infrastructure Security Review Q3"
                  defaultValue=""
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="memo-modal-content">
                  Memo Content
                </label>
                <textarea
                  id="memo-modal-content"
                  className="form-textarea"
                  rows={5}
                  placeholder="Enter confidential memo details, findings, or notes..."
                  defaultValue=""
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Memos;

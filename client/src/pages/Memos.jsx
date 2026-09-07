import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

const Memos = () => {
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal and Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Edit memo modal state
  const [editingMemo, setEditingMemo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState(null);

  // View memo modal state
  const [viewingMemo, setViewingMemo] = useState(null);

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState('newest');

  // Fetch all memos from backend
  const fetchMemos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/memos');
      setMemos(response.data || []);
    } catch (err) {
      console.error('Failed to fetch memos:', err);
      setError(err.response?.data?.message || 'Failed to load memos. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemos();
  }, []);

  // Handle memo creation
  const handleCreateMemo = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Memo title is required.');
      return;
    }
    if (!content.trim()) {
      setFormError('Memo content is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const response = await api.post('/memos', {
        title: title.trim(),
        content: content.trim(),
      });

      // Prepend newly created memo to list
      setMemos((prev) => [response.data, ...prev]);
      setTitle('');
      setContent('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating memo:', err);
      setFormError(err.response?.data?.message || 'Failed to create memo. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle memo deletion
  const handleDeleteMemo = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this memo?')) {
      return;
    }

    try {
      await api.delete(`/memos/${id}`);
      setMemos((prev) => prev.filter((m) => m._id !== id));
      if (viewingMemo?._id === id) {
        setViewingMemo(null);
      }
    } catch (err) {
      console.error('Error deleting memo:', err);
      alert(err.response?.data?.message || 'Failed to delete memo.');
    }
  };

  // Open memo edit modal
  const openEditModal = (memo, e) => {
    if (e) e.stopPropagation();
    setEditingMemo(memo);
    setEditTitle(memo.title || '');
    setEditContent(memo.content || '');
    setEditFormError(null);
  };

  // Handle memo update
  const handleEditMemo = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditFormError('Memo title is required.');
      return;
    }
    if (!editContent.trim()) {
      setEditFormError('Memo content is required.');
      return;
    }

    try {
      setEditSubmitting(true);
      setEditFormError(null);
      const response = await api.put(`/memos/${editingMemo._id}`, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      setMemos((prev) =>
        prev.map((m) => (m._id === editingMemo._id ? response.data : m))
      );
      if (viewingMemo?._id === editingMemo._id) {
        setViewingMemo(response.data);
      }
      setEditingMemo(null);
    } catch (err) {
      console.error('Error updating memo:', err);
      setEditFormError(err.response?.data?.message || 'Failed to update memo. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filter & sort logic
  const filteredMemos = memos
    .filter((memo) => {
      const q = searchQuery.toLowerCase();
      const memoTitle = memo.title?.toLowerCase() || '';
      const memoContent = memo.content?.toLowerCase() || '';
      return memoTitle.includes(q) || memoContent.includes(q);
    })
    .sort((a, b) => {
      if (filterSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (filterSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (filterSort === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };

  return (
    <div className="memos-page">
      <PageHeader
        title="Memos"
        subtitle="Manage and organize confidential text documents with automatic audit tracking."
        badge="Active"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormError(null);
              setShowCreateModal(true);
            }}
          >
            <Plus size={15} />
            <span>New Memo</span>
          </button>
        }
      />

      {error && (
        <div className="notice-box" style={{ borderColor: 'var(--status-danger-border)', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <AlertCircle size={18} className="notice-box-icon" />
            <div>
              <div className="notice-box-title" style={{ color: 'var(--status-danger)' }}>Error Loading Memos</div>
              <div>{error}</div>
            </div>
          </div>
          {error.toLowerCase().includes('token') || error.toLowerCase().includes('auth') ? (
            <Link to="/login" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              Sign In
            </Link>
          ) : null}
        </div>
      )}

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
          {filteredMemos.length} {filteredMemos.length === 1 ? 'memo' : 'memos'} found
        </div>
      </div>

      {/* Memo Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Title / Subject</th>
                <th>Created</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="table-empty-row">
                    <div style={{ color: 'var(--text-muted)' }}>Loading memos...</div>
                  </td>
                </tr>
              ) : filteredMemos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty-row">
                    <EmptyState
                      icon={FileText}
                      title={searchQuery ? 'No Matching Memos' : 'No Memos Available'}
                      description={
                        searchQuery
                          ? `No memos matched the search query "${searchQuery}".`
                          : "Your memo repository is currently empty. Click 'New Memo' to create your first confidential document."
                      }
                      action={
                        !searchQuery && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setFormError(null);
                              setShowCreateModal(true);
                            }}
                          >
                            <Plus size={14} />
                            <span>Create Memo</span>
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredMemos.map((memo) => (
                  <tr
                    key={memo._id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setViewingMemo(memo)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {memo.title}
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(memo.createdAt)}</td>
                    <td>{formatDate(memo.updatedAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                        <button
                          className="btn btn-outline btn-sm btn-icon-only"
                          title="View Memo"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingMemo(memo);
                          }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm btn-icon-only"
                          title="Edit Memo"
                          onClick={(e) => openEditModal(memo, e)}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm btn-icon-only"
                          title="Delete Memo"
                          style={{ color: 'var(--status-danger)' }}
                          onClick={(e) => handleDeleteMemo(memo._id, e)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Memo Modal */}
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
          onClick={() => !submitting && setShowCreateModal(false)}
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
                  Store a confidential memo with automatic audit logging
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon-only"
                disabled={submitting}
                onClick={() => setShowCreateModal(false)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="notice-box" style={{ borderColor: 'var(--status-danger-border)', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', marginBottom: '1rem' }}>
                <AlertCircle size={16} className="notice-box-icon" />
                <div>
                  <div className="notice-box-title" style={{ color: 'var(--status-danger)' }}>Validation Error</div>
                  <div>{formError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateMemo}>
              <div className="form-group">
                <label className="form-label" htmlFor="memo-modal-title">
                  Memo Title
                </label>
                <input
                  id="memo-modal-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Infrastructure Security Review Q3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                  required
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
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={submitting}
                  required
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
                  disabled={submitting}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Memo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Memo Details Modal */}
      {viewingMemo && (
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
          onClick={() => setViewingMemo(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '580px',
              margin: 0,
              backgroundColor: 'var(--bg-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
                  {viewingMemo.title}
                </h2>
                <div className="card-subtitle">
                  Created {formatDate(viewingMemo.createdAt)} &bull; Modified {formatDate(viewingMemo.updatedAt)}
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon-only"
                onClick={() => setViewingMemo(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {viewingMemo.content}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Memo ID: <code>{viewingMemo._id}</code>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const m = viewingMemo;
                    setViewingMemo(null);
                    openEditModal(m);
                  }}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setViewingMemo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Memo Modal */}
      {editingMemo && (
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
          onClick={() => !editSubmitting && setEditingMemo(null)}
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
                  <Edit2 size={18} style={{ color: 'var(--accent-primary)' }} />
                  Edit Memo
                </h2>
                <div className="card-subtitle">
                  Update memo details with automatic audit log tracking
                </div>
              </div>
              <button
                className="btn btn-outline btn-icon-only"
                disabled={editSubmitting}
                onClick={() => setEditingMemo(null)}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            {editFormError && (
              <div className="notice-box" style={{ borderColor: 'var(--status-danger-border)', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', marginBottom: '1rem' }}>
                <AlertCircle size={16} className="notice-box-icon" />
                <div>
                  <div className="notice-box-title" style={{ color: 'var(--status-danger)' }}>Validation Error</div>
                  <div>{editFormError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleEditMemo}>
              <div className="form-group">
                <label className="form-label" htmlFor="memo-edit-title">
                  Memo Title
                </label>
                <input
                  id="memo-edit-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Infrastructure Security Review Q3"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={editSubmitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="memo-edit-content">
                  Memo Content
                </label>
                <textarea
                  id="memo-edit-content"
                  className="form-textarea"
                  rows={5}
                  placeholder="Enter confidential memo details, findings, or notes..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={editSubmitting}
                  required
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
                  disabled={editSubmitting}
                  onClick={() => setEditingMemo(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
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

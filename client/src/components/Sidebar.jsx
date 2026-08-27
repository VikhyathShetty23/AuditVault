import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  History,
  X,
  Lock,
  ExternalLink,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Memos',
      path: '/memos',
      icon: FileText,
    },
    {
      label: 'Audit Trail',
      path: '/audit',
      icon: History,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <ShieldCheck size={18} />
            </div>
            <span>AuditVault</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <Icon size={18} className="nav-link-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="nav-section-title" style={{ marginTop: '1rem' }}>
            Account & Access
          </div>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <Lock size={18} className="nav-link-icon" />
            <span>Login UI Shell</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="phase-pill">
            <ShieldCheck size={12} />
            Phase 1 Foundation
          </div>
          <div className="sidebar-meta">
            Audit logging middleware and access accountability system.
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

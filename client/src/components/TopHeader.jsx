import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, Shield, UserCheck, Lock } from 'lucide-react';

const TopHeader = ({ onMenuToggle }) => {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/':
      case '/dashboard':
        return 'System Dashboard';
      case '/memos':
        return 'Memo Management';
      case '/audit':
        return 'Audit Trail & Compliance';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>
        <span className="breadcrumb-label">
          AuditVault &rsaquo; {getPageTitle(location.pathname)}
        </span>
      </div>

      <div className="header-right">
        <div className="user-badge" title="Phase 1 UI Session Indicator">
          <span className="user-indicator-dot" />
          <UserCheck size={14} />
          <span>Security Auditor</span>
        </div>

        <Link
          to="/login"
          className="btn btn-outline btn-sm"
          title="Inspect Login UI Shell"
        >
          <Lock size={13} />
          <span>Login UI</span>
        </Link>
      </div>
    </header>
  );
};

export default TopHeader;

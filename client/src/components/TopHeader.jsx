import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, UserCheck, UserX, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopHeader = ({ onMenuToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        {isAuthenticated ? (
          <>
            <div className="user-badge" title="Authenticated User Session">
              <span className="user-indicator-dot" />
              <UserCheck size={14} />
              <span>{user?.name || user?.email || 'Auditor'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <>
            <div className="user-badge" style={{ opacity: 0.7 }} title="Not Authenticated">
              <UserX size={14} />
              <span>Guest</span>
            </div>

            <Link
              to="/login"
              className="btn btn-primary btn-sm"
              title="Sign In / Register"
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default TopHeader;

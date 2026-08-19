import React from 'react';
import { ShieldCheck, FileText, Activity } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="brand">
        <ShieldCheck className="brand-icon" size={24} />
        <span>AuditVault</span>
      </div>
      <nav className="nav-links">
        <span className="nav-item active">
          <FileText size={16} />
          Memos
        </span>
        <span className="nav-item">
          <Activity size={16} />
          Audit Trail
        </span>
      </nav>
    </header>
  );
};

export default Navbar;

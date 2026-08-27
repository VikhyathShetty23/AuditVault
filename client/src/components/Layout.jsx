import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      
      <div className="main-wrapper">
        <TopHeader onMenuToggle={handleToggleSidebar} />
        <main className="content-viewport">
          {children}
        </main>
        <footer className="app-footer">
          <span>AuditVault &mdash; Information Security &amp; Audit Logging Architecture</span>
          <span>Phase 1 Frontend Foundation</span>
        </footer>
      </div>
    </div>
  );
};

export default Layout;

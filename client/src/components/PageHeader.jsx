import React from 'react';

const PageHeader = ({ title, subtitle, badge, actions }) => {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <div className="page-title-row">
          <h1 className="page-title">{title}</h1>
          {badge && <span className="badge badge-primary">{badge}</span>}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;

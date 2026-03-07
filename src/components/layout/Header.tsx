import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdLogout } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  isCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return { title: 'Dashboard', breadcrumb: ['Home', 'Dashboard'] };
      case '/api-credentials':
        return { title: 'WhatsApp Settings', breadcrumb: ['Home', 'WhatsApp Settings'] };
      case '/campaigns':
        return { title: 'Campaigns', breadcrumb: ['Home', 'Campaigns'] };
      case '/messages':
        return { title: 'Messages', breadcrumb: ['Home', 'Messages'] };
      case '/users':
        return { title: 'Users/Admins', breadcrumb: ['Home', 'Users/Admins'] };
      case '/settings':
        return { title: 'Settings', breadcrumb: ['Home', 'Settings'] };
      default:
        return { title: 'Dashboard', breadcrumb: ['Home', 'Dashboard'] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className={`header ${isCollapsed ? 'expanded' : ''}`}>
      <div className="header-content">
        {/* Page Title and Breadcrumb */}
        <div className="header-left">
          <h1 className="page-title">{pageInfo.title}</h1>
          <div className="breadcrumb">
            {pageInfo.breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <span className={`breadcrumb-item ${index === pageInfo.breadcrumb.length - 1 ? 'active' : ''}`}>
                  {item}
                </span>
                {index < pageInfo.breadcrumb.length - 1 && (
                  <span className="breadcrumb-separator">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Header Actions */}
        <div className="header-right">
          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-value">24</span>
              <span className="stat-label">Messages Today</span>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="user-section">
            <div className="user-avatar">
              <div className="avatar-circle">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || user?.email}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <MdLogout />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

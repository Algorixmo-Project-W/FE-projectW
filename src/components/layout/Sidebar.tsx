import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdSettings, 
  MdCampaign, 
  MdMessage, 
  MdPeople, 
  MdBuild,
  MdChevronLeft,
  MdChevronRight,
  MdLogout
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: MdDashboard,
      path: '/dashboard'
    },
    {
      id: 'api-credentials',
      label: 'WhatsApp Settings',
      icon: MdSettings,
      path: '/api-credentials'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: MdCampaign,
      path: '/campaigns'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MdMessage,
      path: '/messages'
    },
    {
      id: 'users',
      label: 'Users/Admins',
      icon: MdPeople,
      path: '/users'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: MdBuild,
      path: '/settings'
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">W</div>
          {!isCollapsed && <span className="logo-text">Project W</span>}
        </div>
        <button className="toggle-btn" onClick={onToggle}>
          {isCollapsed ? <MdChevronRight /> : <MdChevronLeft />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
            return (
              <li key={item.id} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Link to={item.path} className="nav-link">
                  <span className="nav-icon"><item.icon /></span>
                  {!isCollapsed && <span className="nav-text">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="sidebar-footer">
        <div className="profile-section">
          <div className="profile-avatar">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="profile-info">
              <span className="profile-name">{user?.name || user?.email || 'User'}</span>
              <button className="logout-btn" onClick={handleLogout}>
                <MdLogout /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

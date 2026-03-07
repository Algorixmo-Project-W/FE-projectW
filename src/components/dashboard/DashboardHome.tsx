import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdMessage, 
  MdCampaign, 
  MdSpeed, 
  MdPeople,
  MdCheckCircle,
  MdPhone,
  MdWarning,
  MdAdd,
  MdSettings,
  MdBarChart,
  MdRefresh
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { getCampaignsByUserId, getMessagesByUserId, getAllUsers } from '../../services/api';
import type { Campaign, Message } from '../../types/api.types';

interface DashboardStats {
  totalMessages: number;
  activeCampaigns: number;
  successRate: number;
  totalUsers: number;
}

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMessages: 0,
    activeCampaigns: 0,
    successRate: 0,
    totalUsers: 0
  });
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [messagesResult, campaignsResult, usersResult] = await Promise.all([
        getMessagesByUserId(user.id),
        getCampaignsByUserId(user.id),
        getAllUsers()
      ]);

      let messages: Message[] = [];
      let campaigns: Campaign[] = [];
      let totalUsers = 0;

      if (messagesResult.success && messagesResult.data) {
        messages = messagesResult.data;
        setRecentMessages(messages.slice(0, 5)); // Get 5 most recent
      }

      if (campaignsResult.success && campaignsResult.data) {
        campaigns = campaignsResult.data;
      }

      if (usersResult.success && usersResult.data) {
        totalUsers = usersResult.data.length;
      }

      // Calculate stats
      const totalMessages = messages.length;
      const activeCampaigns = campaigns.filter(c => c.isActive).length;
      const successfulReplies = messages.filter(m => m.replyStatus === 'sent').length;
      const successRate = totalMessages > 0 ? Math.round((successfulReplies / totalMessages) * 100) : 100;

      setStats({
        totalMessages,
        activeCampaigns,
        successRate,
        totalUsers
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div>
          <h2>Welcome to Project W</h2>
          <p>Manage your WhatsApp campaigns and monitor customer interactions</p>
        </div>
        <button className="btn secondary" onClick={fetchDashboardData} disabled={loading}>
          <MdRefresh className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><MdMessage /></div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.totalMessages}</h3>
            <p>Total Messages</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon"><MdCampaign /></div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.activeCampaigns}</h3>
            <p>Active Campaigns</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><MdSpeed /></div>
          <div className="stat-content">
            <h3>{loading ? '...' : `${stats.successRate}%`}</h3>
            <p>Success Rate</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon"><MdPeople /></div>
          <div className="stat-content">
            <h3>{loading ? '...' : stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="section-header">
          <h3>Recent Messages</h3>
          <button className="view-all-btn" onClick={() => navigate('/messages')}>View All</button>
        </div>
        
        <div className="activity-list">
          {loading ? (
            <div className="activity-item">
              <div className="activity-content">
                <p>Loading...</p>
              </div>
            </div>
          ) : recentMessages.length === 0 ? (
            <div className="activity-item">
              <div className="activity-content">
                <p>No messages yet</p>
              </div>
            </div>
          ) : (
            recentMessages.map(msg => (
              <div key={msg.id} className="activity-item">
                <div className={`activity-icon ${msg.replyStatus === 'sent' ? 'success' : msg.replyStatus === 'failed' ? 'warning' : 'primary'}`}>
                  {msg.replyStatus === 'sent' ? <MdCheckCircle /> : msg.replyStatus === 'failed' ? <MdWarning /> : <MdPhone />}
                </div>
                <div className="activity-content">
                  <p><strong>{msg.senderNumber}</strong> - {msg.messageContent.substring(0, 50)}{msg.messageContent.length > 50 ? '...' : ''}</p>
                  <span className="activity-time">{formatTimeAgo(msg.receivedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={() => navigate('/campaigns')}>
            <span className="btn-icon"><MdAdd /></span>
            Create Campaign
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/whatsapp-settings')}>
            <span className="btn-icon"><MdSettings /></span>
            Setup WhatsApp
          </button>
          <button className="action-btn secondary" onClick={() => navigate('/messages')}>
            <span className="btn-icon"><MdBarChart /></span>
            View Messages
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

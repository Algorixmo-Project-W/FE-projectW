import React, { useState, useEffect } from 'react';
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdCampaign,
  MdMessage,
  MdClose,
  MdSave,
  MdRefresh
} from 'react-icons/md';
import { getCampaignsByUserId, createCampaign, updateCampaign, deleteCampaign } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Campaign } from '../../types/api.types';

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fixedReply: '',
    isActive: false
  });

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await getCampaignsByUserId(user.id);
    if (result.success && result.data) {
      setCampaigns(result.data);
    } else {
      setError(result.message || 'Failed to fetch campaigns');
    }
    setLoading(false);
  };

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        fixedReply: campaign.fixedReply,
        isActive: campaign.isActive
      });
    } else {
      setEditingCampaign(null);
      setFormData({ name: '', fixedReply: '', isActive: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setFormData({ name: '', fixedReply: '', isActive: false });
  };

  const handleSaveCampaign = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingCampaign) {
        const result = await updateCampaign(editingCampaign.id, {
          name: formData.name,
          fixedReply: formData.fixedReply,
          isActive: formData.isActive
        });
        if (result.success) {
          await fetchCampaigns();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to update campaign');
        }
      } else {
        const result = await createCampaign({
          userId: user.id,
          name: formData.name,
          fixedReply: formData.fixedReply,
          isActive: formData.isActive
        });
        if (result.success) {
          await fetchCampaigns();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to create campaign');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const result = await deleteCampaign(id);
      if (result.success) {
        await fetchCampaigns();
      } else {
        setError(result.message || 'Failed to delete campaign');
      }
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const result = await updateCampaign(campaign.id, {
      isActive: !campaign.isActive
    });
    if (result.success) {
      await fetchCampaigns();
    } else {
      setError(result.message || 'Failed to update campaign status');
    }
  };

  return (
    <div className="campaigns-page">
      {/* Page Header */}
      <div className="campaigns-header">
        <div className="header-content">
          <div>
            <h1>Campaigns</h1>
            <p>Create and manage your WhatsApp auto-reply campaigns</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={fetchCampaigns} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="campaigns-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <MdCampaign />
          </div>
          <div className="stat-info">
            <h3>{campaigns.length}</h3>
            <p>Total Campaigns</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon info">
            <MdMessage />
          </div>
          <div className="stat-info">
            <h3>{campaigns.reduce((sum, c) => sum + c.messageCount, 0)}</h3>
            <p>Total Responses Sent</p>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="campaigns-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <MdCampaign className="empty-icon" />
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to start automating WhatsApp responses</p>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Your First Campaign
            </button>
          </div>
        ) : (
          campaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <div className="campaign-title">
                  <h3>{campaign.name}</h3>
                  <span className={`status-badge ${campaign.isActive ? 'active' : 'inactive'}`}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="campaign-actions">
                  <button 
                    className="icon-btn" 
                    onClick={() => handleOpenModal(campaign)}
                    title="Edit campaign"
                  >
                    <MdEdit />
                  </button>
                  <button 
                    className="icon-btn danger" 
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    title="Delete campaign"
                  >
                    <MdDelete />
                  </button>
                </div>
              </div>
              
              <div className="campaign-body">
                <div className="reply-preview">
                  <label>Automated Reply:</label>
                  <p>{campaign.fixedReply}</p>
                </div>
                
                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Messages Sent:</span>
                    <span className="meta-value">{campaign.messageCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="campaign-footer">
                <button 
                  className={`toggle-btn ${campaign.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleStatus(campaign)}
                >
                  {campaign.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <MdClose />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="campaignName">Campaign Name *</label>
                <input
                  type="text"
                  id="campaignName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                  className="form-input"
                  required
                />
                <small className="form-help">
                  Give your campaign a descriptive name for easy identification
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="fixedReply">Fixed Automated Reply *</label>
                <textarea
                  id="fixedReply"
                  value={formData.fixedReply}
                  onChange={(e) => setFormData({ ...formData, fixedReply: e.target.value })}
                  placeholder="Enter the message that will be sent automatically..."
                  className="form-textarea"
                  rows={6}
                  required
                />
                <small className="form-help">
                  This message will be sent automatically to customers who message your WhatsApp number
                </small>
                <div className="character-count">
                  {formData.fixedReply.length} characters
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="campaignStatus">Status</label>
                <select
                  id="campaignStatus"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <small className="form-help">
                  ⚠️ Only one campaign can be active at a time. Setting this to active will deactivate all other campaigns.
                </small>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal} disabled={saving}>
                Cancel
              </button>
              <button 
                className="btn primary" 
                onClick={handleSaveCampaign}
                disabled={!formData.name || !formData.fixedReply || saving}
              >
                <MdSave />
                {saving ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

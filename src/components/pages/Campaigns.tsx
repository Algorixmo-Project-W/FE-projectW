import React, { useState, useEffect, useRef } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdCampaign,
  MdMessage,
  MdSave,
  MdRefresh,
  MdImage,
  MdSmartToy,
  MdClose,
  MdSearch,
  MdCleaningServices,
} from 'react-icons/md';
import { getCampaignsByUserId, createCampaign, updateCampaign, deleteCampaign, cleanCampaign, uploadFile, getAiAgentsByUserId } from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { compressImageWithTinyPNG, validateImageFile } from '../../services/imageCompression';
import { useAuth } from '../../context/AuthContext';
import type { Campaign, AiAgent } from '../../types/api.types';

const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [aiAgents, setAiAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fixedReply: '',
    replyType: 'text' as 'text' | 'image' | 'ai',
    replyImageUrl: '',
    aiAgentId: '',
    channel: 'whatsapp' as 'whatsapp' | 'web',
    firstMessage: '',
    isActive: false,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // AI agent search
  const [agentSearch, setAgentSearch] = useState('');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const agentDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
      fetchAiAgents();
    }
  }, [user]);

  // Close agent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setShowAgentDropdown(false);
      }
    };
    if (showAgentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAgentDropdown]);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await getCampaignsByUserId(user.id);
    if (result.success && result.data) {
      setCampaigns(
        [...result.data].sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    } else {
      setError(result.message || 'Failed to fetch campaigns');
    }
    setLoading(false);
  };

  const fetchAiAgents = async () => {
    if (!user) return;
    const result = await getAiAgentsByUserId(user.id);
    if (result.success && result.data) {
      setAiAgents(result.data);
    }
  };

  const getAgentById = (id: string) => aiAgents.find(a => a.id === id);

  const filteredAgents = aiAgents
    .filter(a =>
      a.isActive && (
        a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
        a.agentTitle.toLowerCase().includes(agentSearch.toLowerCase())
      )
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        fixedReply: campaign.fixedReply || '',
        replyType: campaign.replyType || 'text',
        replyImageUrl: campaign.replyImageUrl || '',
        aiAgentId: campaign.aiAgentId || '',
        channel: campaign.channel || 'whatsapp',
        firstMessage: campaign.firstMessage || '',
        isActive: campaign.isActive,
      });
      // Pre-fill search with agent name if editing an AI campaign
      if (campaign.aiAgentId) {
        const agent = aiAgents.find(a => a.id === campaign.aiAgentId);
        setAgentSearch(agent ? agent.name : '');
      } else {
        setAgentSearch('');
      }
    } else {
      setEditingCampaign(null);
      setFormData({ name: '', fixedReply: '', replyType: 'text', replyImageUrl: '', aiAgentId: '', channel: 'whatsapp', firstMessage: '', isActive: false });
      setAgentSearch('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCampaign(null);
    setFormData({ name: '', fixedReply: '', replyType: 'text', replyImageUrl: '', aiAgentId: '', channel: 'whatsapp', firstMessage: '', isActive: false });
    setAgentSearch('');
    setShowAgentDropdown(false);
  };

  const handleSelectAgent = (agent: AiAgent) => {
    setFormData(prev => ({ ...prev, aiAgentId: agent.id }));
    setAgentSearch('');
    setShowAgentDropdown(false);
  };

  const handleSaveCampaign = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const baseData: any = {
        name: formData.name,
        replyType: formData.replyType,
        channel: formData.channel,
        firstMessage: formData.firstMessage || null,
        isActive: formData.isActive,
      };

      if (formData.replyType === 'text') {
        baseData.fixedReply = formData.fixedReply;
        baseData.replyImageUrl = null;
        baseData.aiAgentId = null;
      } else if (formData.replyType === 'image') {
        baseData.replyImageUrl = formData.replyImageUrl;
        baseData.fixedReply = formData.fixedReply || '';
        baseData.aiAgentId = null;
      } else if (formData.replyType === 'ai') {
        baseData.aiAgentId = formData.aiAgentId;
        baseData.replyImageUrl = null;
        baseData.fixedReply = '';
      }

      if (editingCampaign) {
        const result = await updateCampaign(editingCampaign.id, baseData);
        if (result.success) {
          await fetchCampaigns();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to update campaign');
        }
      } else {
        const result = await createCampaign({ userId: user.id, ...baseData });
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ('files' in event.target && event.target.files?.length) {
      file = event.target.files[0];
    } else if ('dataTransfer' in event && event.dataTransfer.files?.length) {
      file = event.dataTransfer.files[0];
    }
    if (!file || !user) return;

    const validation = validateImageFile(file);
    if (!validation.valid) { setError(validation.message); return; }

    setUploading(true);
    try {
      const base64String = await compressImageWithTinyPNG(file);
      const result = await uploadFile({ userId: user.id, fileName: file.name, mimeType: file.type, fileData: base64String });
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, replyImageUrl: result.data!.url }));
        setError(null);
      } else {
        setError(result.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing image');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleImageUpload(e); };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    const result = await deleteCampaign(id);
    if (result.success) await fetchCampaigns();
    else setError(result.message || 'Failed to delete campaign');
  };

  const handleCleanCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to clean this campaign? This will delete all messages and reset the message count.')) return;
    const result = await cleanCampaign(id);
    if (result.success) await fetchCampaigns();
    else setError(result.message || 'Failed to clean campaign');
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const result = await updateCampaign(campaign.id, { isActive: !campaign.isActive });
    if (result.success) await fetchCampaigns();
    else setError(result.message || 'Failed to update campaign status');
  };

  const isFormValid = () => {
    if (!formData.name) return false;
    if (formData.replyType === 'text') return !!formData.fixedReply;
    if (formData.replyType === 'image') return !!formData.replyImageUrl;
    if (formData.replyType === 'ai') return !!formData.aiAgentId;
    return false;
  };

  const getReplyTypeLabel = (type: string) => {
    if (type === 'image') return 'Image';
    if (type === 'ai') return 'AI Agent';
    return 'Text';
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
        <div className="stat-card">
          <div className="stat-icon ai">
            <MdSmartToy />
          </div>
          <div className="stat-info">
            <h3>{campaigns.filter(c => c.replyType === 'ai').length}</h3>
            <p>AI Agent Campaigns</p>
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
                  <span className={`reply-type-badge ${campaign.replyType}`}>
                    {campaign.replyType === 'ai' && <MdSmartToy />}
                    {campaign.replyType === 'image' && <MdImage />}
                    {campaign.replyType === 'text' && <MdMessage />}
                    {getReplyTypeLabel(campaign.replyType)}
                  </span>
                  <span className={`reply-type-badge ${campaign.channel === 'web' ? 'web' : 'whatsapp'}`}>
                    {campaign.channel === 'web' ? '🌐 Web' : '📱 WhatsApp'}
                  </span>
                  <span className={`status-badge ${campaign.isActive ? 'active' : 'inactive'}`}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="campaign-actions">
                  <button className="icon-btn" onClick={() => handleOpenModal(campaign)} title="Edit campaign"><MdEdit /></button>
                  <button className="icon-btn warning" onClick={() => handleCleanCampaign(campaign.id)} title="Clean campaign (delete all messages)"><MdCleaningServices /></button>
                  <button className="icon-btn danger" onClick={() => handleDeleteCampaign(campaign.id)} title="Delete campaign"><MdDelete /></button>
                </div>
              </div>

              <div className="campaign-body">
                {campaign.replyType === 'ai' ? (
                  <div className="ai-agent-preview">
                    <label>AI Agent:</label>
                    <div className="agent-info-row">
                      <MdSmartToy className="agent-icon" />
                      <span>{getAgentById(campaign.aiAgentId || '')?.name || 'Unknown Agent'}</span>
                      <span className="agent-title-small">{getAgentById(campaign.aiAgentId || '')?.agentTitle}</span>
                    </div>
                  </div>
                ) : campaign.replyType === 'image' && campaign.replyImageUrl ? (
                  <>
                    <div className="image-preview-card">
                      <label>Campaign Image:</label>
                      <img src={campaign.replyImageUrl} alt={campaign.name} />
                    </div>
                    {campaign.fixedReply && (
                      <div className="reply-preview">
                        <label>Image Caption:</label>
                        <p>{campaign.fixedReply}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="reply-preview">
                    <label>Automated Reply:</label>
                    <p>{campaign.fixedReply}</p>
                  </div>
                )}

                <div className="campaign-meta">
                  <div className="meta-item">
                    <span className="meta-label">Type:</span>
                    <span className="meta-value">{getReplyTypeLabel(campaign.replyType)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Messages Sent:</span>
                    <span className="meta-value">{campaign.messageCount}</span>
                  </div>
                </div>

                {/* Campaign ID + API endpoints */}
                <div className="campaign-api-info">
                  <div className="api-info-row">
                    <span className="api-info-label">Campaign ID</span>
                    <div className="api-info-value-wrap">
                      <code className="api-info-code">{campaign.id}</code>
                      <button
                        className={`api-copy-btn ${copiedId === campaign.id + '_id' ? 'copied' : ''}`}
                        onClick={() => {
                          navigator.clipboard.writeText(campaign.id);
                          setCopiedId(campaign.id + '_id');
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                      >
                        {copiedId === campaign.id + '_id' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {campaign.channel === 'web' && (
                    <>
                      <div className="api-info-row">
                        <span className="api-info-label">Chat Start URL</span>
                        <div className="api-info-value-wrap">
                          <code className="api-info-code">{`POST ${API_BASE_URL}/api/chat/${campaign.id}/start`}</code>
                          <button
                            className={`api-copy-btn ${copiedId === campaign.id + '_start' ? 'copied' : ''}`}
                            onClick={() => {
                              navigator.clipboard.writeText(`${API_BASE_URL}/api/chat/${campaign.id}/start`);
                              setCopiedId(campaign.id + '_start');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                          >
                            {copiedId === campaign.id + '_start' ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      <div className="api-info-row">
                        <span className="api-info-label">Send Message URL</span>
                        <div className="api-info-value-wrap">
                          <code className="api-info-code">{`POST ${API_BASE_URL}/api/chat/${campaign.id}/message`}</code>
                          <button
                            className={`api-copy-btn ${copiedId === campaign.id + '_msg' ? 'copied' : ''}`}
                            onClick={() => {
                              navigator.clipboard.writeText(`${API_BASE_URL}/api/chat/${campaign.id}/message`);
                              setCopiedId(campaign.id + '_msg');
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                          >
                            {copiedId === campaign.id + '_msg' ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
              <button className="close-btn" onClick={handleCloseModal}><MdClose /></button>
            </div>

            <div className="modal-body">
              {/* Campaign Name */}
              <div className="form-group">
                <label htmlFor="campaignName">Campaign Name *</label>
                <input
                  type="text"
                  id="campaignName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                  className="form-input"
                />
                <small className="form-help">Give your campaign a descriptive name for easy identification</small>
              </div>

              {/* Channel */}
              <div className="form-group">
                <label htmlFor="channel">Channel *</label>
                <select
                  id="channel"
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value as 'whatsapp' | 'web' })}
                  className="form-select"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="web">Web Chat</option>
                </select>
                <small className="form-help">WhatsApp replies via the WhatsApp API. Web Chat is embedded on your website.</small>
              </div>

              {/* First message (web only) */}
              {formData.channel === 'web' && (
                <div className="form-group">
                  <label htmlFor="firstMessage">First Message (Greeting)</label>
                  <textarea
                    id="firstMessage"
                    value={formData.firstMessage}
                    onChange={(e) => setFormData({ ...formData, firstMessage: e.target.value })}
                    placeholder="e.g. Hi! How can I help you today?"
                    className="form-textarea"
                    rows={3}
                  />
                  <small className="form-help">This message is shown to the visitor when they open the chat. For AI campaigns, the AI generates this greeting automatically.</small>
                </div>
              )}

              {/* Content Type */}
              <div className="form-group">
                <label htmlFor="replyType">Content Type *</label>
                <select
                  id="replyType"
                  value={formData.replyType}
                  onChange={(e) => setFormData({
                    ...formData,
                    replyType: e.target.value as 'text' | 'image' | 'ai',
                    replyImageUrl: '',
                    aiAgentId: '',
                    fixedReply: '',
                  })}
                  className="form-select"
                >
                  <option value="text">Text Message</option>
                  <option value="image">Image</option>
                  <option value="ai">AI Agent</option>
                </select>
              </div>

              {/* TEXT fields */}
              {formData.replyType === 'text' && (
                <div className="form-group">
                  <label htmlFor="fixedReply">Automated Reply *</label>
                  <textarea
                    id="fixedReply"
                    value={formData.fixedReply}
                    onChange={(e) => setFormData({ ...formData, fixedReply: e.target.value })}
                    placeholder="Enter the message that will be sent automatically..."
                    className="form-textarea"
                    rows={6}
                  />
                  <small className="form-help">This message will be sent automatically to customers who message you</small>
                  <div className="character-count">{formData.fixedReply.length} characters</div>
                </div>
              )}

              {/* IMAGE fields */}
              {formData.replyType === 'image' && (
                <>
                  <div className="form-group">
                    <label htmlFor="imageUpload">Upload Image *</label>
                    <div
                      className={`image-upload-area ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {uploading ? (
                        <div className="upload-loader"><div className="spinner"></div><p>Uploading image...</p></div>
                      ) : formData.replyImageUrl ? (
                        <div className="image-preview">
                          <img src={formData.replyImageUrl} alt="Preview" />
                          <button type="button" className="remove-image-btn" onClick={() => setFormData({ ...formData, replyImageUrl: '' })}>
                            <MdClose /> Remove
                          </button>
                        </div>
                      ) : (
                        <div className="upload-prompt">
                          <MdImage className="upload-icon" />
                          <p>Click to select an image or drag and drop</p>
                          <small>Supported formats: JPG, PNG, GIF</small>
                        </div>
                      )}
                      <input type="file" id="imageUpload" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden-input" />
                    </div>
                    <small className="form-help">Upload an image to send to customers when they message you</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="imageCaption">Image Caption (Optional)</label>
                    <textarea
                      id="imageCaption"
                      value={formData.fixedReply}
                      onChange={(e) => setFormData({ ...formData, fixedReply: e.target.value })}
                      placeholder="Add a caption to accompany your image..."
                      className="form-textarea"
                      rows={3}
                    />
                    <small className="form-help">This text will be sent along with the image</small>
                  </div>
                </>
              )}

              {/* AI AGENT fields */}
              {formData.replyType === 'ai' && (
                <>
                  <div className="form-group">
                    <label>AI Agent *</label>
                    {aiAgents.length === 0 ? (
                      <div className="no-agents-warning">
                        <MdSmartToy />
                        <p>No AI agents found. <a href="/ai-agents" onClick={handleCloseModal}>Create one first</a></p>
                      </div>
                    ) : (
                      <div className="agent-search-wrapper" ref={agentDropdownRef}>
                        {/* Trigger button — shows selected agent or placeholder */}
                        <div
                          className={`agent-select-trigger ${showAgentDropdown ? 'open' : ''}`}
                          onClick={() => { setShowAgentDropdown(prev => !prev); }}
                        >
                          {formData.aiAgentId ? (
                            <>
                              <div className="agent-dropdown-avatar"><MdSmartToy /></div>
                              <div className="agent-dropdown-info">
                                <span className="agent-dropdown-name">{getAgentById(formData.aiAgentId)?.name}</span>
                                <span className="agent-dropdown-title">{getAgentById(formData.aiAgentId)?.agentTitle}</span>
                              </div>
                              <button type="button" className="clear-agent-btn" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, aiAgentId: '' })); setAgentSearch(''); }}>
                                <MdClose />
                              </button>
                            </>
                          ) : (
                            <span className="agent-select-placeholder">Select an AI agent...</span>
                          )}
                          <span className="agent-select-chevron">{showAgentDropdown ? '▲' : '▼'}</span>
                        </div>

                        {/* Dropdown panel */}
                        {showAgentDropdown && (
                          <div className="agent-dropdown">
                            {/* Search inside dropdown */}
                            <div className="agent-dropdown-search">
                              <MdSearch className="search-icon-inside" />
                              <input
                                type="text"
                                autoFocus
                                className="agent-dropdown-search-input"
                                placeholder="Search agents..."
                                value={agentSearch}
                                onChange={(e) => setAgentSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {filteredAgents.length === 0 ? (
                              <div className="agent-dropdown-empty">No agents match your search</div>
                            ) : (
                              filteredAgents.map(agent => (
                                <div key={agent.id} className={`agent-dropdown-item ${formData.aiAgentId === agent.id ? 'selected' : ''}`} onClick={() => handleSelectAgent(agent)}>
                                  <div className="agent-dropdown-avatar"><MdSmartToy /></div>
                                  <div className="agent-dropdown-info">
                                    <span className="agent-dropdown-name">{agent.name}</span>
                                    <span className="agent-dropdown-title">{agent.agentTitle}</span>
                                  </div>
                                  <span className={`agent-dropdown-status ${agent.isActive ? 'active' : 'inactive'}`}>
                                    {agent.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <small className="form-help">Select the AI agent that will handle responses for this campaign</small>
                  </div>
                </>
              )}

              {/* Status */}
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
                <small className="form-help">⚠️ Only one campaign can be active at a time.</small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal} disabled={saving || uploading}>Cancel</button>
              <button
                className="btn primary"
                onClick={handleSaveCampaign}
                disabled={!isFormValid() || saving || uploading}
              >
                <MdSave />
                {saving ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;

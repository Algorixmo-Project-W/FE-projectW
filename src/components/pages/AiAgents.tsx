import React, { useState, useEffect } from 'react';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSmartToy,
  MdSave,
  MdRefresh,
  MdClose,
  MdCheckCircle,
  MdPauseCircle,
  MdLink,
  MdLinkOff,
  MdVideoCall,
  MdCalendarMonth,
} from 'react-icons/md';
import { SiHubspot } from 'react-icons/si';
import { getAiAgentsByUserId, createAiAgent, updateAiAgent, deleteAiAgent, getAiIntegrations, setAiIntegrations, deleteAiIntegrations } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { AiAgent } from '../../types/api.types';

const AiAgents: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Agent create/edit modal ──────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    agentTitle: '',
    instructions: '',
    isActive: false,
  });

  // ── Integration modal ────────────────────────────────────
  const [integrationAgent, setIntegrationAgent] = useState<AiAgent | null>(null);
  const [integrationData, setIntegrationData] = useState<{ zoom: string; hubspot: string; google: string }>({
    zoom: '',
    hubspot: '',
    google: '',
  });
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [activeIntegrationTab, setActiveIntegrationTab] = useState<'zoom' | 'hubspot' | 'google'>('zoom');

  useEffect(() => {
    if (user) fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await getAiAgentsByUserId(user.id);
    if (result.success && result.data) {
      setAgents(result.data);
    } else {
      setError(result.message || 'Failed to fetch AI agents');
    }
    setLoading(false);
  };

  // ── Agent modal handlers ─────────────────────────────────
  const handleOpenModal = (agent?: AiAgent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        agentTitle: agent.agentTitle,
        instructions: agent.instructions,
        isActive: agent.isActive,
      });
    } else {
      setEditingAgent(null);
      setFormData({ name: '', agentTitle: '', instructions: '', isActive: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgent(null);
    setFormData({ name: '', agentTitle: '', instructions: '', isActive: false });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingAgent) {
        const result = await updateAiAgent(editingAgent.id, {
          name: formData.name,
          agentTitle: formData.agentTitle,
          instructions: formData.instructions,
          isActive: formData.isActive,
        });
        if (result.success) {
          await fetchAgents();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to update agent');
        }
      } else {
        const result = await createAiAgent({
          userId: user.id,
          name: formData.name,
          agentTitle: formData.agentTitle,
          instructions: formData.instructions,
          isActive: formData.isActive,
        });
        if (result.success) {
          await fetchAgents();
          handleCloseModal();
        } else {
          setError(result.message || 'Failed to create agent');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this AI agent?')) return;
    const result = await deleteAiAgent(id);
    if (result.success) {
      await fetchAgents();
    } else {
      setError(result.message || 'Failed to delete agent');
    }
  };

  const handleToggleStatus = async (agent: AiAgent) => {
    const result = await updateAiAgent(agent.id, { isActive: !agent.isActive });
    if (result.success) {
      await fetchAgents();
    } else {
      setError(result.message || 'Failed to update agent status');
    }
  };

  // ── Integration modal handlers ───────────────────────────
  const handleOpenIntegrations = async (agent: AiAgent) => {
    setIntegrationAgent(agent);
    setActiveIntegrationTab('zoom');
    setIntegrationData({ zoom: '', hubspot: '', google: '' });
    setIntegrationLoading(true);
    const result = await getAiIntegrations(agent.id);
    if (result.success && result.data) {
      setIntegrationData({
        zoom:    result.data.zoom    || '',
        hubspot: result.data.hubspot || '',
        google:  result.data.google  || '',
      });
    }
    setIntegrationLoading(false);
  };

  const handleCloseIntegrations = () => {
    setIntegrationAgent(null);
    setIntegrationData({ zoom: '', hubspot: '', google: '' });
  };

  const handleSaveIntegrations = async () => {
    if (!integrationAgent) return;
    setIntegrationSaving(true);
    const payload: { zoom?: string | null; hubspot?: string | null; google?: string | null } = {
      zoom:    integrationData.zoom    || null,
      hubspot: integrationData.hubspot || null,
      google:  integrationData.google  || null,
    };
    const result = await setAiIntegrations(integrationAgent.id, payload);
    if (!result.success) {
      setError(result.message || 'Failed to save integrations');
    }
    setIntegrationSaving(false);
    handleCloseIntegrations();
  };

  const handleDeleteIntegrations = async () => {
    if (!integrationAgent) return;
    if (!window.confirm('Remove all meeting links for this agent?')) return;
    setIntegrationSaving(true);
    await deleteAiIntegrations(integrationAgent.id);
    setIntegrationSaving(false);
    handleCloseIntegrations();
  };

  const isFormValid = formData.name.trim() && formData.agentTitle.trim() && formData.instructions.trim();

  // ── Integration tab config ───────────────────────────────
  const integrationTabs: {
    key: 'zoom' | 'hubspot' | 'google';
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    color: string;
  }[] = [
    {
      key: 'zoom',
      label: 'Zoom',
      icon: <MdVideoCall />,
      placeholder: 'https://zoom.us/j/...',
      color: '#2D8CFF',
    },
    {
      key: 'hubspot',
      label: 'HubSpot',
      icon: <SiHubspot />,
      placeholder: 'https://meetings.hubspot.com/...',
      color: '#FF7A59',
    },
    {
      key: 'google',
      label: 'Google Meet',
      icon: <MdCalendarMonth />,
      placeholder: 'https://calendar.google.com/...',
      color: '#1A73E8',
    },
  ];

  return (
    <div className="ai-agents-page">
      {/* Page Header */}
      <div className="ai-agents-header">
        <div className="header-content">
          <div>
            <h1>AI Agents</h1>
            <p>Create and manage AI-powered WhatsApp response agents</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={fetchAgents} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Agent
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="ai-agents-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><MdSmartToy /></div>
          <div className="stat-info">
            <h3>{agents.length}</h3>
            <p>Total Agents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><MdCheckCircle /></div>
          <div className="stat-info">
            <h3>{agents.filter(a => a.isActive).length}</h3>
            <p>Active Agents</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon muted"><MdPauseCircle /></div>
          <div className="stat-info">
            <h3>{agents.filter(a => !a.isActive).length}</h3>
            <p>Inactive Agents</p>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="ai-agents-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="empty-state">
            <MdSmartToy className="empty-icon" />
            <h3>No AI agents yet</h3>
            <p>Create your first AI agent to start handling WhatsApp conversations intelligently</p>
            <button className="btn primary" onClick={() => handleOpenModal()}>
              <MdAdd />
              Create Your First Agent
            </button>
          </div>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-card-header">
                <div className="agent-identity">
                  <div className="agent-avatar"><MdSmartToy /></div>
                  <div className="agent-title-group">
                    <h3>{agent.name}</h3>
                    <span className="agent-role">{agent.agentTitle}</span>
                  </div>
                  <span className={`status-badge ${agent.isActive ? 'active' : 'inactive'}`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="agent-actions">
                  <button
                    className="icon-btn integration"
                    onClick={() => handleOpenIntegrations(agent)}
                    title="Meeting integrations"
                  >
                    <MdLink />
                  </button>
                  <button className="icon-btn" onClick={() => handleOpenModal(agent)} title="Edit agent">
                    <MdEdit />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(agent.id)} title="Delete agent">
                    <MdDelete />
                  </button>
                </div>
              </div>

              <div className="agent-card-body">
                <div className="instructions-preview">
                  <label>Instructions</label>
                  <p>{agent.instructions}</p>
                </div>
                <div className="agent-meta">
                  <div className="meta-item">
                    <span className="meta-label">Created:</span>
                    <span className="meta-value">{new Date(agent.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Last Updated:</span>
                    <span className="meta-value">{new Date(agent.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="agent-card-footer">
                <button
                  className="integration-footer-btn"
                  onClick={() => handleOpenIntegrations(agent)}
                >
                  <MdLink />
                  Integrations
                </button>
                <button
                  className={`toggle-btn ${agent.isActive ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleStatus(agent)}
                >
                  {agent.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}</h2>
              <button className="close-btn" onClick={handleCloseModal}><MdClose /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="agentName">Agent Name *</label>
                <input
                  type="text"
                  id="agentName"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sara"
                  className="form-input"
                />
                <small className="form-help">The name your agent will use when responding</small>
              </div>
              <div className="form-group">
                <label htmlFor="agentTitle">Agent Title *</label>
                <input
                  type="text"
                  id="agentTitle"
                  value={formData.agentTitle}
                  onChange={e => setFormData({ ...formData, agentTitle: e.target.value })}
                  placeholder="e.g., Customer Support Agent"
                  className="form-input"
                />
                <small className="form-help">The role or title of this agent</small>
              </div>
              <div className="form-group">
                <label htmlFor="agentInstructions">Instructions *</label>
                <textarea
                  id="agentInstructions"
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g., Help customers with orders and questions. Be friendly and reply in the same language the customer uses."
                  className="form-textarea"
                  rows={6}
                />
                <small className="form-help">Tell the agent how to behave, what topics to handle, and how to respond</small>
                <div className="character-count">{formData.instructions.length} characters</div>
              </div>
              {editingAgent && (
                <div className="form-group">
                  <label>Integrations</label>
                  <button 
                    className="btn secondary" 
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}
                    type="button"
                    onClick={() => {
                      const agent = editingAgent;
                      handleCloseModal();
                      if (agent) handleOpenIntegrations(agent);
                    }}
                    disabled={saving}
                  >
                    <MdLink />
                    Manage Meeting Integrations
                  </button>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="agentStatus">Status</label>
                <select
                  id="agentStatus"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <small className="form-help">⚠️ Only one agent should be active at a time for best results.</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={handleCloseModal} disabled={saving}>Cancel</button>
              <button className="btn primary" onClick={handleSave} disabled={!isFormValid || saving}>
                <MdSave />
                {saving ? 'Saving...' : editingAgent ? 'Update Agent' : 'Create Agent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Integration Modal ──────────────────────────────── */}
      {integrationAgent && (
        <div className="modal-overlay" onClick={handleCloseIntegrations}>
          <div className="modal-content integration-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="integration-modal-title">
                <MdLink />
                <div>
                  <h2>Meeting Integrations</h2>
                  <p className="integration-subtitle">{integrationAgent.name} — {integrationAgent.agentTitle}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseIntegrations}><MdClose /></button>
            </div>

            {integrationLoading ? (
              <div className="integration-loading">
                <div className="spinner"></div>
                <p>Loading integrations...</p>
              </div>
            ) : (
              <>
                {/* Platform picker */}
                <div className="integration-tabs">
                  {integrationTabs.map(tab => (
                    <button
                      key={tab.key}
                      className={`integration-tab ${activeIntegrationTab === tab.key ? 'active' : ''}`}
                      style={{ '--tab-color': tab.color } as React.CSSProperties}
                      onClick={() => setActiveIntegrationTab(tab.key)}
                    >
                      <span className="integration-tab-icon" style={{ color: tab.color }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {integrationData[tab.key] && (
                        <span className="integration-tab-dot" style={{ background: tab.color }}></span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Active tab input */}
                {integrationTabs.filter(t => t.key === activeIntegrationTab).map(tab => (
                  <div key={tab.key} className="integration-input-section">
                    <div className="integration-platform-header">
                      <span className="integration-platform-icon" style={{ background: `${tab.color}18`, color: tab.color }}>
                        {tab.icon}
                      </span>
                      <div>
                        <h3>{tab.label} Meeting Link</h3>
                        <p>When a customer asks to schedule, the AI will share this link.</p>
                      </div>
                    </div>

                    <div className="integration-input-wrap">
                      <input
                        type="url"
                        className="form-input"
                        placeholder={tab.placeholder}
                        value={integrationData[tab.key]}
                        onChange={e => setIntegrationData(prev => ({ ...prev, [tab.key]: e.target.value }))}
                      />
                      {integrationData[tab.key] && (
                        <button
                          className="integration-clear-btn"
                          onClick={() => setIntegrationData(prev => ({ ...prev, [tab.key]: '' }))}
                          title="Remove link"
                        >
                          <MdClose />
                        </button>
                      )}
                    </div>

                    {integrationData[tab.key] && (
                      <a
                        href={integrationData[tab.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="integration-preview-link"
                      >
                        <MdLink /> Preview link ↗
                      </a>
                    )}
                  </div>
                ))}

                {/* Summary of set links */}
                <div className="integration-summary">
                  {integrationTabs.map(tab => (
                    <div key={tab.key} className={`integration-summary-item ${integrationData[tab.key] ? 'set' : 'empty'}`}>
                      <span style={{ color: integrationData[tab.key] ? tab.color : undefined }}>{tab.icon}</span>
                      <span className="integration-summary-label">{tab.label}</span>
                      <span className="integration-summary-status">
                        {integrationData[tab.key] ? '✓ Set' : 'Not set'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="modal-footer">
              <button
                className="btn danger-outline"
                onClick={handleDeleteIntegrations}
                disabled={integrationSaving || integrationLoading}
              >
                <MdLinkOff />
                Remove All
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn secondary" onClick={handleCloseIntegrations} disabled={integrationSaving}>
                  Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={handleSaveIntegrations}
                  disabled={integrationSaving || integrationLoading}
                >
                  <MdSave />
                  {integrationSaving ? 'Saving...' : 'Save Links'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAgents;

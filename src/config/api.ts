// API Configuration
// Backend runs on port 3000 by default (from BE-projectW/.env)

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Health
  health: '/api/check',
  
  // Users
  users: {
    create: '/api/users/create',
    login: '/api/users/login',
    getAll: '/api/users',
    getById: (id: string) => `/api/users/${id}`,
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
  },
  
  // WhatsApp Credentials
  waCredentials: {
    add: '/api/wa-credentials/add',
    getByUserId: (userId: string) => `/api/wa-credentials/user/${userId}`,
    update: (id: string) => `/api/wa-credentials/${id}`,
    delete: (id: string) => `/api/wa-credentials/${id}`,
  },
  
  // Webhook Configuration
  webhook: {
    generate: '/api/webhook/generate',
    regenerate: (id: string) => `/api/webhook/regenerate/${id}`,
    getByUserId: (userId: string) => `/api/webhook/config/${userId}`,
    delete: (id: string) => `/api/webhook/config/${id}`,
  },

  // Campaigns
  campaigns: {
    create: '/api/campaigns',
    getByUserId: (userId: string) => `/api/campaigns/user/${userId}`,
    getById: (id: string) => `/api/campaigns/${id}`,
    update: (id: string) => `/api/campaigns/${id}`,
    delete: (id: string) => `/api/campaigns/${id}`,
  },

  // Messages
  messages: {
    create: '/api/messages',
    getByUserId: (userId: string) => `/api/messages/user/${userId}`,
    getByCampaignId: (campaignId: string) => `/api/messages/campaign/${campaignId}`,
    getById: (id: string) => `/api/messages/${id}`,
    delete: (id: string) => `/api/messages/${id}`,
    getThreads: (campaignId: string) => `/api/messages/threads/${campaignId}`,
    getThread: (campaignId: string, senderNumber: string) => `/api/messages/thread/${campaignId}/${encodeURIComponent(senderNumber)}`,
  },

  // AI Agents
  aiAgents: {
    create: '/api/ai-agents',
    getByUserId: (userId: string) => `/api/ai-agents/user/${userId}`,
    getById: (id: string) => `/api/ai-agents/${id}`,
    update: (id: string) => `/api/ai-agents/${id}`,
    delete: (id: string) => `/api/ai-agents/${id}`,
    // Integrations (meeting links)
    getIntegrations: (agentId: string) => `/api/ai-agents/${agentId}/integrations`,
    setIntegrations: (agentId: string) => `/api/ai-agents/${agentId}/integrations`,
    deleteIntegrations: (agentId: string) => `/api/ai-agents/${agentId}/integrations`,
  },
} as const;

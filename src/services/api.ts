// API Service Layer - Centralized API calls with error handling

import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
  ApiResponse,
  SafeUser,
  SafeWaCredential,
  WebhookConfig,
  Campaign,
  Message,
  MessageThread,
  ThreadMessage,
  FileUpload,
  AiAgent,
  LoginRequest,
  CreateUserRequest,
  UpdateUserRequest,
  AddWaCredentialRequest,
  UpdateWaCredentialRequest,
  GenerateWebhookRequest,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateMessageRequest,
  UploadFileRequest,
  CreateAiAgentRequest,
  UpdateAiAgentRequest,
  AiIntegration,
  SetAiIntegrationRequest,
} from '../types/api.types';

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data: ApiResponse<T> = await response.json();
    
    // Return the API response as-is (includes success/message/data)
    return data;
  } catch (error) {
    // Network error or JSON parse error
    console.error('API Request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// ============================================
// Auth API
// ============================================

export async function login(credentials: LoginRequest): Promise<ApiResponse<SafeUser>> {
  return apiRequest<SafeUser>(API_ENDPOINTS.users.login, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function createUser(userData: CreateUserRequest): Promise<ApiResponse<SafeUser>> {
  return apiRequest<SafeUser>(API_ENDPOINTS.users.create, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// ============================================
// WhatsApp Credentials API
// ============================================

export async function getWaCredentials(userId: string): Promise<ApiResponse<SafeWaCredential[]>> {
  return apiRequest<SafeWaCredential[]>(API_ENDPOINTS.waCredentials.getByUserId(userId), {
    method: 'GET',
  });
}

export async function addWaCredential(data: AddWaCredentialRequest): Promise<ApiResponse<SafeWaCredential>> {
  return apiRequest<SafeWaCredential>(API_ENDPOINTS.waCredentials.add, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWaCredential(
  id: string,
  data: UpdateWaCredentialRequest
): Promise<ApiResponse<SafeWaCredential>> {
  return apiRequest<SafeWaCredential>(API_ENDPOINTS.waCredentials.update(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteWaCredential(id: string): Promise<ApiResponse<SafeWaCredential>> {
  return apiRequest<SafeWaCredential>(API_ENDPOINTS.waCredentials.delete(id), {
    method: 'DELETE',
  });
}

// ============================================
// Webhook Configuration API
// ============================================

export async function getWebhookConfig(userId: string): Promise<ApiResponse<WebhookConfig>> {
  return apiRequest<WebhookConfig>(API_ENDPOINTS.webhook.getByUserId(userId), {
    method: 'GET',
  });
}

export async function generateWebhook(data: GenerateWebhookRequest): Promise<ApiResponse<WebhookConfig>> {
  return apiRequest<WebhookConfig>(API_ENDPOINTS.webhook.generate, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function regenerateWebhookToken(id: string): Promise<ApiResponse<WebhookConfig>> {
  return apiRequest<WebhookConfig>(API_ENDPOINTS.webhook.regenerate(id), {
    method: 'POST',
  });
}

export async function deleteWebhook(id: string): Promise<ApiResponse<WebhookConfig>> {
  return apiRequest<WebhookConfig>(API_ENDPOINTS.webhook.delete(id), {
    method: 'DELETE',
  });
}

// ============================================
// Health Check API
// ============================================

export async function checkHealth(): Promise<ApiResponse<{ status: string }>> {
  return apiRequest<{ status: string }>(API_ENDPOINTS.health, {
    method: 'GET',
  });
}

// ============================================
// Users API (extended)
// ============================================

export async function getAllUsers(): Promise<ApiResponse<SafeUser[]>> {
  return apiRequest<SafeUser[]>(API_ENDPOINTS.users.getAll, {
    method: 'GET',
  });
}

export async function getUserById(id: string): Promise<ApiResponse<SafeUser>> {
  return apiRequest<SafeUser>(API_ENDPOINTS.users.getById(id), {
    method: 'GET',
  });
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<SafeUser>> {
  return apiRequest<SafeUser>(API_ENDPOINTS.users.update(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<ApiResponse<SafeUser>> {
  return apiRequest<SafeUser>(API_ENDPOINTS.users.delete(id), {
    method: 'DELETE',
  });
}

// ============================================
// Campaigns API
// ============================================

export async function getCampaignsByUserId(userId: string): Promise<ApiResponse<Campaign[]>> {
  return apiRequest<Campaign[]>(API_ENDPOINTS.campaigns.getByUserId(userId), {
    method: 'GET',
  });
}

export async function getCampaignById(id: string): Promise<ApiResponse<Campaign>> {
  return apiRequest<Campaign>(API_ENDPOINTS.campaigns.getById(id), {
    method: 'GET',
  });
}

export async function createCampaign(data: CreateCampaignRequest): Promise<ApiResponse<Campaign>> {
  return apiRequest<Campaign>(API_ENDPOINTS.campaigns.create, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(id: string, data: UpdateCampaignRequest): Promise<ApiResponse<Campaign>> {
  return apiRequest<Campaign>(API_ENDPOINTS.campaigns.update(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCampaign(id: string): Promise<ApiResponse<Campaign>> {
  return apiRequest<Campaign>(API_ENDPOINTS.campaigns.delete(id), {
    method: 'DELETE',
  });
}

// ============================================
// Messages API
// ============================================

export async function getMessagesByUserId(userId: string): Promise<ApiResponse<Message[]>> {
  return apiRequest<Message[]>(API_ENDPOINTS.messages.getByUserId(userId), {
    method: 'GET',
  });
}

export async function getMessagesByCampaignId(campaignId: string): Promise<ApiResponse<Message[]>> {
  return apiRequest<Message[]>(API_ENDPOINTS.messages.getByCampaignId(campaignId), {
    method: 'GET',
  });
}

export async function getMessageById(id: string): Promise<ApiResponse<Message>> {
  return apiRequest<Message>(API_ENDPOINTS.messages.getById(id), {
    method: 'GET',
  });
}

export async function createMessage(data: CreateMessageRequest): Promise<ApiResponse<Message>> {
  return apiRequest<Message>(API_ENDPOINTS.messages.create, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMessage(id: string): Promise<ApiResponse<Message>> {
  return apiRequest<Message>(API_ENDPOINTS.messages.delete(id), {
    method: 'DELETE',
  });
}

export async function getMessageThreads(campaignId: string): Promise<ApiResponse<MessageThread[]>> {
  return apiRequest<MessageThread[]>(API_ENDPOINTS.messages.getThreads(campaignId), {
    method: 'GET',
  });
}

export async function getThreadMessages(campaignId: string, senderNumber: string): Promise<ApiResponse<ThreadMessage[]>> {
  return apiRequest<ThreadMessage[]>(API_ENDPOINTS.messages.getThread(campaignId, senderNumber), {
    method: 'GET',
  });
}

// ============================================
// File Upload API
// ============================================

export async function uploadFile(data: UploadFileRequest): Promise<ApiResponse<FileUpload>> {
  return apiRequest<FileUpload>('/api/uploads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// AI Agents API
// ============================================

export async function getAiAgentsByUserId(userId: string): Promise<ApiResponse<AiAgent[]>> {
  return apiRequest<AiAgent[]>(API_ENDPOINTS.aiAgents.getByUserId(userId), {
    method: 'GET',
  });
}

export async function createAiAgent(data: CreateAiAgentRequest): Promise<ApiResponse<AiAgent>> {
  return apiRequest<AiAgent>(API_ENDPOINTS.aiAgents.create, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAiAgent(id: string, data: UpdateAiAgentRequest): Promise<ApiResponse<AiAgent>> {
  return apiRequest<AiAgent>(API_ENDPOINTS.aiAgents.update(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAiAgent(id: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(API_ENDPOINTS.aiAgents.delete(id), {
    method: 'DELETE',
  });
}

export async function getAiIntegrations(agentId: string): Promise<ApiResponse<AiIntegration>> {
  return apiRequest<AiIntegration>(API_ENDPOINTS.aiAgents.getIntegrations(agentId), {
    method: 'GET',
  });
}

export async function setAiIntegrations(
  agentId: string,
  data: SetAiIntegrationRequest
): Promise<ApiResponse<AiIntegration>> {
  return apiRequest<AiIntegration>(API_ENDPOINTS.aiAgents.setIntegrations(agentId), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAiIntegrations(agentId: string): Promise<ApiResponse<void>> {
  return apiRequest<void>(API_ENDPOINTS.aiAgents.deleteIntegrations(agentId), {
    method: 'DELETE',
  });
}

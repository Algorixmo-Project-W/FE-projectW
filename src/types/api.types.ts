// API Response Types - Matching backend response structure

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// User types (matching BE-projectW/src/types/database.types.ts)
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

// Safe user (without passwordHash) - returned by API
export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Credentials types
export interface WaCredential {
  id: string;
  userId: string;
  businessId: string;
  phoneNumberId: string;
  accessToken: string;
  whatsappUserId: string;
  appId: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Safe WhatsApp Credential (without accessToken) - returned by API
export interface SafeWaCredential {
  id: string;
  userId: string;
  businessId: string;
  phoneNumberId: string;
  whatsappUserId: string;
  appId: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
}

// Webhook Configuration types
export interface WebhookConfig {
  id: string;
  userId: string;
  callbackUrl: string;
  verifyToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request payload types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AddWaCredentialRequest {
  userId: string;
  businessId: string;
  phoneNumberId: string;
  accessToken: string;
  whatsappUserId: string;
  appId: string;
  phoneNumber: string;
}

export interface UpdateWaCredentialRequest {
  businessId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  whatsappUserId?: string;
  appId?: string;
  phoneNumber?: string;
}

export interface GenerateWebhookRequest {
  userId: string;
}

// Campaign types
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  fixedReply: string;
  replyType: 'text' | 'image' | 'ai';
  replyImageUrl?: string;
  aiAgentId?: string | null;
  isActive: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignRequest {
  userId: string;
  name: string;
  fixedReply?: string;
  replyType?: 'text' | 'image' | 'ai';
  replyImageUrl?: string;
  aiAgentId?: string;
  isActive?: boolean;
}

export interface UpdateCampaignRequest {
  name?: string;
  fixedReply?: string;
  replyType?: 'text' | 'image' | 'ai';
  replyImageUrl?: string;
  aiAgentId?: string;
  isActive?: boolean;
}

// Upload types
export interface FileUpload {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFileRequest {
  userId: string;
  fileName: string;
  mimeType: string;
  fileData: string; // base64-encoded
}

// Message types
export interface Message {
  id: string;
  userId: string;
  campaignId: string | null;
  senderNumber: string;
  messageType: string;
  messageContent: string;
  replyContent: string | null;
  replyMessageId: string | null;
  direction: string;
  replyStatus: string;
  whatsappMessageId: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface CreateMessageRequest {
  userId: string;
  campaignId?: string;
  senderNumber: string;
  messageType?: string;
  messageContent: string;
  direction?: string;
  replyStatus?: string;
}

// AI Agent types
export interface AiAgent {
  id: string;
  userId: string;
  name: string;
  agentTitle: string;
  instructions: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiAgentRequest {
  userId: string;
  name: string;
  agentTitle: string;
  instructions: string;
  isActive?: boolean;
}

export interface UpdateAiAgentRequest {
  name?: string;
  agentTitle?: string;
  instructions?: string;
  isActive?: boolean;
}

// Update user request
export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
}

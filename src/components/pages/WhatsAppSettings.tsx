import React, { useState, useEffect } from 'react';
import { 
  MdSave, 
  MdRefresh, 
  MdVisibility, 
  MdVisibilityOff,
  MdCheckCircle,
  MdError,
  MdInfo,
  MdContentCopy
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { 
  getWaCredentials, 
  addWaCredential, 
  updateWaCredential,
  getWebhookConfig,
  generateWebhook
} from '../../services/api';
import type { SafeWaCredential, WebhookConfig } from '../../types/api.types';

interface WhatsAppCredentials {
  businessId: string;
  phoneNumberId: string;
  accessToken: string;
  whatsappUserId: string;
  phoneNumber: string;
}

const WhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  
  // Existing credential from DB (if any)
  const [existingCredential, setExistingCredential] = useState<SafeWaCredential | null>(null);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null);
  
  const [credentials, setCredentials] = useState<WhatsAppCredentials>({
    businessId: '',
    phoneNumberId: '',
    accessToken: '',
    whatsappUserId: '',
    phoneNumber: ''
  });

  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Load existing credentials on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Load WhatsApp credentials
        const credResponse = await getWaCredentials(user.id);
        if (credResponse.success && credResponse.data && credResponse.data.length > 0) {
          const cred = credResponse.data[0]; // Use first credential
          setExistingCredential(cred);
          setCredentials({
            businessId: cred.businessId,
            phoneNumberId: cred.phoneNumberId,
            accessToken: '', // Token not returned by API for security
            whatsappUserId: cred.whatsappUserId,
            phoneNumber: cred.phoneNumber
          });
          setConnectionStatus('success');
          setStatusMessage('Credentials loaded successfully');
        }
        
        // Load webhook configuration
        const webhookResponse = await getWebhookConfig(user.id);
        if (webhookResponse.success && webhookResponse.data) {
          setWebhookConfig(webhookResponse.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setConnectionStatus('error');
        setStatusMessage('Failed to load existing configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleInputChange = (field: keyof WhatsAppCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    // Validate required fields
    if (!credentials.businessId || !credentials.phoneNumberId || !credentials.whatsappUserId || !credentials.phoneNumber) {
      setConnectionStatus('error');
      setStatusMessage('Please fill in all required fields');
      return;
    }
    
    // Access token required for new credentials
    if (!existingCredential && !credentials.accessToken) {
      setConnectionStatus('error');
      setStatusMessage('Access token is required');
      return;
    }

    setIsSaving(true);
    setConnectionStatus('loading');
    setStatusMessage('Saving credentials...');

    try {
      let response;
      
      if (existingCredential) {
        // Update existing credentials
        const updateData: any = {
          businessId: credentials.businessId,
          phoneNumberId: credentials.phoneNumberId,
          whatsappUserId: credentials.whatsappUserId,
          phoneNumber: credentials.phoneNumber
        };
        // Only include token if user entered a new one
        if (credentials.accessToken) {
          updateData.accessToken = credentials.accessToken;
        }
        response = await updateWaCredential(existingCredential.id, updateData);
      } else {
        // Add new credentials
        response = await addWaCredential({
          userId: user.id,
          businessId: credentials.businessId,
          phoneNumberId: credentials.phoneNumberId,
          accessToken: credentials.accessToken,
          whatsappUserId: credentials.whatsappUserId,
          phoneNumber: credentials.phoneNumber
        });
      }

      if (response.success && response.data) {
        setExistingCredential(response.data);
        setCredentials(prev => ({ ...prev, accessToken: '' })); // Clear token field
        setConnectionStatus('success');
        setStatusMessage(existingCredential ? 'Credentials updated successfully!' : 'Credentials saved successfully!');
        
        // Generate webhook if not exists
        if (!webhookConfig) {
          const webhookResponse = await generateWebhook({ userId: user.id });
          if (webhookResponse.success && webhookResponse.data) {
            setWebhookConfig(webhookResponse.data);
          }
        }
      } else {
        setConnectionStatus('error');
        setStatusMessage(response.message || 'Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      setConnectionStatus('error');
      setStatusMessage('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyWebhook = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage('Copied to clipboard!');
    setTimeout(() => {
      if (existingCredential) {
        setStatusMessage('Credentials loaded successfully');
      }
    }, 2000);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'success':
        return <MdCheckCircle className="status-icon success" />;
      case 'error':
        return <MdError className="status-icon error" />;
      case 'loading':
        return <MdRefresh className="status-icon testing" />;
      default:
        return <MdInfo className="status-icon info" />;
    }
  };

  if (isLoading) {
    return (
      <div className="whatsapp-settings">
        <div className="page-header">
          <h1>WhatsApp API Settings</h1>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="whatsapp-settings">
      {/* Page Header */}
      <div className="page-header">
        <h1>WhatsApp API Settings</h1>
        <p>Configure your WhatsApp Business API credentials to enable message automation</p>
      </div>

      {/* Connection Status */}
      {connectionStatus !== 'idle' && (
        <div className={`status-card ${connectionStatus}`}>
          {getStatusIcon()}
          <div className="status-content">
            <h3>Connection Status</h3>
            <p>{statusMessage}</p>
          </div>
        </div>
      )}

      {/* Credentials Form */}
      <div className="credentials-form">
        <div className="form-section">
          <h2>API Credentials</h2>
          <p className="section-description">
            Enter your WhatsApp Business API credentials. You can find these in your Meta Business account.
          </p>

          <div className="form-grid">
            {/* Business ID */}
            <div className="form-group">
              <label htmlFor="businessId">WhatsApp Business ID *</label>
              <input
                type="text"
                id="businessId"
                value={credentials.businessId}
                onChange={(e) => handleInputChange('businessId', e.target.value)}
                placeholder="Enter your WhatsApp Business ID"
                className="form-input"
                required
              />
              <small className="form-help">
                Your unique WhatsApp Business Account ID from Meta Business Manager
              </small>
            </div>

            {/* Phone Number ID */}
            <div className="form-group">
              <label htmlFor="phoneNumberId">Phone Number ID *</label>
              <input
                type="text"
                id="phoneNumberId"
                value={credentials.phoneNumberId}
                onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
                placeholder="Enter your Phone Number ID"
                className="form-input"
                required
              />
              <small className="form-help">
                The ID of your registered WhatsApp Business phone number
              </small>
            </div>

            {/* Access Token */}
            <div className="form-group full-width">
              <label htmlFor="accessToken">
                Access Token {existingCredential ? '(leave blank to keep current)' : '*'}
              </label>
              <div className="token-input-container">
                <input
                  type={showToken ? "text" : "password"}
                  id="accessToken"
                  value={credentials.accessToken}
                  onChange={(e) => handleInputChange('accessToken', e.target.value)}
                  placeholder={existingCredential ? "Enter new token to update" : "Enter your Access Token"}
                  className="form-input token-input"
                  required={!existingCredential}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              <small className="form-help">
                Your WhatsApp Business API access token (keep this secure)
              </small>
            </div>

            {/* WhatsApp User ID */}
            <div className="form-group">
              <label htmlFor="whatsappUserId">WhatsApp User ID *</label>
              <input
                type="text"
                id="whatsappUserId"
                value={credentials.whatsappUserId}
                onChange={(e) => handleInputChange('whatsappUserId', e.target.value)}
                placeholder="Enter WhatsApp User ID"
                className="form-input"
                required
              />
              <small className="form-help">
                Your WhatsApp Business User ID for webhook verification
              </small>
            </div>

            {/* Connected Phone Number */}
            <div className="form-group">
              <label htmlFor="phoneNumber">Connected Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                value={credentials.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+1234567890"
                className="form-input"
                required
              />
              <small className="form-help">
                The phone number registered with your WhatsApp Business account
              </small>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="form-section">
          <h2>Setup Instructions</h2>
          <div className="instructions-card">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create WhatsApp Business Account</h4>
                <p>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">Meta Business Manager</a> and create a WhatsApp Business account</p>
              </div>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Get API Credentials</h4>
                <p>Navigate to WhatsApp API section and copy your Business ID, Phone Number ID, and generate an Access Token</p>
              </div>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Configure Webhook</h4>
                <p>Set up webhook URL in Meta Business Manager to receive incoming messages</p>
              </div>
            </div>
            
            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Test Connection</h4>
                <p>Enter your credentials above and click "Test Connection" to verify everything is working</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <MdSave />
            {isSaving ? 'Saving...' : existingCredential ? 'Update Settings' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Webhook Configuration */}
      {webhookConfig && (
        <div className="config-summary">
          <h3>Webhook Configuration</h3>
          <p className="section-description">
            Use these values to configure your webhook in Meta Business Manager
          </p>
          <div className="config-grid">
            <div className="config-item full-width">
              <span className="config-label">Callback URL:</span>
              <div className="config-value-with-copy">
                <code className="config-value">{webhookConfig.callbackUrl}</code>
                <button 
                  className="copy-btn" 
                  onClick={() => handleCopyWebhook(webhookConfig.callbackUrl)}
                  title="Copy to clipboard"
                >
                  <MdContentCopy />
                </button>
              </div>
            </div>
            <div className="config-item full-width">
              <span className="config-label">Verify Token:</span>
              <div className="config-value-with-copy">
                <code className="config-value">{webhookConfig.verifyToken}</code>
                <button 
                  className="copy-btn" 
                  onClick={() => handleCopyWebhook(webhookConfig.verifyToken)}
                  title="Copy to clipboard"
                >
                  <MdContentCopy />
                </button>
              </div>
            </div>
            <div className="config-item">
              <span className="config-label">Status:</span>
              <span className={`config-status ${webhookConfig.isActive ? 'success' : 'error'}`}>
                {webhookConfig.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current Credentials Summary */}
      {existingCredential && (
        <div className="config-summary">
          <h3>Saved Credentials</h3>
          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Business ID:</span>
              <span className="config-value">{existingCredential.businessId}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Phone Number ID:</span>
              <span className="config-value">{existingCredential.phoneNumberId}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Phone Number:</span>
              <span className="config-value">{existingCredential.phoneNumber}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Created:</span>
              <span className="config-value">
                {new Date(existingCredential.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSettings;

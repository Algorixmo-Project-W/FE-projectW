import React, { useState, useMemo, useEffect } from 'react';
import { 
  MdSearch, 
  MdFilterList, 
  MdDownload,
  MdMessage,
  MdImage,
  MdCheckCircle,
  MdError,
  MdRefresh,
  MdClose
} from 'react-icons/md';
import { getMessagesByUserId, getCampaignsByUserId } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { Message as ApiMessage, Campaign } from '../../types/api.types';

interface ConversationMessage {
  id: string;
  sender: 'customer' | 'business';
  messageType: 'text' | 'image';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Conversation modal state
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ApiMessage | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const [messagesResult, campaignsResult] = await Promise.all([
        getMessagesByUserId(user.id),
        getCampaignsByUserId(user.id)
      ]);

      if (messagesResult.success && messagesResult.data) {
        setMessages(messagesResult.data);
      } else {
        setError(messagesResult.message || 'Failed to fetch messages');
      }

      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get campaign name by ID
  const getCampaignName = (campaignId: string | null): string => {
    if (!campaignId) return 'N/A';
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || 'Unknown';
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Search filter (phone number or message content)
      const matchesSearch = 
        message.senderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.messageContent.toLowerCase().includes(searchQuery.toLowerCase());

      // Campaign filter
      const matchesCampaign = 
        selectedCampaign === 'all' || message.campaignId === selectedCampaign;

      // Status filter
      const matchesStatus = 
        selectedStatus === 'all' || message.replyStatus === selectedStatus;

      return matchesSearch && matchesCampaign && matchesStatus;
    });
  }, [messages, searchQuery, selectedCampaign, selectedStatus]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Phone Number', 'Message Type', 'Message Content', 'Campaign', 'Reply Status', 'Received At'];
    const csvData = filteredMessages.map(msg => [
      msg.senderNumber,
      msg.messageType,
      msg.messageContent,
      getCampaignName(msg.campaignId),
      msg.replyStatus,
      msg.receivedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `messages_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <MdCheckCircle className="status-icon success" />;
      case 'failed':
        return <MdError className="status-icon error" />;
      case 'pending':
        return <MdRefresh className="status-icon pending" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open conversation modal
  const handleOpenConversation = (message: ApiMessage) => {
    setSelectedContact(message);
    
    // Load conversation history for this contact
    const msgTimestamp = new Date(message.receivedAt);
    const conversationData: ConversationMessage[] = [
      {
        id: '1',
        sender: 'customer',
        messageType: message.messageType as 'text' | 'image',
        content: message.messageContent,
        timestamp: msgTimestamp,
        status: 'read'
      }
    ];
    
    // Add reply if it exists
    if (message.replyContent) {
      // Parse image replies: "[Image: URL] caption" format
      const imageMatch = message.replyContent.match(/^\[Image: (.+?)\]\s*(.*)$/);
      if (imageMatch) {
        const imageUrl = imageMatch[1];
        const caption = imageMatch[2];
        // Add image bubble
        conversationData.push({
          id: '2',
          sender: 'business',
          messageType: 'image',
          content: imageUrl,
          timestamp: new Date(message.createdAt),
          status: message.replyStatus === 'sent' ? 'delivered' : 'sent'
        });
        // Add caption as separate text bubble if exists
        if (caption) {
          conversationData.push({
            id: '3',
            sender: 'business',
            messageType: 'text',
            content: caption,
            timestamp: new Date(message.createdAt),
            status: message.replyStatus === 'sent' ? 'delivered' : 'sent'
          });
        }
      } else {
        conversationData.push({
          id: '2',
          sender: 'business',
          messageType: 'text',
          content: message.replyContent,
          timestamp: new Date(message.createdAt),
          status: message.replyStatus === 'sent' ? 'delivered' : 'sent'
        });
      }
    }
    
    setConversationMessages(conversationData);
    setIsConversationOpen(true);
  };

  // Close conversation modal
  const handleCloseConversation = () => {
    setIsConversationOpen(false);
    setSelectedContact(null);
    setConversationMessages([]);
  };

  const formatConversationTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="messages-page">
      {/* Page Header */}
      <div className="messages-header">
        <div className="header-content">
          <div>
            <h1>Messages</h1>
            <p>View and manage incoming WhatsApp messages</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn secondary" onClick={fetchData} disabled={loading}>
              <MdRefresh className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={handleExportCSV}>
              <MdDownload />
              Export to CSV
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
      <div className="messages-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <MdMessage />
          </div>
          <div className="stat-info">
            <h3>{messages.length}</h3>
            <p>Total Messages</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <MdCheckCircle />
          </div>
          <div className="stat-info">
            <h3>{messages.filter(m => m.replyStatus === 'sent').length}</h3>
            <p>Successfully Replied</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon error">
            <MdError />
          </div>
          <div className="stat-info">
            <h3>{messages.filter(m => m.replyStatus === 'failed').length}</h3>
            <p>Failed Replies</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="messages-filters">
        <div className="search-box">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by phone number or message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <MdFilterList />
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing <strong>{filteredMessages.length}</strong> of <strong>{messages.length}</strong> messages
        </p>
      </div>

      {/* Messages Table */}
      <div className="messages-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
        <table className="messages-table">
          <thead>
            <tr>
              <th>Phone Number</th>
              <th>Type</th>
              <th>Message</th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Received At</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  <div className="empty-state">
                    <MdMessage className="empty-icon" />
                    <p>No messages found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMessages.map(message => (
                <tr 
                  key={message.id} 
                  onClick={() => handleOpenConversation(message)}
                  className="clickable-row"
                >
                  <td>
                    <span className="phone-number">{message.senderNumber}</span>
                  </td>
                  <td>
                    <div className="message-type">
                      {message.messageType === 'text' ? (
                        <MdMessage className="type-icon" />
                      ) : (
                        <MdImage className="type-icon" />
                      )}
                      <span>{message.messageType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="message-content">
                      {message.messageType === 'text' ? (
                        <p>{message.messageContent}</p>
                      ) : (
                        <a href={message.messageContent} target="_blank" rel="noopener noreferrer">
                          View Image
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="campaign-badge">{getCampaignName(message.campaignId)}</span>
                  </td>
                  <td>
                    <div className={`status-badge ${message.replyStatus}`}>
                      {getStatusIcon(message.replyStatus)}
                      <span>{message.replyStatus}</span>
                    </div>
                  </td>
                  <td>
                    <span className="timestamp">{formatTimestamp(message.receivedAt)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* Conversation Modal */}
      {isConversationOpen && selectedContact && (
        <div className="modal-overlay" onClick={handleCloseConversation}>
          <div className="conversation-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="conversation-header">
              <div className="contact-info">
                <div className="contact-avatar">
                  {selectedContact.senderNumber.slice(-2)}
                </div>
                <div>
                  <h3>{selectedContact.senderNumber}</h3>
                  <p className="contact-campaign">{getCampaignName(selectedContact.campaignId)}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseConversation}>
                <MdClose />
              </button>
            </div>

            {/* Messages Area */}
            <div className="conversation-body">
              {conversationMessages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`conversation-message ${msg.sender}`}
                >
                  <div className="message-bubble">
                    {msg.messageType === 'text' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <img src={msg.content} alt="Message attachment" className="message-image" />
                    )}
                    <div className="message-meta">
                      <span className="message-time">{formatConversationTime(msg.timestamp)}</span>
                      {msg.sender === 'business' && (
                        <span className={`message-status ${selectedContact?.replyStatus === 'failed' ? 'failed' : msg.status}`}>
                          {selectedContact?.replyStatus === 'failed' ? '✗' : msg.status === 'sent' ? '✓' : '✓✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Status Footer */}
            <div className="conversation-footer">
              <div className={`reply-status-bar ${selectedContact.replyStatus}`}>
                {selectedContact.replyStatus === 'sent' && <><MdCheckCircle /> Auto-reply sent successfully</>}
                {selectedContact.replyStatus === 'failed' && <><MdError /> Auto-reply failed to send</>}
                {selectedContact.replyStatus === 'pending' && <><MdRefresh /> Auto-reply pending...</>}
                {!selectedContact.replyContent && <span style={{opacity: 0.6}}>No auto-reply configured</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;

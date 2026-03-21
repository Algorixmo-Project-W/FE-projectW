import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MdSearch,
  MdFilterList,
  MdDownload,
  MdMessage,
  MdImage,
  MdCheckCircle,
  MdError,
  MdRefresh,
  MdClose,
  MdSmartToy,
  MdArrowBack,
  MdPerson,
} from 'react-icons/md';
import { getCampaignsByUserId, getMessageThreads, getThreadMessages } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { MessageThread, ThreadMessage, Campaign } from '../../types/api.types';

const Messages: React.FC = () => {
  const { user } = useAuth();

  // ---------- Data state ----------
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [chatHistory, setChatHistory] = useState<ThreadMessage[]>([]);

  // ---------- Loading / error ----------
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------- Selection ----------
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);

  // ---------- Filters ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // ---------- Chat scroll ----------
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // ──────────────────────────────────────────
  // Initial load: fetch campaigns
  // ──────────────────────────────────────────
  useEffect(() => {
    if (user) fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    setLoadingCampaigns(true);
    setError(null);
    const result = await getCampaignsByUserId(user.id);
    if (result.success && result.data) {
      setCampaigns(result.data);
      if (result.data.length > 0) {
        const first = result.data[0];
        setSelectedCampaignId(first.id);
        fetchThreads(first.id);
      }
    } else {
      setError(result.message || 'Failed to fetch campaigns');
    }
    setLoadingCampaigns(false);
  };

  // ──────────────────────────────────────────
  // Fetch thread list for a campaign
  // ──────────────────────────────────────────
  const fetchThreads = async (campaignId: string) => {
    setLoadingThreads(true);
    setError(null);
    setSelectedThread(null);
    setChatHistory([]);
    const result = await getMessageThreads(campaignId);
    if (result.success && result.data) {
      setThreads(result.data);
    } else {
      setError(result.message || 'Failed to fetch threads');
      setThreads([]);
    }
    setLoadingThreads(false);
  };

  // ──────────────────────────────────────────
  // Open a thread → fetch full chat history
  // ──────────────────────────────────────────
  const handleOpenThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    setLoadingChat(true);
    setChatHistory([]);
    const result = await getThreadMessages(selectedCampaignId, thread.senderNumber);
    if (result.success && result.data) {
      setChatHistory(result.data);
    } else {
      setError(result.message || 'Failed to load conversation');
    }
    setLoadingChat(false);
  };

  // Scroll chat to bottom when history loads
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // ──────────────────────────────────────────
  // Campaign switch
  // ──────────────────────────────────────────
  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSearchQuery('');
    setSelectedStatus('all');
    fetchThreads(campaignId);
  };

  // ──────────────────────────────────────────
  // Filtered thread list
  // ──────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      const matchesSearch =
        t.senderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.lastMessageContent.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || t.lastReplyStatus === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [threads, searchQuery, selectedStatus]);

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────
  const getCampaignName = (id: string) =>
    campaigns.find(c => c.id === id)?.name || 'Unknown Campaign';

  const getCampaignType = (id: string) =>
    campaigns.find(c => c.id === id)?.replyType || 'text';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatChatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="thread-status sent"><MdCheckCircle /> Sent</span>;
      case 'failed':
        return <span className="thread-status failed"><MdError /> Failed</span>;
      case 'pending':
        return <span className="thread-status pending"><MdRefresh /> Pending</span>;
      default:
        return <span className="thread-status">{status}</span>;
    }
  };

  const replyTypeIcon = (type: string) => {
    if (type === 'image') return <MdImage />;
    if (type === 'ai') return <MdSmartToy />;
    return <MdMessage />;
  };

  // ──────────────────────────────────────────
  // Export CSV
  // ──────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Phone Number', 'Messages', 'Last Message', 'Last Reply', 'Status', 'Latest At'];
    const rows = filteredThreads.map(t => [
      t.senderNumber,
      t.messageCount,
      t.lastMessageContent,
      t.lastReplyContent ?? '',
      t.lastReplyStatus,
      t.latestAt,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `messages_${selectedCampaignId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  const campaignType = getCampaignType(selectedCampaignId);

  return (
    <div className="messages-page">
      {/* Page Header */}
      <div className="messages-header">
        <div className="header-content">
          <div>
            <h1>Messages</h1>
            <p>View conversations per campaign</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn secondary"
              onClick={() => selectedCampaignId && fetchThreads(selectedCampaignId)}
              disabled={loadingThreads || !selectedCampaignId}
            >
              <MdRefresh className={loadingThreads ? 'spinning' : ''} />
              Refresh
            </button>
            <button className="btn primary" onClick={handleExportCSV} disabled={filteredThreads.length === 0}>
              <MdDownload />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="messages-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><MdMessage /></div>
          <div className="stat-info">
            <h3>{threads.length}</h3>
            <p>Total Conversations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><MdCheckCircle /></div>
          <div className="stat-info">
            <h3>{threads.filter(t => t.lastReplyStatus === 'sent').length}</h3>
            <p>Replied</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon error"><MdError /></div>
          <div className="stat-info">
            <h3>{threads.filter(t => t.lastReplyStatus === 'failed').length}</h3>
            <p>Failed</p>
          </div>
        </div>
      </div>

      {/* Campaign Selector */}
      <div className="campaign-selector-bar">
        <MdFilterList className="selector-icon" />
        <span className="selector-label">Campaign:</span>
        {loadingCampaigns ? (
          <span className="selector-loading">Loading...</span>
        ) : (
          <div className="campaign-tabs">
            {campaigns.map(c => (
              <button
                key={c.id}
                className={`campaign-tab ${selectedCampaignId === c.id ? 'active' : ''}`}
                onClick={() => handleCampaignChange(c.id)}
              >
                <span className={`tab-type-dot ${c.replyType}`}>{replyTypeIcon(c.replyType)}</span>
                {c.name}
              </button>
            ))}
            {campaigns.length === 0 && (
              <span className="no-campaigns-hint">No campaigns found. Create one first.</span>
            )}
          </div>
        )}
      </div>

      {/* Main Panel */}
      {selectedCampaignId ? (
        <div className="messages-panel">
          {/* Thread List Pane */}
          <div className={`thread-list-pane ${selectedThread ? 'hide-mobile' : ''}`}>
            <div className="thread-list-header">
              <div className="thread-search-wrap">
                <MdSearch className="thread-search-icon" />
                <input
                  type="text"
                  className="thread-search-input"
                  placeholder="Search phone or message..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="thread-search-clear" onClick={() => setSearchQuery('')}>
                    <MdClose />
                  </button>
                )}
              </div>
              <select
                className="filter-select thread-status-filter"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="thread-list-count">
              {filteredThreads.length} conversation{filteredThreads.length !== 1 ? 's' : ''}
            </div>

            {loadingThreads ? (
              <div className="thread-loading">
                <div className="spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="thread-empty">
                <MdMessage className="empty-icon" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="thread-items">
                {filteredThreads.map(thread => (
                  <div
                    key={thread.senderNumber}
                    className={`thread-item ${selectedThread?.senderNumber === thread.senderNumber ? 'active' : ''}`}
                    onClick={() => handleOpenThread(thread)}
                  >
                    <div className="thread-avatar">
                      <MdPerson />
                    </div>
                    <div className="thread-info">
                      <div className="thread-top-row">
                        <span className="thread-number">{thread.senderNumber}</span>
                        <span className="thread-time">{formatTime(thread.latestAt)}</span>
                      </div>
                      <div className="thread-preview-row">
                        <span className="thread-preview">{thread.lastMessageContent}</span>
                        <span className="thread-count">{thread.messageCount}</span>
                      </div>
                      <div className="thread-status-row">
                        {getStatusBadge(thread.lastReplyStatus)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Pane */}
          <div className={`chat-pane ${!selectedThread ? 'show-empty' : ''}`}>
            {!selectedThread ? (
              <div className="chat-empty-state">
                <MdMessage className="chat-empty-icon" />
                <h3>Select a conversation</h3>
                <p>Choose a contact from the list to view the full chat history</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="chat-header">
                  <button className="back-btn" onClick={() => setSelectedThread(null)}>
                    <MdArrowBack />
                  </button>
                  <div className="chat-contact-avatar">
                    <MdPerson />
                  </div>
                  <div className="chat-contact-info">
                    <h3>{selectedThread.senderNumber}</h3>
                    <p>
                      <span className={`campaign-type-pill ${campaignType}`}>
                        {replyTypeIcon(campaignType)}
                        {getCampaignName(selectedCampaignId)}
                      </span>
                      &nbsp;· {selectedThread.messageCount} messages
                    </p>
                  </div>
                  <div className="chat-header-status">
                    {getStatusBadge(selectedThread.lastReplyStatus)}
                  </div>
                </div>

                {/* Chat messages */}
                <div className="chat-body" ref={chatBodyRef}>
                  {loadingChat ? (
                    <div className="chat-loading">
                      <div className="spinner"></div>
                      <p>Loading messages...</p>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="chat-no-messages">No messages in this conversation.</div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <React.Fragment key={idx}>
                        {/* Incoming */}
                        <div className="chat-message incoming">
                          <div className="chat-bubble incoming">
                            <p>{msg.messageContent}</p>
                            <span className="chat-time">{formatChatTime(msg.receivedAt)}</span>
                          </div>
                        </div>
                        {/* Outgoing reply */}
                        {msg.replyContent && (
                          <div className="chat-message outgoing">
                            <div className="chat-bubble outgoing">
                              {(() => {
                                const imgMatch = msg.replyContent!.match(/^\[Image: (.+?)\]\s*(.*)$/);
                                if (imgMatch) {
                                  return (
                                    <>
                                      <img src={imgMatch[1]} alt="reply" className="chat-reply-image" />
                                      {imgMatch[2] && <p>{imgMatch[2]}</p>}
                                    </>
                                  );
                                }
                                return <p>{msg.replyContent}</p>;
                              })()}
                              <span className="chat-time">{formatChatTime(msg.receivedAt)}</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>

                {/* Chat footer */}
                <div className="chat-footer">
                  <div className={`chat-footer-status ${selectedThread.lastReplyStatus}`}>
                    {selectedThread.lastReplyStatus === 'sent' && <><MdCheckCircle /> Last auto-reply sent successfully</>}
                    {selectedThread.lastReplyStatus === 'failed' && <><MdError /> Last auto-reply failed</>}
                    {selectedThread.lastReplyStatus === 'pending' && <><MdRefresh /> Reply pending...</>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        !loadingCampaigns && (
          <div className="no-campaign-state">
            <MdMessage className="empty-icon" />
            <p>No campaigns available. Create a campaign first.</p>
          </div>
        )
      )}
    </div>
  );
};

export default Messages;
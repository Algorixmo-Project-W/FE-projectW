import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MdSearch,
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
  MdEmail,
  MdPhone,
  MdWeb,
  MdLockOpen,
  MdLock,
  MdSend,
} from 'react-icons/md';
import { getUserThreads, getUserThread, sendDirectMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { MessageThread, ThreadMessage, WebChatMessage } from '../../types/api.types';

const Messages: React.FC = () => {
  const { user } = useAuth();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [chatHistory, setChatHistory] = useState<ThreadMessage[]>([]);
  const [webChatHistory, setWebChatHistory] = useState<WebChatMessage[]>([]);

  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchThreads();
  }, [user]);

  const fetchThreads = async () => {
    if (!user) return;
    setLoadingThreads(true);
    const result = await getUserThreads(user.id);
    if (result.success && result.data) {
      setThreads(result.data);
    } else {
      setThreads([]);
    }
    setLoadingThreads(false);
  };

  const handleOpenThread = async (thread: MessageThread) => {
    setSelectedThread(thread);
    setShowContactInfo(false);
    setLoadingChat(true);
    setChatHistory([]);
    setWebChatHistory([]);

    if (!user) return;
    const result = await getUserThread(user.id, thread.senderNumber);
    if (result.success && result.data) {
      setChatHistory(result.data);
    } else {
      setError(result.message || 'Failed to load conversation');
    }
    setLoadingChat(false);
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [chatHistory]);

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

  const isWithin24h = (iso: string) =>
    Date.now() - new Date(iso).getTime() < 24 * 60 * 60 * 1000;

  const handleSendReply = async () => {
    if (!user || !selectedThread || !replyText.trim()) return;
    setSendingReply(true);
    setSendError(null);
    const result = await sendDirectMessage(user.id, selectedThread.senderNumber, replyText.trim());
    if (result.success) {
      setReplyText('');
      await handleOpenThread(selectedThread);
    } else {
      setSendError(result.message || 'Failed to send');
    }
    setSendingReply(false);
  };

  const replyTypeIcon = (type: string) => {
    if (type === 'image') return <MdImage />;
    if (type === 'ai') return <MdSmartToy />;
    return <MdMessage />;
  };

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
    a.download = `messages_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-content">
          <div>
            <h1>Messages</h1>
            <p>Direct conversations</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn secondary"
              onClick={fetchThreads}
              disabled={loadingThreads}
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

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

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

      <div className="messages-panel">
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
                      <span className="thread-number">{thread.contactName ?? thread.senderNumber}</span>
                      <span className="thread-time">{formatTime(thread.latestAt)}</span>
                    </div>
                    {thread.contactEmail && (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '2px' }}>
                        {thread.contactEmail}
                      </div>
                    )}
                    <div className="thread-preview-row">
                      <span className="thread-preview">{thread.lastMessageContent}</span>
                      <span className="thread-count">{thread.messageCount}</span>
                    </div>
                    <div className="thread-status-row">
                      {getStatusBadge(thread.lastReplyStatus)}
                      {isWithin24h(thread.latestAt)
                        ? <span className="reply-window open"><MdLockOpen /> Reply open</span>
                        : <span className="reply-window closed"><MdLock /> Window closed</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`chat-pane ${!selectedThread ? 'show-empty' : ''}`}>
          {!selectedThread ? (
            <div className="chat-empty-state">
              <MdMessage className="chat-empty-icon" />
              <h3>Select a conversation</h3>
              <p>Choose a contact from the list to view the full chat history</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button className="back-btn" onClick={() => setSelectedThread(null)}>
                  <MdArrowBack />
                </button>
                <div className="chat-contact-avatar">
                  <MdPerson />
                </div>
                <div className="chat-contact-info">
                  <h3>{selectedThread.contactName ?? selectedThread.senderNumber}</h3>
                  <p>{selectedThread.messageCount} messages</p>
                </div>
                <div className="chat-header-status" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusBadge(selectedThread.lastReplyStatus)}
                  {selectedThread.contactName && (
                    <button
                      className={`contact-info-toggle ${showContactInfo ? 'active' : ''}`}
                      onClick={() => setShowContactInfo(v => !v)}
                      title="View contact info"
                    >
                      <MdPerson />
                    </button>
                  )}
                </div>
              </div>

              {isWithin24h(selectedThread.latestAt) ? (
                <div className="reply-window-banner open">
                  <MdLockOpen /> Reply window open — last message within 24 hours
                </div>
              ) : (
                <div className="reply-window-banner closed">
                  <MdLock /> Reply window closed — last message was over 24 hours ago
                </div>
              )}

              {showContactInfo && selectedThread.contactName && (
                <div className="contact-info-panel">
                  <div className="contact-info-panel-header">
                    <div className="contact-info-avatar"><MdPerson /></div>
                    <div>
                      <div className="contact-info-name">{selectedThread.contactName}</div>
                      <div className="contact-info-badge"><MdWeb /> Web Chat</div>
                    </div>
                  </div>
                  <div className="contact-info-rows">
                    {selectedThread.contactEmail && (
                      <div className="contact-info-row">
                        <MdEmail className="contact-info-icon" />
                        <span>{selectedThread.contactEmail}</span>
                      </div>
                    )}
                    {selectedThread.contactPhone && (
                      <div className="contact-info-row">
                        <MdPhone className="contact-info-icon" />
                        <span>{selectedThread.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      <div className="chat-message incoming">
                        <div className="chat-bubble incoming">
                          <p>{msg.messageContent}</p>
                          <span className="chat-time">{formatChatTime(msg.receivedAt)}</span>
                        </div>
                      </div>
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

              <div className="chat-footer">
                <div className={`chat-footer-status ${selectedThread.lastReplyStatus}`}>
                  {selectedThread.lastReplyStatus === 'sent' && <><MdCheckCircle /> Last auto-reply sent successfully</>}
                  {selectedThread.lastReplyStatus === 'failed' && <><MdError /> Last auto-reply failed</>}
                  {selectedThread.lastReplyStatus === 'pending' && <><MdRefresh /> Reply pending...</>}
                </div>
                {isWithin24h(selectedThread.latestAt) && (
                  <div className="chat-reply-input-row">
                    {sendError && <div className="chat-reply-error"><MdError /> {sendError}</div>}
                    <div className="chat-reply-input-wrap">
                      <textarea
                        className="chat-reply-textarea"
                        placeholder="Type a reply..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        rows={1}
                        disabled={sendingReply}
                      />
                      <button
                        className="chat-reply-send-btn"
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                      >
                        {sendingReply ? <MdRefresh className="spinning" /> : <MdSend />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

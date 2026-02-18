import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './chat-bot.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const [conversations, setConversations] = useState([]);
  const [showConversations, setShowConversations] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editingSidebarSessionId, setEditingSidebarSessionId] = useState(null);
  const [editingSidebarTitle, setEditingSidebarTitle] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize session and load conversation history
  useEffect(() => {
    const initializeSession = async () => {
      let storedSessionId = localStorage.getItem('chatSessionId');
      
      if (!storedSessionId) {
        storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chatSessionId', storedSessionId);
      }
      
      setSessionId(storedSessionId);
      
      try {
        const res = await axios.get(`http://localhost:8081/api/conversation/${storedSessionId}`);
        setMessages(res.data.messages || []);
        setConversationTitle(res.data.title || 'New Chat');
      } catch (e) {
        console.log('No previous conversation found, starting new chat');
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Load all conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await axios.get('http://localhost:8081/api/conversations');
        setConversations(res.data || []);
      } catch (e) {
        console.log('Failed to load conversations');
      }
    };

    loadConversations();
  }, [sessionId]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8081/api/chat', { 
        messages: [userMsg],
        sessionId: sessionId
      });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      
      // Reload conversations to update title and timestamps
      const convRes = await axios.get('http://localhost:8081/api/conversations');
      setConversations(convRes.data || []);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (e?.message || 'Unknown error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const startNewConversation = () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatSessionId', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setConversationTitle('New Chat');
    setEditingTitle(false);
  };

  const switchConversation = async (conv) => {
    localStorage.setItem('chatSessionId', conv.sessionId);
    setSessionId(conv.sessionId);
    setConversationTitle(conv.title);
    setEditingTitle(false);
    
    try {
      console.log('Loading conversation:', conv.sessionId);
      const res = await axios.get(`http://localhost:8081/api/conversation/${conv.sessionId}`);
      console.log('Conversation data received:', res.data);
      
      // Ensure messages are in correct format with role and content
      const msgs = res.data.messages || [];
      console.log('Number of messages:', msgs.length);
      
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load conversation:', e.message);
      alert('Error loading conversation: ' + e.message);
    }
  };

  const handleRenameTitle = async () => {
    if (!editTitleInput.trim()) return;
    
    try {
      await axios.put(`http://localhost:8081/api/conversation/${sessionId}/rename`, {
        title: editTitleInput
      });
      setConversationTitle(editTitleInput);
      setEditingTitle(false);
      
      // Reload conversations
      const convRes = await axios.get('http://localhost:8081/api/conversations');
      setConversations(convRes.data || []);
    } catch (e) {
      console.log('Failed to rename conversation');
    }
  };

  const handleRenameSidebarConversation = async (convSessionId) => {
    if (!editingSidebarTitle.trim()) {
      setEditingSidebarSessionId(null);
      return;
    }
    
    try {
      await axios.put(`http://localhost:8081/api/conversation/${convSessionId}/rename`, {
        title: editingSidebarTitle
      });
      
      // If editing current conversation, update header too
      if (convSessionId === sessionId) {
        setConversationTitle(editingSidebarTitle);
      }
      
      setEditingSidebarSessionId(null);
      setEditingSidebarTitle('');
      
      // Reload conversations
      const convRes = await axios.get('http://localhost:8081/api/conversations');
      setConversations(convRes.data || []);
    } catch (e) {
      console.error('Failed to rename conversation:', e);
    }
  };

  // Smooth scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Keep input focused when bot finishes typing
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, Arial"
      }}>
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "system-ui, Arial" }}>
      {/* Sidebar */}
      <div style={{
        width: showConversations ? 250 : 0,
        background: '#f8f8f8',
        transition: 'width 0.3s',
        overflow: 'hidden',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: 15, borderBottom: '1px solid #ddd' }}>
          <button
            onClick={startNewConversation}
            style={{
              width: '100%',
              padding: '10px',
              background: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            + New Chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {conversations.map((conv, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                margin: '5px 0',
                background: conv.sessionId === sessionId ? '#e0e0e0' : '#fff',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: conv.sessionId === sessionId ? 'bold' : 'normal',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
              title={conv.title}
            >
              {editingSidebarSessionId === conv.sessionId ? (
                // Edit mode
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    autoFocus
                    value={editingSidebarTitle}
                    onChange={(e) => setEditingSidebarTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameSidebarConversation(conv.sessionId);
                      }
                      if (e.key === 'Escape') {
                        setEditingSidebarSessionId(null);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #007AFF',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'inherit'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameSidebarConversation(conv.sessionId);
                    }}
                    style={{
                      padding: '6px 10px',
                      background: '#007AFF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                // View mode
                <div>
                  <div 
                    onClick={() => {
                      switchConversation(conv);
                    }}
                    style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSidebarSessionId(conv.sessionId);
                        setEditingSidebarTitle(conv.title);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      title="Edit conversation name"
                    >
                      ✏️
                    </button>
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#666',
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis'
                  }}>
                    {conv.messageCount} messages
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {/* Header */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FCFAF6'
        }}>
          <button
            onClick={() => setShowConversations(!showConversations)}
            style={{
              padding: '6px 12px',
              background: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showConversations ? '◀ Hide' : '▶ Show'}
          </button>

          <div style={{ flex: 1, margin: '0 20px' }}>
            {editingTitle ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  autoFocus
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid #007AFF',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
                <button
                  onClick={handleRenameTitle}
                  style={{
                    padding: '6px 12px',
                    background: '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <h2
                onClick={() => {
                  setEditingTitle(true);
                  setEditTitleInput(conversationTitle);
                }}
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  borderRadius: '4px'
                }}
                title="Click to edit title"
              >
                {conversationTitle}
              </h2>
            )}
          </div>

          <img 
            src="/bytebuddy-logo.png" 
            alt="ByteBuddy Logo" 
            style={{ height: 40 }}
          />
        </div>

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff'
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '16px'
            }}>
              Start a conversation by typing a message below
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
              <div style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 12,
                background: m.role === 'user' ? '#DCF8C6' : '#F1F0F0',
                maxWidth: '70%',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div style={{ textAlign: 'left', margin: '8px 0' }}>
              <div className="message-bubble typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #ddd',
          background: '#FCFAF6'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={isTyping ? "Bot is typing..." : "Type your message..."}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: '14px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #ccc',
                background: '#007AFF',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

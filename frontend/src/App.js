import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './chat-bot.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://localhost:8080/api/chat', { messages: [...messages, userMsg] });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (e?.message || 'Unknown error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  // 🔹 Smooth scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 🔹 Keep input focused when bot finishes typing
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
    }
  }, [isTyping]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, Arial"
      }}
    >
        <div
          style={{
            width: "100%",
            maxWidth: 800,
            background: "#FCFAF6",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}
        >

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <img src="/bytebuddy-logo.png" alt="ByteBuddy Logo" style={{ height: 80, marginRight: 12 }} />
          <span style={{ fontSize: "28px", fontWeight: "bold", color: "#222" }}>ByteBuddy</span>
        </div>


        {/* Chat window */}
        <div style={{ height: 420, overflowY: 'auto', border: '1px solid #ddd', padding: 12, borderRadius: 8, background: "#fff" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 12,
                background: m.role === 'user' ? '#DCF8C6' : '#F1F0F0',
                whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Bot typing indicator */}
          {isTyping && (
            <div className="chat-message assistant">
              <div className="message-bubble typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {/* Invisible anchor for scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input + Send button */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isTyping ? "Bot is typing..." : "Type your message..."}
            disabled={isTyping}   // disable during bot reply
            style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc' }}
          />
          <button
            onClick={sendMessage}
            disabled={isTyping}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

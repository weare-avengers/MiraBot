// React Component dengan Markdown Support
// Install dependencies: npm install marked dompurify

import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked.js
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Parse Markdown safely
const parseMarkdown = (text) => {
  const rawHtml = marked.parse(text);
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'code', 'pre'],
    ALLOWED_ATTR: []
  });
};

const ChatBubble = ({ bubble, index }) => {
  return (
    <div 
      className={`bubble bubble-${bubble.type}`}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
      dangerouslySetInnerHTML={{ 
        __html: parseMarkdown(bubble.content) 
      }}
    />
  );
};

const ChatMessage = ({ message, isUser }) => {
  if (isUser) {
    return (
      <div className="message message-user">
        <div className="bubble">{message.text}</div>
      </div>
    );
  }

  return (
    <div className="message message-bot">
      {message.bubbles?.map((bubble, index) => (
        <ChatBubble key={index} bubble={bubble} index={index} />
      ))}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="typing-indicator">
    <div className="typing-dots">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
);

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session-${Date.now()}`);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message
  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        isUser: false,
        bubbles: [
          {
            type: 'intro',
            content: 'Halo! Selamat datang di **Digi Assistant**. 👋'
          },
          {
            type: 'main',
            content: 'Saya siap membantu Anda dengan:\n\n- Informasi tentang layanan **Migrasi**\n- Pertanyaan umum\n- Dan banyak lagi!\n\nApa yang bisa saya bantu hari ini?'
          }
        ]
      }]);
    }, 500);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add user message
    setMessages(prev => [...prev, {
      isUser: true,
      text: userMessage
    }]);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:7000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId.current
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();

      if (data.success && data.bubbles) {
        // Add bot response with bubbles
        setMessages(prev => [...prev, {
          isUser: false,
          bubbles: data.bubbles
        }]);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err.message === 'Failed to fetch'
        ? 'Tidak dapat terhubung ke server'
        : err.message
      );
      
      // Add error message in chat
      setMessages(prev => [...prev, {
        isUser: false,
        bubbles: [{
          type: 'main',
          content: `⚠️ **Error**: ${err.message}`
        }]
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="status-indicator"></div>
        <div>
          <h2>AI Assistant</h2>
          <p>Online • Siap membantu</p>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg} 
            isUser={msg.isUser} 
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik pesan Anda..."
          disabled={isLoading}
          autoComplete="off"
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Kirim
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;

/* ===== CSS (tambahkan ke file CSS terpisah) ===== */

const styles = `
.chat-container {
  width: 100%;
  max-width: 600px;
  height: 90vh;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 10px;
  height: 10px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f9fafb;
}

.message {
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  display: flex;
  justify-content: flex-end;
}

.message-user .bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 18px 18px 4px 18px;
  max-width: 80%;
}

.message-bot {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble {
  background: white;
  padding: 14px 18px;
  border-radius: 18px 18px 18px 4px;
  max-width: 85%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  line-height: 1.6;
}

.bubble-intro {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 3px solid #0ea5e9;
}

.bubble-main {
  background: white;
}

.bubble-cta {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 3px solid #f59e0b;
}

/* Markdown styling */
.bubble strong {
  color: #7c3aed;
  font-weight: 600;
}

.bubble ul, .bubble ol {
  margin: 8px 0;
  padding-left: 20px;
}

.bubble li {
  margin: 6px 0;
  line-height: 1.5;
}

.bubble p {
  margin: 8px 0;
}

.bubble p:first-child {
  margin-top: 0;
}

.bubble p:last-child {
  margin-bottom: 0;
}

.bubble code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.typing-indicator {
  padding: 12px 18px;
  background: white;
  border-radius: 18px 18px 18px 4px;
  max-width: 80px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.typing-dots {
  display: flex;
  gap: 4px;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input-container {
  padding: 20px;
  background: white;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.chat-input-container input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.chat-input-container input:focus {
  border-color: #667eea;
}

.chat-input-container button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.chat-input-container button:hover {
  transform: translateY(-2px);
}

.chat-input-container button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #dc2626;
  margin: 10px 0;
}
`;

# Digi AI Assistant - API Documentation untuk Frontend

## 📋 Daftar Isi
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Chat Endpoints](#chat-endpoints)
- [Knowledge Base Endpoints](#knowledge-base-endpoints)
- [Error Handling](#error-handling)
- [Contoh Implementasi](#contoh-implementasi)

---

## Base URL

```
http://localhost:7000
```

> **Note**: Sesuaikan dengan URL server Anda. Untuk production, gunakan domain/IP server Anda.

---

## Authentication

API ini menggunakan **session-based authentication** dengan cookies. Pastikan frontend Anda mengirim credentials:

```javascript
fetch(url, {
  credentials: 'include', // PENTING: untuk mengirim cookies
  // ... options lainnya
})
```

---

## Chat Endpoints

### 1. Regular Chat (Non-Streaming)

Kirim pesan ke chatbot dan terima response lengkap.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "Apa itu Migrasi?",
  "sessionId": "user-123" // Optional, default: "default"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Response generated",
  "bubbles": [
    {
      "type": "intro",
      "content": "Terima kasih atas pertanyaannya!",
      "format": "markdown"
    },
    {
      "type": "main",
      "content": "**Migrasi** menawarkan berbagai layanan IT:\n\n- Website Development\n- Big Data & AI\n- Cybersecurity",
      "format": "markdown"
    }
  ],
  "response": "Terima kasih atas pertanyaannya!|||**Migrasi** menawarkan...",
  "sessionId": "user-123"
}
```

> ⚡ **NEW: Markdown Support!**  
> Bot sekarang mengirim response dalam **Markdown format** untuk tampilan yang lebih rapi!
> - `bubbles`: Array of bubble objects (1-3 bubbles based on complexity)
> - `type`: Bubble type: `intro`, `main`, atau `cta`
> - `content`: Markdown formatted text (use marked.js to parse)
> - `format`: Always `"markdown"` - frontend harus parse dengan marked.js + DOMPurify
> 
> 📖 **Lihat**: [MARKDOWN_GUIDE.md](./MARKDOWN_GUIDE.md) untuk implementasi lengkap

**Response Error - Timeout** (503):
```json
{
  "success": false,
  "error": "Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian"
}
```

**Response Error - Bad Request** (400):
```json
{
  "success": false,
  "error": "Message is required"
}
```

**Response Error - Server Error** (500):
```json
{
  "success": false,
  "error": "Failed to process chat message",
  "details": "Error message details"
}
```

---

### 2. Streaming Chat (SSE - Server-Sent Events)

Kirim pesan dan terima response secara real-time (streaming).

**Endpoint**: `POST /api/chat/stream`

**Request Body**:
```json
{
  "message": "Apa itu Migrasi?",
  "sessionId": "user-123" // Optional
}
```

**Response**: Server-Sent Events (SSE)

**Event Format**:
```javascript
// Chunk data (content streaming)
data: {"chunk":"Migrasi"}

// Done event (selesai)
data: {"done":true}

// Error event
data: {"error":"Error message"}

// Timeout error
data: {"error":"Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian","timeout":true}
```

---

### 3. Get Conversation History

Dapatkan riwayat percakapan berdasarkan sessionId.

**Endpoint**: `GET /api/chat/:sessionId`

**Response**:
```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "content": "Halo"
    },
    {
      "role": "assistant",
      "content": "Halo! Ada yang bisa saya bantu?"
    }
  ],
  "sessionId": "user-123"
}
```

---

### 4. Clear Conversation History

Hapus riwayat percakapan.

**Endpoint**: `DELETE /api/chat/:sessionId`

**Response**:
```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

---

## Knowledge Base Endpoints

### 1. Upload Document

Upload dokumen ke knowledge base (PDF, DOCX, TXT).

**Endpoint**: `POST /api/knowledge/upload`

**Request**: multipart/form-data
```
file: [File object]
```

**Response**:
```json
{
  "success": true,
  "message": "Document uploaded and processed successfully",
  "filename": "document.pdf",
  "chunks": 45,
  "vectorsStored": 45
}
```

---

### 2. Bulk Upload Documents

Upload multiple documents sekaligus.

**Endpoint**: `POST /api/knowledge/upload/bulk`

**Request**: multipart/form-data
```
files: [Array of File objects]
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Deskripsi |
|-------------|-----------|
| 200 | Success |
| 400 | Bad Request (missing params) |
| 500 | Server Error |
| 503 | Service Unavailable (timeout) |

### Timeout Handling

⏱️ **Request Timeout: 10 detik**

Jika response dari AI model lebih dari 10 detik, request akan dibatalkan dan mengembalikan error:

```json
{
  "success": false,
  "error": "Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian"
}
```

**Best Practice**: 
- Tampilkan loading indicator saat menunggu response
- Handle timeout error dengan retry mechanism
- Tampilkan pesan error yang user-friendly

---

## Contoh Implementasi

### 1. Regular Chat (Vanilla JavaScript)

```javascript
async function sendMessage(message, sessionId = 'default') {
  try {
    const response = await fetch('http://localhost:7000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Penting untuk session
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    const data = await response.json();

    if (!data.success) {
      // Handle error
      if (response.status === 503) {
        // Timeout error
        console.error('Timeout:', data.error);
        alert(data.error);
      } else {
        console.error('Error:', data.error);
      }
      return null;
    }

    return data.response;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Penggunaan
sendMessage('Apa itu Migrasi?', 'user-123')
  .then(response => {
    if (response) {
      console.log('AI Response:', response);
      // Tampilkan response di UI
    }
  });
```

---

### 2. Streaming Chat (Vanilla JavaScript)

```javascript
async function sendStreamingMessage(message, sessionId = 'default', onChunk, onComplete, onError) {
  try {
    const response = await fetch('http://localhost:7000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onComplete(fullMessage);
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.chunk) {
            fullMessage += data.chunk;
            onChunk(data.chunk, fullMessage);
          } else if (data.done) {
            onComplete(fullMessage);
            return;
          } else if (data.error) {
            onError(data.error, data.timeout);
            return;
          }
        }
      }
    }
  } catch (error) {
    onError(error.message, false);
  }
}

// Penggunaan
sendStreamingMessage(
  'Apa itu Migrasi?',
  'user-123',
  // onChunk: dipanggil setiap ada data baru
  (chunk, fullMessage) => {
    console.log('New chunk:', chunk);
    // Update UI dengan chunk baru
    document.getElementById('response').textContent = fullMessage;
  },
  // onComplete: dipanggil saat selesai
  (fullMessage) => {
    console.log('Complete message:', fullMessage);
    // Tambahkan styling "complete"
  },
  // onError: dipanggil jika ada error
  (error, isTimeout) => {
    console.error('Error:', error);
    if (isTimeout) {
      alert('Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian');
    }
  }
);
```

---

### 3. React Implementation (Functional Component)

```jsx
import { useState } from 'react';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('http://localhost:7000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          sessionId: 'user-123'
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setResponse(data.response);
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {response && (
          <div className="assistant-message">{response}</div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ketik pesan..."
          disabled={isLoading}
        />
        <button 
          onClick={sendMessage}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </div>
  );
}
```

---

### 4. React Streaming Chat

```jsx
import { useState, useRef } from 'react';

function StreamingChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const sendStreamingMessage = async () => {
    setIsStreaming(true);
    setError(null);
    setResponse('');

    // Create abort controller untuk cancel request
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('http://localhost:7000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          sessionId: 'user-123'
        }),
        signal: abortControllerRef.current.signal
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              fullMessage += data.chunk;
              setResponse(fullMessage);
            } else if (data.done) {
              return;
            } else if (data.error) {
              setError(data.error);
              return;
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Network error: ' + err.message);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const cancelStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {response && (
          <div className="assistant-message">
            {response}
            {isStreaming && <span className="cursor">▊</span>}
          </div>
        )}
        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isStreaming && sendStreamingMessage()}
          placeholder="Ketik pesan..."
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button onClick={cancelStreaming}>
            Stop
          </button>
        ) : (
          <button 
            onClick={sendStreamingMessage}
            disabled={!message.trim()}
          >
            Kirim
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### 5. Upload Document (Vanilla JavaScript)

```javascript
async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:7000/api/knowledge/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await response.json();
    
    if (!data.success) {
      console.error('Upload error:', data.error);
      return false;
    }

    console.log('Upload success:', data);
    return true;
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}

// Penggunaan dengan file input
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const success = await uploadDocument(file);
    if (success) {
      alert('Document uploaded successfully!');
    }
  }
});
```

---

### 6. Vue.js Implementation

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-if="response" class="assistant-message">
        {{ response }}
      </div>
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    
    <div class="input-container">
      <input
        v-model="message"
        @keyup.enter="sendMessage"
        type="text"
        placeholder="Ketik pesan..."
        :disabled="isLoading"
      />
      <button 
        @click="sendMessage"
        :disabled="isLoading || !message.trim()"
      >
        {{ isLoading ? 'Mengirim...' : 'Kirim' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '',
      response: '',
      isLoading: false,
      error: null,
      sessionId: 'user-123'
    }
  },
  methods: {
    async sendMessage() {
      if (!this.message.trim()) return;
      
      this.isLoading = true;
      this.error = null;
      this.response = '';

      try {
        const res = await fetch('http://localhost:7000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: this.message,
            sessionId: this.sessionId
          })
        });

        const data = await res.json();

        if (!data.success) {
          this.error = data.error;
          return;
        }

        this.response = data.response;
        this.message = '';
      } catch (err) {
        this.error = 'Network error: ' + err.message;
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>
```

---

## 🎯 Best Practices

### 1. Session Management
- Gunakan unique sessionId untuk setiap user
- SessionId disimpan di localStorage atau cookies
- Format: `user-{userId}` atau `anon-{randomId}`

```javascript
// Generate or get sessionId
function getSessionId() {
  let sessionId = localStorage.getItem('chatSessionId');
  if (!sessionId) {
    sessionId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatSessionId', sessionId);
  }
  return sessionId;
}
```

### 2. Loading States
Selalu tampilkan loading indicator saat menunggu response:

```javascript
// Show loading
showLoading();

try {
  const response = await sendMessage(message);
  displayResponse(response);
} catch (error) {
  displayError(error);
} finally {
  hideLoading();
}
```

### 3. Error Handling
Handle berbagai tipe error dengan pesan yang user-friendly:

```javascript
function handleChatError(error, statusCode) {
  if (statusCode === 503) {
    // Timeout
    return 'Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian';
  } else if (statusCode === 400) {
    // Bad request
    return 'Pesan tidak boleh kosong';
  } else if (statusCode >= 500) {
    // Server error
    return 'Terjadi kesalahan pada server. Silahkan coba lagi.';
  } else {
    // Network error
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }
}
```

### 4. Retry Mechanism untuk Timeout
Tambahkan automatic retry untuk timeout error:

```javascript
async function sendMessageWithRetry(message, maxRetries = 2) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const response = await fetch('http://localhost:7000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, sessionId: getSessionId() })
      });

      const data = await response.json();

      if (response.status === 503 && attempts < maxRetries - 1) {
        // Timeout, retry
        attempts++;
        console.log(`Retrying... (${attempts}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        continue;
      }

      return data;
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
```

### 5. Message History UI
Simpan dan tampilkan history percakapan:

```javascript
class ChatHistory {
  constructor() {
    this.messages = [];
  }

  addMessage(role, content) {
    this.messages.push({
      role: role, // 'user' atau 'assistant'
      content: content,
      timestamp: new Date().toISOString()
    });
  }

  renderMessages() {
    const container = document.getElementById('messages');
    container.innerHTML = this.messages.map(msg => `
      <div class="message ${msg.role}">
        <div class="content">${msg.content}</div>
        <div class="timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</div>
      </div>
    `).join('');
  }
}
```

---

## 🔒 Security Notes

1. **CORS**: Sudah dikonfigurasi, tapi untuk production sebaiknya batasi origin:
   ```javascript
   // Di server.js, ubah:
   app.use(cors({
     origin: 'https://your-frontend-domain.com',
     credentials: true
   }));
   ```

2. **Session Cookie**: Untuk production, gunakan secure cookies (HTTPS):
   ```javascript
   cookie: { 
     secure: true,      // HTTPS only
     httpOnly: true,    // Tidak bisa diakses JavaScript
     sameSite: 'strict' // CSRF protection
   }
   ```

3. **Rate Limiting**: Pertimbangkan untuk menambahkan rate limiting di backend.

---

## 📱 Testing dengan HTML

File test sudah tersedia di folder `examples/`:
- `examples/chat-client.html` - Test regular chat
- `examples/test-openrouter.html` - Test dengan OpenRouter

---

## 🚀 Quick Start Checklist

- [ ] Server running di `http://localhost:7000`
- [ ] Test endpoint `/health` untuk memastikan server hidup
- [ ] Pastikan CORS enabled dengan `credentials: 'include'`
- [ ] Generate unique sessionId untuk setiap user
- [ ] Implement error handling untuk timeout (503)
- [ ] Tambahkan loading indicator
- [ ] Test upload document jika diperlukan

---

## ❓ FAQ

**Q: Apakah bisa menggunakan API tanpa session?**
A: Bisa, tapi conversation history tidak akan tersimpan. Gunakan sessionId untuk menyimpan context percakapan.

**Q: Berapa lama timeout?**
A: 10 detik. Jika response AI lebih dari 10 detik, akan otomatis timeout.

**Q: Apakah streaming lebih cepat?**
A: Streaming memberikan user experience lebih baik karena user bisa melihat response secara real-time (seperti ChatGPT), tapi total waktu sama.

**Q: Format file apa yang didukung untuk upload?**
A: PDF, DOCX, TXT

**Q: Apakah conversation history tersimpan di database?**
A: Tidak, history tersimpan di session (memory). Jika server restart, history akan hilang. Untuk production, pertimbangkan menggunakan database.

---

## 📞 Support

Jika ada pertanyaan atau issue, silahkan buka issue di repository atau hubungi developer.

---

**Happy Coding! 🎉**

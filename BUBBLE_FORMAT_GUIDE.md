# 🎈 Bubble Response Format Guide

## Overview

Chatbot sekarang mengembalikan response dalam format **bubble yang fleksibel** dengan maksimal **1000 karakter**. Response dapat terdiri dari **1-3 bubble** tergantung kompleksitas pertanyaan, untuk tampilan yang lebih profesional dan mudah dibaca.

> **🎯 Key Feature**: Bot tidak selalu memberikan 3 bubble. Jumlah bubble disesuaikan dengan konteks pertanyaan:
> - Pertanyaan sederhana → **1 bubble**
> - Pertanyaan menengah → **2 bubble**  
> - Pertanyaan kompleks → **3 bubble**
>
> Ini membuat response lebih natural dan tidak terasa "dipaksakan".

---

## Quick Examples

```javascript
// Simple question
User: "Terima kasih"
Bot: ["Sama-sama! Senang bisa membantu. 😊"]
// ↑ 1 bubble only

// Moderate question
User: "Apa itu Migrasi?"
Bot: ["Terima kasih atas pertanyaannya!", "Migrasi adalah layanan..."]
// ↑ 2 bubbles

// Complex question
User: "Bagaimana cara menggunakan layanan kalian?"
Bot: ["Senang bisa membantu!", "Berikut langkah-langkahnya...", "Mau coba trial gratis?"]
// ↑ 3 bubbles
```

---

## Response Structure

Setiap response terdiri dari **1-3 bubble** (disesuaikan dengan konteks):

### 1 Bubble (Pertanyaan Sederhana)
- **Main** - Jawaban langsung/singkat
- **Contoh**: Greeting, ucapan terima kasih, yes/no questions

### 2 Bubble (Pertanyaan Menengah)
1. **Intro** - Pembukaan singkat (~100-150 karakter)
2. **Main** - Jawaban utama dengan poin penting (~400-700 karakter)

### 3 Bubble (Pertanyaan Kompleks)
1. **Intro** - Pembukaan singkat (~100-150 karakter)
2. **Main** - Jawaban detail dengan poin-poin (~400-600 karakter)
3. **CTA** - Call-to-action/penutup (~100-150 karakter)

**Total maksimal**: 1000 karakter

---

## API Response Format

### Regular Chat (`POST /api/chat`)

**1 Bubble (Simple response)**:
```json
{
  "success": true,
  "response": "Sama-sama! Senang bisa membantu Anda. 😊",
  "bubbles": [
    {
      "type": "main",
      "content": "Sama-sama! Senang bisa membantu Anda. 😊"
    }
  ],
  "sessionId": "user-123"
}
```

**2 Bubbles (Moderate complexity)**:
```json
{
  "success": true,
  "response": "Terima kasih atas pertanyaannya!|||Migrasi adalah layanan yang membantu Anda berpindah data dengan mudah. Fitur utama: 1) Transfer cepat, 2) Aman & terenkripsi, 3) Support 24/7.",
  "bubbles": [
    {
      "type": "intro",
      "content": "Terima kasih atas pertanyaannya!"
    },
    {
      "type": "main",
      "content": "Migrasi adalah layanan yang membantu Anda berpindah data dengan mudah. Fitur utama: 1) Transfer cepat, 2) Aman & terenkripsi, 3) Support 24/7."
    }
  ],
  "sessionId": "user-123"
}
```

**3 Bubbles (Complex response)**:
```json
{
  "success": true,
  "response": "Senang bisa membantu!|||Berikut langkah mudah menggunakan Migrasi: 1) Daftar akun, 2) Pilih paket sesuai kebutuhan, 3) Upload data Anda, 4) Kami proses migrasi dengan aman. Prosesnya cepat dan didampingi tim support.|||Apakah Anda ingin mencoba paket trial gratis kami?",
  "bubbles": [
    {
      "type": "intro",
      "content": "Senang bisa membantu!"
    },
    {
      "type": "main",
      "content": "Berikut langkah mudah menggunakan Migrasi: 1) Daftar akun, 2) Pilih paket sesuai kebutuhan, 3) Upload data Anda, 4) Kami proses migrasi dengan aman. Prosesnya cepat dan didampingi tim support."
    },
    {
      "type": "cta",
      "content": "Apakah Anda ingin mencoba paket trial gratis kami?"
    }
  ],
  "sessionId": "user-123"
}
```

### Streaming Chat (`POST /api/chat/stream`)

**Events yang dikirim**:

1. **Chunk events** (streaming content):
```javascript
data: {"chunk":"Terima"}
data: {"chunk":" kasih"}
// ... more chunks
```

2. **Bubbles event** (setelah streaming selesai):
```javascript
data: {"bubbles":[
  {"type":"intro","content":"Terima kasih atas pertanyaannya!"},
  {"type":"main","content":"Migrasi adalah layanan..."},
  {"type":"cta","content":"Ada yang ingin Anda tanyakan lebih lanjut?"}
]}
```

3. **Done event**:
```javascript
data: {"done":true}
```

---

## Frontend Implementation

### 1. Regular Chat - React Example

```jsx
function ChatBubbles({ bubbles }) {
  const bubbleStyles = {
    intro: 'bg-blue-50 border-l-4 border-blue-400 p-3 rounded',
    main: 'bg-white border border-gray-200 p-4 rounded-lg',
    cta: 'bg-green-50 border-l-4 border-green-400 p-3 rounded italic'
  };

  return (
    <div className="space-y-3">
      {bubbles.map((bubble, index) => (
        <div 
          key={index}
          className={bubbleStyles[bubble.type] || bubbleStyles.main}
        >
          {bubble.content}
        </div>
      ))}
    </div>
  );
}

// Usage
function ChatComponent() {
  const [bubbles, setBubbles] = useState([]);
  
  const sendMessage = async (message) => {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, sessionId: 'user-123' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setBubbles(data.bubbles);
    }
  };
  
  return (
    <div>
      {/* Input form here */}
      <ChatBubbles bubbles={bubbles} />
    </div>
  );
}
```

---

### 2. Streaming Chat - React Example

```jsx
function StreamingChat() {
  const [bubbles, setBubbles] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendStreamingMessage = async (message) => {
    setIsStreaming(true);
    setCurrentText('');
    setBubbles([]);

    try {
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, sessionId: 'user-123' })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.chunk) {
              // Update streaming text
              fullText += data.chunk;
              setCurrentText(fullText);
            } else if (data.bubbles) {
              // Set bubbles when received
              setBubbles(data.bubbles);
            } else if (data.done) {
              setIsStreaming(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setIsStreaming(false);
    }
  };

  return (
    <div>
      {/* Show streaming text first */}
      {isStreaming && (
        <div className="animate-pulse bg-gray-100 p-4 rounded">
          {currentText}
        </div>
      )}
      
      {/* Show bubbles after streaming done */}
      {!isStreaming && bubbles.length > 0 && (
        <ChatBubbles bubbles={bubbles} />
      )}
    </div>
  );
}
```

---

### 3. Vanilla JavaScript Example

```javascript
// Regular chat with bubbles
async function sendMessage(message) {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, sessionId: 'user-123' })
  });

  const data = await response.json();
  
  if (data.success) {
    renderBubbles(data.bubbles);
  }
}

function renderBubbles(bubbles) {
  const container = document.getElementById('chat-bubbles');
  container.innerHTML = '';
  
  const styles = {
    intro: 'bubble bubble-intro',
    main: 'bubble bubble-main',
    cta: 'bubble bubble-cta'
  };
  
  bubbles.forEach(bubble => {
    const div = document.createElement('div');
    div.className = styles[bubble.type] || 'bubble';
    div.textContent = bubble.content;
    container.appendChild(div);
  });
}
```

**CSS**:
```css
.bubble {
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in;
  transition: all 0.2s ease;
}

/* Untuk single bubble, buat lebih prominent */
.bubble-container.single .bubble-main {
  padding: 16px 20px;
  font-size: 16px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
}

.bubble-intro {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  font-weight: 500;
}

.bubble-main {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  line-height: 1.6;
}

.bubble-cta {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  font-style: italic;
  color: #2e7d32;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
  font-style: italic;
  color: #2e7d32;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

### 4. Vue.js Example

```vue
<template>
  <div class="chat-container">
    <div class="bubbles-container">
      <div 
        v-for="(bubble, index) in bubbles" 
        :key="index"
        :class="['bubble', `bubble-${bubble.type}`]"
      >
        {{ bubble.content }}
      </div>
    </div>
    
    <input 
      v-model="message" 
      @keyup.enter="sendMessage"
      placeholder="Ketik pesan..."
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: '',
      bubbles: []
    }
  },
  methods: {
    async sendMessage() {
      if (!this.message.trim()) return;
      
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: this.message,
          sessionId: 'user-123'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.bubbles = data.bubbles;
      }
      
      this.message = '';
    }
  }
}
</script>

<style scoped>
.bubble {
  padding: 12px 16px;
  margin: 8px 0;
  border-radius: 8px;
}

.bubble-intro {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.bubble-main {
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.bubble-cta {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  font-style: italic;
}
</style>
```

---

## UI/UX Design Recommendations

### 1. **Progressive Display** (Recommended for streaming)
```
[Intro bubble appears first] ▼
[Main content streams in]    ▼
[CTA appears last]           ✓
```

### 2. **Staggered Animation**
```javascript
bubbles.forEach((bubble, index) => {
  setTimeout(() => {
    renderBubble(bubble);
  }, index * 300); // 300ms delay between bubbles
});
```

### 3. **Mobile Responsive**
```css
@media (max-width: 768px) {
  .bubble {
    padding: 10px 12px;
    font-size: 14px;
  }
}
```

---

## Benefits

✅ **User Experience**:
- Respons tidak terlalu panjang (max 1000 karakter)
- **Fleksibel**: Tidak memaksakan 3 bubble untuk pertanyaan sederhana
- Struktur natural sesuai konteks pertanyaan
- Visual lebih menarik dengan bubble berbeda
- User tidak overwhelmed dengan informasi berlebihan

✅ **Performance**:
- Response lebih cepat (lebih sedikit token)
- Hemat biaya API (max_tokens: 350 vs 1000)
- AI lebih efisien karena tidak perlu "memaksakan" format

✅ **Professional**:
- Terlihat lebih natural dan tidak kaku
- Mirip tampilan chatbot modern (WhatsApp Business, customer support tools)
- CTA hanya muncul saat relevan

---

## Fallback Handling

API secara otomatis menangani berbagai format response:

```javascript
// No separator (fallback to single bubble)
{
  "bubbles": [
    { "type": "main", "content": "Full response here..." }
  ]
}

// 1 separator (2 bubbles)
{
  "bubbles": [
    { "type": "intro", "content": "Hi!" },
    { "type": "main", "content": "Answer here..." }
  ]
}

// 2 separators (3 bubbles)
{
  "bubbles": [
    { "type": "intro", "content": "Hi!" },
    { "type": "main", "content": "Answer here..." },
    { "type": "cta", "content": "Need help?" }
  ]
}
```

**Frontend handling**:
```javascript
function renderBubbles(bubbles) {
  // Works seamlessly with 1, 2, or 3 bubbles
  return bubbles.map((bubble, index) => (
    <Bubble key={index} type={bubble.type} content={bubble.content} />
  ));
}
```

---

## Testing

Test dengan pertanyaan berbeda untuk melihat variasi bubble:

### 1 Bubble (Expected)
- **"Terima kasih"** → Jawaban sapaan singkat
- **"Halo"** → Greeting response
- **"Ok"** → Acknowledgment

### 2 Bubbles (Expected)
- **"Apa itu Migrasi?"** → Intro + penjelasan singkat
- **"Berapa harganya?"** → Intro + info harga
- **"Dimana lokasinya?"** → Intro + lokasi

### 3 Bubbles (Expected)
- **"Bagaimana cara menggunakan layanan kalian?"** → Intro + langkah detail + CTA
- **"Tolong jelaskan paket-paket yang tersedia"** → Intro + detail paket + CTA trial
- **"Saya butuh bantuan untuk migrasi data besar"** → Intro + solusi + CTA contact

### Edge Cases
- **Out of scope**: "Siapa presiden Indonesia?" → 1 bubble (polite rejection)
- **Unknown**: Question AI doesn't know → 2 bubbles (apology + CTA contact support)

---

## Tips

1. **Jangan parse `|||` di frontend** - Gunakan field `bubbles` yang sudah diparsing
2. **Handle 1-3 bubbles flexibly** - Component harus bisa render 1, 2, atau 3 bubble dengan smooth
3. **Handle error tetap** - Timeout error tidak akan ada bubble
4. **Keep session** - `sessionId` tetap penting untuk context conversation
5. **Animation** - Tambahkan animasi untuk UX yang lebih baik
6. **Mobile-first** - Test di mobile untuk memastikan bubble tidak terlalu panjang
7. **Dynamic styling** - Sesuaikan styling berdasarkan jumlah bubble:
   ```javascript
   // Example: Single bubble takes more space
   const bubbleClass = bubbles.length === 1 
     ? 'bubble-large' 
     : bubbles.length === 2 
       ? 'bubble-medium' 
       : 'bubble-compact';
   ```

---

## Example Question-Response Mapping

| Pertanyaan | Bubble Count | Reasoning |
|-----------|--------------|-----------|
| "Halo" | 1 | Simple greeting |
| "Terima kasih" | 1 | Simple acknowledgment |
| "Apa itu Migrasi?" | 2 | Needs intro + explanation |
| "Bagaimana cara order?" | 3 | Needs intro + steps + CTA |
| "Jelaskan semua fitur secara detail" | 3 | Complex, needs full structure |

---

**Happy coding! 🎉**

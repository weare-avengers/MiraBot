# 📚 Frontend Examples

Kumpulan contoh implementasi frontend untuk Digi AI Assistant chatbot dengan **Markdown support**.

## 🎯 Overview

Semua examples sudah include:
- ✅ **Markdown parsing** dengan marked.js
- ✅ **XSS protection** dengan DOMPurify  
- ✅ **Bubble response system** (1-3 bubbles)
- ✅ **Typing indicator** dan loading states
- ✅ **Error handling** untuk timeout dan network issues
- ✅ **Responsive design** untuk mobile & desktop

---

## 📂 Available Examples

### 1. Vanilla JavaScript (`chat-markdown.html`)
**Best for:** Quick prototyping, simple projects, no build tools needed

**Features:**
- Pure HTML + CSS + JavaScript
- No dependencies installation needed (uses CDN)
- Copy-paste ready
- 100% self-contained

**Usage:**
```bash
# Open langsung di browser
start chat-markdown.html

# Atau gunakan live server
npx live-server examples/
```

**Dependencies (CDN):**
- marked.js v11.1.1 (14KB)
- DOMPurify v3.0.8 (16KB)

[View Code](./chat-markdown.html)

---

### 2. React Component (`ChatInterface.jsx`)
**Best for:** React applications, modern frontend stack

**Features:**
- Functional components dengan hooks
- TypeScript-ready structure
- Reusable components
- Auto-scroll on new messages

**Installation:**
```bash
npm install marked dompurify
# or
yarn add marked dompurify
```

**Usage:**
```jsx
import ChatInterface from './examples/ChatInterface';

function App() {
  return (
    <div className="App">
      <ChatInterface />
    </div>
  );
}
```

**Component Structure:**
- `ChatInterface`: Main container
- `ChatMessage`: Message wrapper (user/bot)
- `ChatBubble`: Individual bubble with Markdown parsing
- `TypingIndicator`: Loading animation

[View Code](./ChatInterface.jsx)

---

### 3. Vue 3 Component (`ChatInterface.vue`)
**Best for:** Vue.js applications, progressive enhancement

**Features:**
- Vue 3 Composition API
- Scoped styling
- Reactive state management
- Auto-scroll with nextTick

**Installation:**
```bash
npm install marked dompurify
# or
yarn add marked dompurify
```

**Usage:**
```vue
<template>
  <ChatInterface />
</template>

<script>
import ChatInterface from './examples/ChatInterface.vue';

export default {
  components: {
    ChatInterface
  }
}
</script>
```

**Component Features:**
- Composition API setup
- Deep scoped styling dengan `:deep()`
- Watch for auto-scroll
- Form handling dengan `@submit.prevent`

[View Code](./ChatInterface.vue)

---

### 4. Legacy Examples

#### `chat-client.html`
Basic chat client tanpa Markdown support (legacy).

#### `test-openrouter.html`  
Test OpenRouter API connection.

#### `upload-document.html`
Document upload untuk knowledge base.

---

## 🚀 Quick Start

### Option 1: Vanilla JavaScript (Fastest)

1. Buka `chat-markdown.html` di browser
2. Pastikan server berjalan di `http://localhost:7000`
3. Mulai chat!

### Option 2: React

1. Copy `ChatInterface.jsx` ke project Anda
2. Install dependencies:
   ```bash
   npm install marked dompurify
   ```
3. Import component:
   ```jsx
   import ChatInterface from './ChatInterface';
   ```
4. Add ke App:
   ```jsx
   <ChatInterface />
   ```

### Option 3: Vue

1. Copy `ChatInterface.vue` ke project Anda
2. Install dependencies:
   ```bash
   npm install marked dompurify
   ```
3. Import component:
   ```vue
   <script>
   import ChatInterface from './ChatInterface.vue';
   export default {
     components: { ChatInterface }
   }
   </script>
   ```
4. Use in template:
   ```vue
   <template>
     <ChatInterface />
   </template>
   ```

---

## 🎨 Customization

### Mengubah Warna Brand

Update gradient colors di CSS:

```css
/* Primary gradient */
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);

/* Bold text color */
.bubble strong {
  color: #YOUR_BRAND_COLOR;
}

/* Bubble borders */
.bubble-intro {
  border-left: 3px solid #YOUR_COLOR;
}
```

### Mengubah API URL

Update API_URL constant:

```javascript
// Vanilla JS
const API_URL = 'https://your-domain.com/api/chat';

// React/Vue
const response = await fetch('https://your-domain.com/api/chat', {
  // ...
});
```

### Mengubah Bubble Styling

Edit bubble classes sesuai kebutuhan:

```css
.bubble-intro {
  /* Bubble pertama (intro) */
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 3px solid #0ea5e9;
}

.bubble-main {
  /* Bubble kedua (main) */
  background: white;
}

.bubble-cta {
  /* Bubble ketiga (call-to-action) */
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-left: 3px solid #f59e0b;
}
```

---

## 🔒 Security Notes

### Markdown Sanitization

**CRITICAL:** Selalu sanitize Markdown output untuk mencegah XSS!

```javascript
// ✅ SAFE
const html = DOMPurify.sanitize(marked.parse(markdown));

// ❌ UNSAFE - JANGAN!
const html = marked.parse(markdown);
```

### Allowed HTML Tags

Limit tags yang diizinkan:

```javascript
DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'code', 'pre'],
  ALLOWED_ATTR: []  // No attributes
});
```

### CORS & Credentials

Pastikan credentials included untuk session:

```javascript
fetch(url, {
  credentials: 'include',  // PENTING!
  // ...
});
```

---

## 📱 Mobile Optimization

Semua examples sudah mobile-ready, tapi Anda bisa customize:

### Responsive Breakpoints

```css
@media (max-width: 768px) {
  .chat-container {
    max-width: 100%;
    height: 100vh;
    border-radius: 0; /* Full screen di mobile */
  }
  
  .bubble {
    max-width: 90%; /* Lebih lebar di mobile */
  }
}
```

### Touch Optimization

```css
.chat-input-container button {
  min-height: 44px; /* iOS touch target */
  min-width: 44px;
}
```

---

## 🧪 Testing

### Test Markdown Rendering

```javascript
// Test cases untuk Markdown
const testCases = [
  '**Bold text**',
  'List:\n\n- Item 1\n- Item 2',
  'Numbered:\n\n1. First\n2. Second',
  'Mixed **bold** with lists:\n\n- Item A\n- Item B'
];

testCases.forEach(test => {
  console.log(parseMarkdown(test));
});
```

### Test Bubble Response

```javascript
// Simulate API response
const mockResponse = {
  success: true,
  bubbles: [
    {
      type: 'intro',
      content: 'Terima kasih!',
      format: 'markdown'
    },
    {
      type: 'main',
      content: '**Migrasi** menawarkan:\n\n- Layanan A\n- Layanan B',
      format: 'markdown'
    }
  ]
};
```

---

## 🐛 Troubleshooting

### Problem: Markdown tidak terformat

**Причина:** Marked.js atau DOMPurify tidak loaded

**Solution:** 
1. Check console untuk loading errors
2. Verify CDN links atau npm install
3. Ensure script loaded before usage

### Problem: XSS warning di console

**Причина:** Using `innerHTML` tanpa sanitization

**Solution:** Always use DOMPurify.sanitize()

### Problem: Bubble tidak muncul

**Причина:** Response format tidak sesuai

**Solution:** 
1. Check API response structure
2. Verify `bubbles` array exists
3. Check `type` dan `content` fields

### Problem: Styling tidak apply

**Причина:** CSS specificity atau scoped styles

**Solution:**
- Vue: Use `:deep()` untuk style child elements
- React: Check className spelling
- CSS: Increase specificity atau use `!important`

---

## 📖 Documentation Links

- [Markdown Guide](../MARKDOWN_GUIDE.md) - Complete Markdown implementation guide
- [API Documentation](../API_DOCUMENTATION.md) - API endpoints & response format
- [Bubble Format Guide](../BUBBLE_FORMAT_GUIDE.md) - Bubble system explained

---

## 💡 Tips

1. **Start Simple**: Begin with vanilla JS example, then migrate to framework
2. **Test Mobile First**: Check di mobile devices untuk better UX
3. **Customize Gradually**: Mulai dengan default styling, customize step by step
4. **Monitor Performance**: Markdown parsing cepat (<1ms) tapi monitor untuk banyak messages
5. **Handle Errors**: Always implement error handling untuk network issues

---

## 🤝 Contributing

Found a bug or have improvement ideas? Please:
1. Test di different browsers
2. Check console untuk errors
3. Document expected vs actual behavior
4. Submit with code example

---

## 📝 License

Same as parent project license.

---

**Happy Coding! 🚀**

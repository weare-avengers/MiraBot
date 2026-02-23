# Digi AI Assistant - Express.js Version

Bot asisten AI customer support untuk perusahaan Migrasi, dibangun dengan Express.js, OpenAI, dan Pinecone.

## 🆓 100% FREE Setup Available!

Anda bisa menjalankan bot ini **tanpa biaya** menggunakan:
- **Jina AI** - Free unlimited embeddings for knowledge base ✅
- **OpenRouter** - Free AI chat models ✅  
- **Pinecone** - Free tier vector database ✅

📖 **[Lihat panduan setup gratis →](JINA_EMBEDDINGS_SETUP.md)**

## 📋 Fitur

- **AI Chat Bot** - Customer support dengan AI (OpenAI atau OpenRouter)
- **Free Models Available** - Gunakan model gratis via OpenRouter
- **Free Embeddings** - Jina AI untuk embeddings gratis ⚡ NEW!
- **Flexible Bubble Response** - Response 1-3 bubble sesuai kompleksitas pertanyaan
- **Timeout Protection** - Auto-timeout setelah 10 detik
- **Vector Store** - Knowledge base menggunakan Pinecone
- **Session Memory** - Menyimpan riwayat percakapan
- **Document Processing** - Upload dan proses dokumen (PDF, Word, Text)
- **Local Knowledge Base** - Direktori lokal untuk menyimpan dokumen
- **Auto-Watch** - Otomatis proses dokumen baru di folder knowledge
- **Streaming Response** - Real-time streaming chat response

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Edit file `.env` dan isi dengan credentials Anda:

```env
# 🆓 FREE OPTION: Jina AI Embeddings (Recommended for dev)
USE_JINA_EMBEDDINGS=true
JINA_API_KEY=jina_xxxxxxxxxxxxx  # Get free at https://jina.ai/embeddings/

# 🆓 FREE OPTION: OpenRouter Chat (Recommended for dev)
USE_OPENROUTER=true
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # Get free at https://openrouter.ai/keys
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free

# Pinecone (Free tier available)
PINECONE_API_KEY=pc-...
PINECONE_INDEX_NAME=n8n-digi
PINECONE_NAMESPACE=digi

# 💰 PAID OPTION: OpenAI (if you prefer)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
```

**📖 Baca panduan lengkap setup gratis:** [JINA_EMBEDDINGS_SETUP.md](JINA_EMBEDDINGS_SETUP.md)

### 3. Tambahkan Dokumen Knowledge Base (Optional)

Letakkan file dokumen (PDF, Word, TXT) di folder `knowledge/`:

```bash
# Contoh struktur
knowledge/
├── company-profile.pdf
├── product-catalog.docx
└── faq.txt
```

Kemudian sync/index dokumen:

```bash
npm run sync-knowledge
```

### 4. Jalankan Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

Server akan berjalan di `http://localhost:7000`

## 📚 API Endpoints

### Chat Endpoints

#### POST `/api/chat`

Kirim pesan ke bot dan dapatkan respons.

**Request:**

```json
{
    "message": "Apa itu Migrasi?",
    "sessionId": "user-123"
}
```

**Response:**

```json
{
    "success": true,
    "response": "Migrasi adalah perusahaan software house yang...",
    "sessionId": "user-123"
}
```

#### POST `/api/chat/stream`

Streaming chat response (Server-Sent Events).

**Request:**

```json
{
    "message": "Jelaskan layanan Migrasi",
    "sessionId": "user-123"
}
```

**Response:** Stream of events

```
data: {"chunk": "Migrasi"}
data: {"chunk": " adalah"}
data: {"done": true}
```

#### GET `/api/chat/:sessionId`

Dapatkan riwayat percakapan.

**Response:**

```json
{
    "success": true,
    "sessionId": "user-123",
    "history": [
        { "role": "user", "content": "Halo" },
        { "role": "assistant", "content": "Halo! Ada yang bisa saya bantu?" }
    ]
}
```

#### DELETE `/api/chat/:sessionId`

Hapus riwayat percakapan.

### Knowledge Base Endpoints

#### POST `/api/knowledge/upload`

Upload dokumen untuk diproses dan diindeks.

**Request:** multipart/form-data

- `file`: File dokumen (PDF, Word, Text)

**Response:**

```json
{
    "success": true,
    "filename": "document.pdf",
    "chunksProcessed": 15,
    "message": "Successfully processed and indexed 15 chunks from document.pdf"
}
```

#### POST `/api/knowledge/upload/bulk`

Upload multiple dokumen sekaligus.

**Request:** multipart/form-data

- `files`: Array of files (max 10 files)

## 🔄 Google Drive Sync (Optional)

Untuk auto-sync dokumen dari Google Drive:

### 1. Setup Google OAuth

Dapatkan credentials dari [Google Cloud Console](https://console.cloud.google.com/):

1. Buat project baru
2. Enable Google Drive API
3. Buat OAuth 2.0 Client ID (Desktop app)
4. Download credentials dan masukkan ke `.env`

### 2. Authorize

```bash
npm run authorize-drive
```

Ikuti instruksi, buka URL yang diberikan, authorize, dan paste kode authorization.

### 3. Sync Knowledge Base

```bash
npm run sync-knowledge
```

Ini akan download dan proses semua dokumen dari folder Google Drive yang ditentukan.

## 📁 Struktur Project

```
digibot/
├── knowledge/                  # 📚 Taruh dokumen di sini
│   ├── README.md
│   └── .gitkeep
├── examples/
│   ├── chat-client.html        # Web chat interface
│   └── upload-document.html    # Upload interface
├── src/
│   ├── config/
│   │   └── config.js           # Konfigurasi aplikasi
│   ├── routes/
│   │   ├── chatRoutes.js       # Routes untuk chat
│   │   └── knowledgeRoutes.js  # Routes untuk knowledge base
│   ├── services/
│   │   ├── openaiService.js    # Integrasi OpenAI
│   │   ├── pineconeService.js  # Integrasi Pinecone
│   │   ├── documentService.js  # Proses dokumen
│   │   └── knowledgeBaseService.js # Kelola knowledge folder
│   ├── scripts/
│   │   ├── syncKnowledge.js    # Script sync dari folder
│   │   ├── watchKnowledge.js   # Script watch folder
│   │   └── clearKnowledge.js   # Script clear vector store
│   └── server.js               # Main server
├── .env                        # Environment variables
├── .env.example                # Template environment
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing

### Test Chat Endpoint

```bash
curl -X POST http://localhost:7000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Halo, apa itu Migrasi?", "sessionId": "test-123"}'
```

### Test Upload Document

```bash
curl -X POST http://localhost:7000/api/knowledge/upload \
  -F "file=@/path/to/document.pdf"
```

### Test dengan HTML Client

Lihat file `examples/chat-client.html` untuk contoh web interface.

## 🛠️ Konfigurasi Bot

Sistem prompt bot bisa diubah di [src/services/openaiService.js](src/services/openaiService.js#L10).

Default behavior:

- Bahasa: Mengikuti bahasa customer (ID/EN)
- Tone: Friendly, calm, professional
- Scope: Hanya pertanyaan tentang Migrasi
- Knowledge: Dari Pinecone vector store

## 📊 Environment Variables

| Variable              | Required      | Description                                                 |
| --------------------- | ------------- | ----------------------------------------------------------- |
| `PORT`                | No            | Server port (default: 3000)                                 |
| `NODE_ENV`            | No            | Environment (development/production)                        |
| `AUTO_WATCH`          | No            | Auto-watch knowledge folder (true/false)                    |
| `USE_OPENROUTER`      | No            | Use OpenRouter instead of OpenAI (true/false)               |
| `OPENROUTER_API_KEY`  | If OpenRouter | OpenRouter API key (get from openrouter.ai)                 |
| `OPENROUTER_MODEL`    | No            | Model to use (default: arcee-ai/trinity-large-preview:free) |
| `OPENAI_API_KEY`      | If OpenAI     | OpenAI API key                                              |
| `OPENAI_MODEL`        | No            | Model name (default: gpt-4o-mini)                           |
| `PINECONE_API_KEY`    | Yes           | Pinecone API key                                            |
| `PINECONE_INDEX_NAME` | No            | Index name (default: n8n-digi)                              |
| `PINECONE_NAMESPACE`  | No            | Namespace (default: digi)                                   |
| `SESSION_SECRET`      | No            | Session secret key                                          |

## 🔒 Security Notes

- Jangan commit file `.env` ke repository
- Gunakan `SESSION_SECRET` yang kuat untuk production
- Enable HTTPS untuk production deployment
- Set `NODE_ENV=production` untuk production

## 📝 Migration dari n8n

Perbandingan dengan n8n workflow:

| n8n Node              | Express.js Equivalent                 |
| --------------------- | ------------------------------------- |
| Chat Trigger          | POST /api/chat                        |
| AI Agent              | openaiService.chat()                  |
| OpenAI Chat Model     | openai SDK                            |
| Vector Store Tool     | pineconeService.queryVectors()        |
| Pinecone Vector Store | @pinecone-database/pinecone           |
| Memory Buffer         | express-session                       |
| Google Drive Trigger  | knowledgeBaseService.watchDirectory() |
| Document Loader       | documentService.processDocument()     |

**Keuntungan Express.js:**

- ✅ Lebih ringan dan cepat
- ✅ Tidak perlu Google Drive setup
- ✅ Kontrol penuh atas code
- ✅ Mudah di-customize
- ✅ Gratis, tidak ada batasan eksekusi
- ✅ Deploy ke mana saja

## 🚀 Deployment

### Deploy ke Cloud (contoh: Railway, Render, Heroku)

1. Push code ke Git repository
2. Connect repository ke platform
3. Set environment variables
4. Deploy!

### Deploy dengan Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Error: "Pinecone API key not found"

Pastikan `PINECONE_API_KEY` sudah diset di `.env`

### Error: "OpenAI API error"

Check API key dan quota OpenAI Anda

### File tidak terdeteksi di folder knowledge

- Pastikan file format PDF, Word, atau TXT
- Coba manual sync: `npm run sync-knowledge`
- Cek log untuk error message

### Auto-watch tidak jalan

Pastikan `AUTO_WATCH=true` di `.env` atau gunakan `npm run dev:watch`

### Session tidak persist

Untuk production, gunakan session store seperti Redis atau database

## 📞 Support

Untuk pertanyaan atau bantuan, hubungi tim Migrasi.

## 📄 License

MIT

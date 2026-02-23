# 🚀 Quick Start Guide - Digi AI Assistant

## ⚡ Setup Cepat (5 Menit)

### 1️⃣ Setup API Keys

Edit file `.env` dan isi dengan API key Anda:

**Option A: OpenRouter (GRATIS! 🆓)**

```env
USE_OPENROUTER=true
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
PINECONE_API_KEY=pcsk-xxxxxxxxxxxxx
```

**Option B: OpenAI (Berbayar 💰)**

```env
USE_OPENROUTER=false
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
PINECONE_API_KEY=pcsk-xxxxxxxxxxxxx
```

**Cara Mendapatkan API Keys:**

- **OpenRouter** (GRATIS): https://openrouter.ai/keys
- **OpenAI** (Berbayar): https://platform.openai.com/api-keys
- **Pinecone** (Required): https://app.pinecone.io/

### 2️⃣ Tambahkan Dokumen Knowledge Base

Taruh file dokumen di folder `knowledge/`:

```bash
# Windows
copy "C:\Path\To\Your\Document.pdf" knowledge\

# Linux/Mac
cp /path/to/your/document.pdf knowledge/
```

Format yang didukung: PDF, Word (`.doc`, `.docx`), Text (`.txt`)

### 3️⃣ Sync Knowledge Base

```bash
npm run sync-knowledge
```

Ini akan membaca semua file di folder `knowledge/` dan mengindeksnya ke Pinecone.

### 4️⃣ Jalankan Server

```bash
# Mode development
npm run dev

# Mode development + auto-watch
npm run dev:watch
```

### 5️⃣ Test Chat Bot

Buka browser → `examples/chat-client.html`

Atau test dengan curl:

```bash
curl -X POST http://localhost:7000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Halo, apa itu Migrasi?\"}"
```

## 🎯 Mode Operasi

### Mode 1: Manual Sync

Untuk production - control penuh kapan dokumen diproses:

```bash
# 1. Jalankan server normal
npm start

# 2. Setiap kali ada dokumen baru, jalankan sync
npm run sync-knowledge
```

### Mode 2: Auto-Watch (Development)

Dokumen baru otomatis diproses:

```bash
# Set di .env
AUTO_WATCH=true

# Atau gunakan script khusus
npm run dev:watch
```

### Mode 3: Upload via API

Upload dokumen melalui API atau web interface:

```bash
# Via curl
curl -X POST http://localhost:7000/api/knowledge/upload ^
  -F "file=@document.pdf"

# Atau buka examples/upload-document.html
```

## 🔧 Scripts yang Tersedia

```bash
npm start              # Production server
npm run dev            # Development dengan auto-reload
npm run dev:watch      # Dev + auto-watch knowledge folder
npm run sync-knowledge # Sync file dari folder knowledge/
npm run watch-knowledge # Watch folder terus-menerus
npm run clear-knowledge # Reset semua knowledge base
```

## 📊 Endpoints API

### Chat

```bash
POST /api/chat
{
  "message": "Your question here",
  "sessionId": "user-123"
}
```

### Upload Document

```bash
POST /api/knowledge/upload
Content-Type: multipart/form-data
file: <your-file>
```

## ⚠️ Troubleshooting

### "Invalid API key"

Pastikan `OPENAI_API_KEY` dan `PINECONE_API_KEY` sudah benar di `.env`

### File tidak terdeteksi

- Pastikan file ada di folder `knowledge/`
- Format harus PDF, Word, atau TXT
- Cek log error untuk detail

### Server tidak start

```bash
# Reinstall dependencies
npm install

# Check Node.js version (minimum 16)
node --version
```

## 💡 Tips

1. **Nama File Deskriptif**: Gunakan nama file yang jelas (e.g., `company-profile-2024.pdf`)
2. **Chunk Size**: Bisa diubah di `.env` dengan `CHUNK_SIZE` (default 500)
3. **Session Memory**: Bot mengingat 10 pertanyaan terakhir per session
4. **Multi-Language**: Bot otomatis detect bahasa user (ID/EN)

## 🎓 Contoh Use Case

### Use Case 1: Customer Support

```
knowledge/
├── faq.txt
├── product-catalog.pdf
├── pricing-2024.pdf
└── terms-of-service.pdf
```

### Use Case 2: Internal Knowledge Base

```
knowledge/
├── company-handbook.pdf
├── hr-policies.docx
├── technical-docs.pdf
└── onboarding-guide.pdf
```

### Use Case 3: Documentation Bot

```
knowledge/
├── api-reference.txt
├── getting-started.pdf
└── best-practices.docx
```

## 🚀 Deploy ke Production

### Option 1: Railway

```bash
# Push to GitHub
git push origin main

# Connect di Railway.app
# Set environment variables
# Deploy!
```

### Option 2: Render/Heroku

Similar - connect repo dan set env vars

### Option 3: VPS (Ubuntu)

```bash
# Install Node.js, PM2
npm install
pm2 start src/server.js --name digi-bot
pm2 save
```

## 📞 Butuh Bantuan?

- Baca [README.md](README.md) untuk dokumentasi lengkap
- Check folder `examples/` untuk contoh code
- Lihat folder `knowledge/` untuk contoh dokumen

---

**Selamat Menggunakan Digi AI Assistant! 🎉**

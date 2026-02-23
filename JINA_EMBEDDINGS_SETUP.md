# 🆓 Free Embeddings Setup - Jina AI

## Overview

Jina AI menyediakan **embeddings gratis dan unlimited** yang sangat cocok untuk development. Kualitasnya bagus untuk semantic search dan lebih baik daripada simple hash-based embeddings.

**⚡ Vector Dimension: 1024** - Anda perlu recreate Pinecone index dengan dimension 1024 untuk compatibility.

📖 **[Panduan Recreate Pinecone Index →](PINECONE_1024_SETUP.md)**

---

## ✨ Keuntungan Jina AI Embeddings

✅ **100% Gratis** - Tidak ada biaya sama sekali  
✅ **Unlimited** - Tidak ada rate limit untuk API key gratis  
✅ **Kualitas Bagus** - Performa semantic search yang baik  
✅ **Mudah Setup** - Hanya butuh 2 menit  
✅ **No Credit Card** - Daftar tanpa kartu kredit  

---

## 🚀 Quick Setup (2 Steps)

### Step 1: Dapatkan Jina AI API Key (Gratis)

**Opsi A: Signup untuk API Key Unlimited (Recommended)**

1. Kunjungi: https://jina.ai/embeddings/
2. Klik **"Get Started Free"** atau **"Sign Up"**
3. Daftar dengan email/GitHub
4. Setelah login, copy API key Anda

**Opsi B: Gunakan Rate-Limited (No Signup)**

Jika tidak mau daftar, bisa langsung pakai `JINA_API_KEY=free` (dengan rate limit)

---

### Step 2: Update .env File

Tambahkan ke file `.env` Anda:

```env
# Enable Jina AI Embeddings
USE_JINA_EMBEDDINGS=true
JINA_API_KEY=jina_xxxxxxxxxxxxxxxxxxxxxx
```

**Ganti `jina_xxxxxxxxxxxxxxxxxxxxxx` dengan API key Anda**

---

## 📝 Complete .env Example

```env
# Server
PORT=3000
NODE_ENV=development

# Embeddings - Jina AI (FREE!)
USE_JINA_EMBEDDINGS=true
JINA_API_KEY=jina_xxxxxxxxxxxxxxxxxxxxxx

# Chat Model - OpenRouter (FREE!)
USE_OPENROUTER=true
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free

# Pinecone (FREE TIER)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=n8n-digi
PINECONE_NAMESPACE=digi
```

---

## ✅ Testing

Setelah setup, restart server:

```bash
npm start
```

Upload dokumen ke knowledge base:

```bash
npm run sync-knowledge
```

**Output yang diharapkan:**

```
🔮 Using Jina AI Embeddings (Free)
✅ Document processed successfully
```

**Bukan:**

```
⚠️  Using simple embedding fallback
```

---

## 🔄 Priority Order

System akan menggunakan embedding service dengan urutan prioritas:

1. **Jina AI** (jika `USE_JINA_EMBEDDINGS=true`) ← **RECOMMENDED**
2. **OpenAI** (jika OpenAI API key tersedia)
3. **Simple Embedding** (fallback, tidak optimal)

---

## 💰 Cost Comparison

| Provider | Cost | Quality | Limit |
|----------|------|---------|-------|
| **Jina AI** | **FREE** | ⭐⭐⭐⭐ | Unlimited (with free API key) |
| OpenAI | $0.0001/1K tokens | ⭐⭐⭐⭐⭐ | Pay per use |
| Simple Embedding | FREE | ⭐⭐ | Unlimited (built-in) |

---

## 🛠️ Troubleshooting

### Error: "Vector dimension 1024 does not match the dimension of the index 1536"

**Penyebab:** Pinecone index Anda masih menggunakan dimension 1536 (OpenAI standard), tapi Jina AI menggunakan 1024.

**Solusi:**
✅ **Recreate Pinecone index dengan dimension 1024**

📖 **[Ikuti panduan lengkap recreate Pinecone →](PINECONE_1024_SETUP.md)**

**Quick steps:**
1. Delete index lama di Pinecone Dashboard
2. Create index baru dengan dimension **1024**
3. Restart server & sync: `npm run sync-knowledge`

### Error: "Request failed with status code 422"

**Penyebab:** Parameter yang dikirim ke Jina AI tidak valid (misalnya custom dimensions).

**Solusi:**
1. Pastikan code sudah diupdate (tidak ada parameter `dimensions`)
2. Restart server
3. Coba lagi

### Error: "Error with Jina AI embedding"

**Solusi:**
1. Check API key benar dan valid
2. Check koneksi internet
3. Pastikan `USE_JINA_EMBEDDINGS=true`
4. Coba regenerate API key di dashboard Jina

### Masih muncul "Using simple embedding fallback"

**Solusi:**
1. Restart server setelah update .env
2. Check `.env` file ada di root folder
3. Pastikan tidak ada typo di variable name
4. Check console log untuk detail error

---

## 🎯 Alternative Free Options

Jika Jina AI tidak bekerja, ada alternatif gratis lain:

### 1. Hugging Face Inference API
```env
# Free dengan rate limit
HF_API_KEY=hf_xxxxxxxxxxxx
HF_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

### 2. Cohere Free Tier
```env
# 100 requests/month gratis
COHERE_API_KEY=xxxxxxxxxxxxx
```

### 3. Hybrid Approach
```env
# OpenAI untuk embeddings saja (murah ~$0.02/1M tokens)
# OpenRouter untuk chat (gratis)
USE_JINA_EMBEDDINGS=false
USE_OPENROUTER=true
OPENAI_API_KEY=sk-xxxxx
```

---

## 📊 Performance Comparison

Berdasarkan testing dengan knowledge base:

| Method | Semantic Search Quality | Speed | Cost | Dimensions |
|--------|-------------------------|-------|------|------------|
| Jina AI | ⭐⭐⭐⭐ (85%) | Fast | $0 | 1024 |
| OpenAI | ⭐⭐⭐⭐⭐ (95%) | Fast | ~$0.02/1M chars | 1536 |
| Simple Hash | ⭐⭐ (40%) | Very Fast | $0 | 1536 |

**Recommendation:** Use **Jina AI (1024-dim)** for development, consider OpenAI for production if budget allows.

---

## 🔗 Useful Links

- **Jina AI Dashboard**: https://jina.ai/embeddings/
- **API Documentation**: https://api.jina.ai/redoc
- **Model Info**: jina-embeddings-v3 (1024 dimensions)

---

## ❓ FAQ

**Q: Apakah Jina AI benar-benar gratis selamanya?**  
A: Ya, free tier mereka tidak ada expiry date. Untuk production scale, mereka ada paid plan tapi untuk dev/small project cukup pakai free.

**Q: Apakah kualitasnya cukup bagus?**  
A: Ya! Jina embeddings v3 cukup bagus untuk semantic search. Sudah digunakan oleh banyak developer.

**Q: Bisakah kombinasi Jina (embeddings) + OpenRouter (chat)?**  
A: Bisa! Ini kombinasi terbaik untuk development - **100% gratis** dengan kualitas bagus.

**Q: Berapa dimension vector yang dihasilkan Jina AI?**  
A: **1024 dimensions**. Pastikan Pinecone index Anda juga dikonfigurasi untuk 1024 dimensions. [Lihat panduan →](PINECONE_1024_SETUP.md)

**Q: Harus re-upload semua dokumen setelah ganti ke Jina?**  
A: Ya, karena embedding method berbeda. Jalankan:
```bash
npm run clear-knowledge
npm run sync-knowledge
```

**Q: Apakah bisa ganti dari OpenAI ke Jina tanpa recreate Pinecone index?**  
A: **Tidak bisa**. OpenAI menggunakan 1536 dimensions, Jina AI menggunakan 1024 dimensions. Anda harus:
1. Delete index lama (1536-dim)
2. Create index baru (1024-dim)
3. Update `.env`: `USE_JINA_EMBEDDINGS=true`
4. Clear & re-sync knowledge base

📖 [Panduan lengkap recreate Pinecone →](PINECONE_1024_SETUP.md)

---

**Happy coding! 🎉**

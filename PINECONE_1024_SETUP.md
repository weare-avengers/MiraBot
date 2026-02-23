# 🔧 Recreate Pinecone Index untuk Jina AI (1024 Dimensions)

## Overview

Jina AI embeddings menggunakan **1024 dimensions** secara default. Pinecone index Anda saat ini dikonfigurasi untuk **1536 dimensions** (OpenAI standard), sehingga perlu di-recreate.

---

## 🚀 Step-by-Step Guide

### Step 1: Backup Data (Optional)

Jika ada data penting, backup dulu. Tapi untuk development, biasanya bisa langsung recreate.

### Step 2: Delete Old Pinecone Index

**Option A: Via Pinecone Dashboard (Recommended)**

1. Login ke: https://app.pinecone.io/
2. Pilih project Anda
3. Klik index `n8n-digi` (atau nama index Anda)
4. Klik tombol **"Delete Index"**
5. Confirm deletion

**Option B: Via API/Code**

```javascript
// Tambahkan script sementara atau jalankan di Node console
const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
  apiKey: 'YOUR_PINECONE_API_KEY'
});

await pinecone.deleteIndex('n8n-digi');
console.log('✅ Index deleted');
```

---

### Step 3: Create New Index dengan 1024 Dimensions

**Via Pinecone Dashboard (Recommended)**

1. Di Pinecone Dashboard, klik **"Create Index"**
2. Isi form:
   - **Name**: `n8n-digi` (atau nama yang sama dengan sebelumnya)
   - **Dimensions**: **1024** ⚡ (PENTING!)
   - **Metric**: `cosine` (recommended untuk semantic search)
   - **Cloud**: Free tier (pilih region terdekat)
3. Klik **"Create Index"**
4. Tunggu 1-2 menit sampai status "Ready"

**Screenshot Settings:**
```
Index Name: n8n-digi
Dimensions: 1024          ← IMPORTANT!
Metric: cosine
Pod Type: Starter (Free)
Replicas: 1
```

---

### Step 4: Update Environment Variables (jika perlu)

Pastikan `.env` sesuai:

```env
# Pinecone Configuration
PINECONE_API_KEY=pcsk_xxxxxxxxxxxxx
PINECONE_INDEX_NAME=n8n-digi
PINECONE_NAMESPACE=digi

# Jina AI Embeddings (1024 dimensions)
USE_JINA_EMBEDDINGS=true
JINA_API_KEY=jina_xxxxxxxxxxxxx
```

---

### Step 5: Sync Knowledge Base

Sekarang upload ulang dokumen:

```bash
# Start server (biar Pinecone reinitialize)
npm start

# Di terminal baru, sync knowledge
npm run sync-knowledge
```

**Expected Output:**

```bash
🔮 Using Jina AI Embeddings (Free, 1024 dimensions)
✅ Upserted 15 vectors to Pinecone
✅ Success: 15 chunks indexed

📊 Sync Summary:
   Total files: 1
   Successful: 1
   Failed: 0
✅ Sync completed!
```

---

## ✅ Verification

Test chatbot dengan pertanyaan:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa itu Migrasi?",
    "sessionId": "test-123"
  }'
```

Response harus akurat berdasarkan knowledge base.

---

## 📊 Dimension Comparison

| Provider | Dimensions | Compatible Index |
|----------|-----------|------------------|
| OpenAI `text-embedding-3-small` | 1536 | Pinecone 1536-dim |
| OpenAI `text-embedding-ada-002` | 1536 | Pinecone 1536-dim |
| **Jina AI v3** | **1024** | **Pinecone 1024-dim** ✅ |
| Cohere | 1024 | Pinecone 1024-dim |

---

## 🛠️ Troubleshooting

### Error: "Index not found"

**Solusi:**
1. Check `PINECONE_INDEX_NAME` di `.env` sama dengan nama index yang dibuat
2. Restart server setelah create index

### Error: "Vector dimension 1024 does not match 1536"

**Penyebab:** Index lama belum di-delete atau masih pakai index 1536-dim.

**Solusi:**
1. Pastikan index lama sudah di-delete
2. Create index baru dengan dimension **1024**
3. Restart server

### Jina AI masih error 422

**Solusi:**
1. Check API key valid
2. Pastikan code sudah diupdate (tidak ada `dimensions: 1536` parameter)
3. Restart Node.js process

---

## 💡 Tips

### Quick Check Pinecone Index Dimension

Cara cek dimension index Anda saat ini:

1. Login ke Pinecone Dashboard
2. Klik index Anda
3. Lihat di **"Overview"** → **"Dimensions"**

### Alternative: Buat Index Baru dengan Nama Berbeda

Jika tidak mau delete index lama:

1. Create index baru: `n8n-digi-jina` (1024-dim)
2. Update `.env`:
   ```env
   PINECONE_INDEX_NAME=n8n-digi-jina
   ```
3. Sync knowledge base

---

## 🔄 Reverting Back to OpenAI (if needed)

Jika suatu saat mau balik ke OpenAI embeddings:

1. Delete index Jina (1024-dim)
2. Create index OpenAI (1536-dim)
3. Update `.env`:
   ```env
   USE_JINA_EMBEDDINGS=false
   OPENAI_API_KEY=sk-xxxxx
   ```
4. Sync knowledge base

---

## ❓ FAQ

**Q: Apakah data lama hilang setelah recreate index?**  
A: Ya, tapi knowledge base tetap ada di folder `knowledge/`. Tinggal `npm run sync-knowledge` untuk re-index.

**Q: Berapa lama proses create index?**  
A: 1-2 menit untuk free tier.

**Q: Apakah Jina AI 1024-dim lebih jelek dari OpenAI 1536-dim?**  
A: Tidak. Dimension lebih tinggi tidak selalu berarti lebih baik. Jina AI 1024-dim sudah sangat bagus untuk semantic search dan gratis!

**Q: Bisakah pakai 2 index berbeda untuk testing?**  
A: Bisa! Buat index dengan nama berbeda dan ganti `PINECONE_INDEX_NAME` sesuai kebutuhan.

---

**Happy coding! 🎉**

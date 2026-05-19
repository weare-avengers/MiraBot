# 📥 Document Download Feature - Quick Guide

## ✨ Apa Itu?

Fitur otomatis untuk **menyimpan dan mendownload** hasil scraping website setelah proses indexing ke Pinecone selesai.

## 🚀 Cara Menggunakan

### 1. Jalankan Scraping dengan Force
```bash
npm run scrape-website:force
```

**Output akan menampilkan:**
```
💾 Downloaded: homepage-1715001000.md
✅ Indexed 8 vectors to Pinecone

💾 Downloaded: about-us-1715001001.md
✅ Indexed 10 vectors to Pinecone

📥 ═══════════════════════════════════════════
📥 DOWNLOAD SUMMARY
📥 ═══════════════════════════════════════════
  📄 Total documents:      10
  💾 Total file size:      256.78 KB
  📊 Format breakdown:     {"md":10}
  🕐 Last updated:         2024-05-18T10:30:00.000Z
📥 ═══════════════════════════════════════════
```

### 2. Lihat Semua Downloaded Documents
```bash
curl http://localhost:3000/api/downloads
```

### 3. Download File Tertentu
```bash
curl -O http://localhost:3000/api/downloads/{documentId}/download
```

### 4. Lihat Statistik
```bash
curl http://localhost:3000/api/downloads/stats
```

### 5. Hapus Document
```bash
curl -X DELETE http://localhost:3000/api/downloads/{documentId}
```

## 📂 Penyimpanan

Documents disimpan di:
```
knowledge/downloads/
├── homepage-1715001000.md
├── about-us-1715001001.md
├── services-1715001002.md
└── _metadata.json
```

Format document:
```markdown
# Page Title

**Sumber:** https://example.com/page
**Di-scrape:** 18 Mei 2024 10:30:00

---

[Konten halaman...]
```

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/downloads` | List semua documents |
| GET | `/api/downloads/stats` | Statistik documents |
| GET | `/api/downloads/:id` | Get document tertentu |
| GET | `/api/downloads/:id/download` | Download file |
| DELETE | `/api/downloads/:id` | Hapus document |

## 📊 Response Format

### GET /api/downloads
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "filename": "about-us-1715001000.md",
        "pageLabel": "About Us",
        "url": "https://migrasi.id/about",
        "format": "md",
        "fileSize": 45678,
        "contentLength": 42000,
        "scrapedAt": "2024-05-18T10:30:00.000Z",
        "status": "completed"
      }
    ],
    "totalDocuments": 10,
    "lastUpdated": "2024-05-18T10:30:00.000Z"
  }
}
```

### GET /api/downloads/stats
```json
{
  "success": true,
  "data": {
    "totalDocuments": 10,
    "totalFileSize": 262872,
    "totalContentSize": 250000,
    "formatBreakdown": {"md": 10},
    "lastUpdated": "2024-05-18T10:30:00.000Z"
  }
}
```

## 💡 Tips

- Documents **otomatis disimpan** saat scraping halaman baru
- Gunakan `--force` untuk force re-index **dan download semua halaman**
- Setiap document memiliki **metadata lengkap** (URL, waktu, ukuran)
- Documents tersimpan dalam format **Markdown** yang mudah dibaca

## 📝 Contoh Usage

```bash
# Force scrape & download semua halaman
npm run scrape-website:force

# Lihat semua documents yang sudah di-download
curl http://localhost:3000/api/downloads | jq '.data.documents[].pageLabel'

# Download semua statistics
curl http://localhost:3000/api/downloads/stats | jq

# Download file tertentu (ganti {id} dengan document id)
curl -O http://localhost:3000/api/downloads/{id}/download

# Hapus document
curl -X DELETE http://localhost:3000/api/downloads/{id}
```

---

✅ **Setup Selesai!** Download documents otomatis siap digunakan.

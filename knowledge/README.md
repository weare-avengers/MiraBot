# 📚 Knowledge Base Directory

Letakkan semua file dokumen di folder ini untuk dipelajari oleh bot Digi.

## 📄 Format File yang Didukung:

- ✅ PDF (`.pdf`)
- ✅ Microsoft Word (`.doc`, `.docx`)
- ✅ Text Files (`.txt`)

## 🔄 Cara Menggunakan:

### Option 1: Auto-Watch (Recommended)
Jalankan server dengan mode watch, file baru akan otomatis diproses:
```bash
npm run dev:watch
```

### Option 2: Manual Sync
1. Taruh file di folder ini
2. Jalankan sync manual:
```bash
npm run sync-knowledge
```

### Option 3: Upload via API
Upload file melalui API endpoint atau web interface.

## 📝 Contoh:

```
knowledge/
├── company-profile.pdf
├── product-catalog.docx
├── faq.txt
└── pricing-2024.pdf
```

## ⚠️ Tips:

- File akan otomatis dipecah menjadi chunks untuk indexing
- Nama file akan disimpan sebagai metadata
- File yang sama bisa di-re-process dengan menghapus dan menambahkan lagi
- Gunakan nama file yang deskriptif

## 🗑️ Menghapus Knowledge:

Untuk reset semua knowledge dari vector store:
```bash
npm run clear-knowledge
```

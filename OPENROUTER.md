# 🆓 Menggunakan OpenRouter (Model Gratis)

OpenRouter adalah API gateway yang menyediakan akses ke berbagai AI models, termasuk **model GRATIS**! Ini sempurna untuk development atau production dengan budget terbatas.

## 🎯 Keuntungan OpenRouter

✅ **Model Gratis** - Banyak model open-source gratis  
✅ **Hemat Biaya** - Jauh lebih murah dari OpenAI  
✅ **Banyak Pilihan** - 100+ model dari berbagai provider  
✅ **API Compatible** - Format sama dengan OpenAI API  
✅ **No Credit Card** - Bisa mulai tanpa kartu kredit

## 🚀 Setup OpenRouter

### 1. Dapatkan API Key (Gratis!)

1. Kunjungi: https://openrouter.ai/
2. Sign up dengan email atau Google
3. Pergi ke: https://openrouter.ai/keys
4. Generate API key baru
5. Copy API key (format: `sk-or-v1-xxxxx`)

### 2. Konfigurasi di `.env`

```env
# Enable OpenRouter
USE_OPENROUTER=true

# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx

# Model (pilih model gratis atau bayar)
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
```

### 3. Jalankan!

```bash
npm run sync-knowledge  # Sync dokumen
npm run dev             # Start server
```

Bot akan otomatis menggunakan OpenRouter! 🎉

## 📋 Model Gratis yang Tersedia

Berikut model **100% GRATIS** di OpenRouter:

### Recommended untuk Digi Bot:

| Model                                            | Context | Speed  | Kualitas   |
| ------------------------------------------------ | ------- | ------ | ---------- |
| `arcee-ai/trinity-large-preview:free`            | 4K      | ⚡⚡⚡ | ⭐⭐⭐⭐   |
| `meta-llama/llama-3.2-3b-instruct:free`          | 128K    | ⚡⚡⚡ | ⭐⭐⭐     |
| `google/gemini-2.0-flash-thinking-exp-1219:free` | 32K     | ⚡⚡   | ⭐⭐⭐⭐⭐ |
| `mistralai/mistral-7b-instruct:free`             | 32K     | ⚡⚡⚡ | ⭐⭐⭐     |
| `microsoft/phi-3-mini-128k-instruct:free`        | 128K    | ⚡⚡⚡ | ⭐⭐⭐     |

### Cara Ganti Model:

Edit `.env`:

```env
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp-1219:free
```

Atau test via API:

```bash
curl -X POST http://localhost:7000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Test model baru\"}"
```

## 💰 Perbandingan Biaya

### OpenAI (Paid):

- GPT-4o-mini: **$0.15** per 1M tokens input
- Embeddings: **$0.02** per 1M tokens

### OpenRouter (Free):

- Trinity Large: **$0.00** (GRATIS!)
- Gemini 2.0 Flash: **$0.00** (GRATIS!)
- Llama 3.2: **$0.00** (GRATIS!)

**Penghematan: 100%!** 🎉

## 🔄 Switch Antar Provider

Gampang banget switch antara OpenRouter dan OpenAI:

### Pakai OpenRouter (Gratis):

```env
USE_OPENROUTER=true
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### Pakai OpenAI (Berbayar):

```env
USE_OPENROUTER=false
OPENAI_API_KEY=sk-proj-xxxxx
```

Restart server dan done! 🚀

## ⚠️ Catatan Penting

### Embeddings:

OpenRouter tidak support embeddings API. Bot menggunakan:

- **Simple embedding** untuk free tier (kurang akurat)
- **Rekomendasi**: Untuk production, gunakan:
    - Voyage AI (free tier available)
    - Cohere (free tier available)
    - OpenAI embeddings (bayar tapi murah)

### Rate Limits:

Model gratis punya rate limit:

- **Requests**: ~20-30 per menit
- **Concurrency**: 1-2 simultan
- Cukup untuk dev dan small-scale production

### Kualitas:

Model gratis bagus untuk kebanyakan use case, tapi:

- Slower response time
- Kurang "smart" dibanding GPT-4
- Perfect untuk customer support, FAQ, documentation

## 🎓 Tips Optimasi

### 1. Pilih Model yang Tepat

- **Fast response**: `arcee-ai/trinity-large-preview:free`
- **Best quality**: `google/gemini-2.0-flash-thinking-exp-1219:free`
- **Long context**: `meta-llama/llama-3.2-3b-instruct:free`

### 2. Optimize Prompt

Model gratis lebih sensitive terhadap prompt quality:

```javascript
// Good prompt (concise)
"Jawab singkat: Apa itu Migrasi?";

// Less optimal (too verbose)
"Bisakah kamu dengan sangat detail dan panjang lebar menjelaskan...";
```

### 3. Cache Responses

Implement caching untuk pertanyaan common:

```javascript
// Di chatRoutes.js
const cache = {};
if (cache[message]) return cache[message];
```

### 4. Batch Processing

Process dokumen di background, bukan real-time:

```bash
npm run sync-knowledge  # Jalankan off-hours
```

## 🔍 Monitoring Usage

Check usage di OpenRouter dashboard:

1. Login: https://openrouter.ai/
2. Pergi ke "Activity"
3. Monitor requests & credits

## 🆘 Troubleshooting

### Error: "Invalid API key"

```bash
# Check API key format
echo $OPENROUTER_API_KEY
# Harus mulai dengan: sk-or-v1-
```

### Error: "Rate limit exceeded"

```bash
# Wait 1 minute atau upgrade ke paid plan
# Free tier: 20-30 req/min
```

### Response lambat

```bash
# Normal untuk free tier (2-5 detik)
# Ganti model yang lebih cepat:
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
```

### Kualitas jawaban kurang

```bash
# Coba model lebih baik:
OPENROUTER_MODEL=google/gemini-2.0-flash-thinking-exp-1219:free

# Atau improve system prompt di:
# src/services/openaiService.js
```

## 📚 Resources

- **OpenRouter Docs**: https://openrouter.ai/docs
- **Available Models**: https://openrouter.ai/models
- **API Reference**: https://openrouter.ai/docs/api-reference
- **Discord Community**: https://discord.gg/openrouter

## 🎉 Kesimpulan

OpenRouter + Model Gratis = Perfect untuk:

- ✅ Development & testing
- ✅ MVP & prototypes
- ✅ Small business dengan traffic rendah
- ✅ Learning & experimentation
- ✅ Budget terbatas

Untuk production dengan traffic tinggi:

- Consider paid models di OpenRouter (lebih murah dari OpenAI)
- Atau upgrade ke OpenAI untuk best quality

---

**Happy Coding dengan Model Gratis! 🚀**

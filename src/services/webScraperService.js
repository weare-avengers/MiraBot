const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const documentService = require('./documentService');
const openaiService = require('./openaiService');
const pineconeService = require('./pineconeService');
const documentDownloadService = require('./documentDownloadService');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

class WebScraperService {
  constructor() {
    this.hashFilePath = path.join(__dirname, '../../knowledge/scrape-hashes.json');
    this.hashes = this.loadHashes();
  }

  // ============================================================
  // Hash Management
  // ============================================================

  loadHashes() {
    try {
      if (fs.existsSync(this.hashFilePath)) {
        const data = fs.readFileSync(this.hashFilePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('⚠️  Error loading scrape hashes:', error.message);
    }
    return {};
  }

  saveHashes() {
    try {
      const dir = path.dirname(this.hashFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.hashFilePath, JSON.stringify(this.hashes, null, 2));
    } catch (error) {
      console.error('❌ Error saving scrape hashes:', error.message);
    }
  }

  computeHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  // ============================================================
  // Web Scraping
  // ============================================================

  async scrapeUrl(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MiraBot/1.0 (Knowledge Base Updater)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'
        },
        timeout: 15000
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error.message);
      return null;
    }
  }

  cleanContent(html, pageLabel) {
    const $ = cheerio.load(html);

    // ── Phase 1: Hapus elemen non-konten ──────────────────────
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('svg').remove();
    $('video').remove();
    $('audio').remove();
    $('link').remove();
    $('meta').remove();

    // ── Phase 2: Hapus elemen dekoratif/animasi ──────────────
    // Marquee / ticker (scrolling text "MIGRASI" berulang)
    $('[class*="marquee"]').remove();
    $('[class*="ticker"]').remove();
    $('[class*="running-text"]').remove();
    $('marquee').remove();

    // ── Phase 3: Hapus navigation & header ───────────────────
    $('nav').remove();
    $('header').remove();
    $('[role="navigation"]').remove();
    $('[class*="navbar"]').remove();
    $('[class*="nav-"]').remove();
    $('[class*="menu"]').remove();
    $('[class*="sidebar"]').remove();
    // Language switcher
    $('[class*="lang"]').remove();

    // ── Phase 4: Hapus footer ────────────────────────────────
    $('footer').remove();
    $('[role="contentinfo"]').remove();
    $('[class*="footer"]').remove();

    // ── Phase 5: Hapus section footer yang sering duplikat ───
    $('*').each((_, el) => {
      const directText = $(el).clone().children().remove().end().text().trim();
      if (
        directText === 'Quick Links' ||
        directText === 'Visit Us' ||
        directText === 'Contact Us' ||
        directText === '©Copyright. All rights reserved' ||
        directText === 'Operational Hours'
      ) {
        $(el).closest('section, div').first().remove();
      }
    });

    // ── Phase 6: Ekstrak alt text dari gambar SEBELUM dihapus ─
    $('img').each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt && alt.length > 3 && !/logo|icon|favicon|background|bg-/i.test(alt)) {
        // Ganti img dengan teks alt-nya agar info tidak hilang
        $(el).replaceWith(` [Gambar: ${alt}] `);
      } else {
        $(el).remove();
      }
    });

    // ── Phase 7: Extract text dari body content ──────────────
    // PENTING: Website ini meletakkan sebagian besar kontennya di luar <main>.
    // Jadi kita HARUS menggunakan $('body').text() secara langsung.
    let mainContent = $('body').text();

    // ── Phase 8: Clean up whitespace ─────────────────────────
    mainContent = mainContent
      .replace(/[ \t]+/g, ' ')        // Collapse horizontal spaces
      .replace(/\r\n/g, '\n')         // Normalize newlines
      .replace(/\n[ \t]*\n+/g, '\n\n') // Collapse multiple empty lines
      .trim();

    // ── Phase 9: Hapus pola navigasi yang mungkin tersisa ────
    const navPatterns = [
      // Top navigation patterns
      /Careers\s*Let's Talk/gi,
      /Who We Are.*?What We Do/gs,
      /Open menu/gi,
      /EN\s*ID/g,
      /ABOUTAbout Us/g,
      /TEAMSOur Teams/g,
      /PARTNERSOur Partners/g,
      /SERVICESOur Services/g,
      /PROJECTSOur Project/g,
      /PRODUCTSOur Products/g,
      /NEWSUpdates/g,
      /What We DoWe/g, // Specific fixing
      // Footer patterns
      /Operational Hours\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/g,
      /Rukan Grand Artzimar.*?Indonesia,?\s*\d{5}/g,
      /info@migrasi\.id/g,
      /\+62\s*[\d\s]+/g,
      /©Copyright\.?\s*All rights reserved\.?/gi,
      // Duplicate navigation links block
      /Who We Are\s*About Us\s*Our Teams\s*Our Partners\s*What We Do/g,
      /About Us\s*Our Teams\s*Our Partners/g,
      /Our Services\s*Our Project\s*Our Products\s*Updates/g,
      /Who We AreAbout UsOur TeamsOur PartnersWhat We DoOur ServicesOur ProjectOur ProductsUpdatesCareers/g,
    ];

    for (const pattern of navPatterns) {
      mainContent = mainContent.replace(pattern, '');
    }

    // ── Phase 10: Deduplikasi kata berulang berturut-turut ───
    // Menangani kasus seperti "MIGRASIMIGRASIMIGRASI..." (tanpa spasi)
    mainContent = mainContent.replace(/(\b[A-Za-z]{3,}\b)(?:\s*\1){3,}/gi, '$1');
    // Menangani kasus kata yang digabung tanpa spasi: "MIGRASIMIGRASIMIGRASI"
    mainContent = mainContent.replace(/([A-Z]{3,}?)\1{3,}/gi, '$1');

    // ── Phase 11: Menangani angka tanpa spasi yang digabung dengan huruf ---
    // Kadang "5.000Satisfied Clients" terjadi karena minify
    mainContent = mainContent.replace(/(\d[.\d]+)([A-Za-z])/g, '$1 $2');
    mainContent = mainContent.replace(/([a-z])([A-Z])/g, '$1 $2'); // Memisahkan CamelCase yang tergabung

    // ── Phase 12: Final cleanup ──────────────────────────────
    mainContent = mainContent
      .replace(/[ \t]{2,}/g, ' ')     // Collapse multiple horizontal spaces
      .replace(/^\s+|\s+$/gm, '')     // Trim lines
      .trim();

    mainContent = decodeHtmlEntities(mainContent);

    // ── Phase 13: Tambahkan label halaman sebagai context ────
    if (mainContent.length > 0) {
      mainContent = `[Halaman: ${pageLabel} - migrasi.id]\n\n${mainContent}`;
    }

    return mainContent;
  }

  // ============================================================
  // Scrape All Pages
  // ============================================================

  async scrapeAllPages(forceReindex = false) {
    const { baseUrl, pages, crawlDelay } = config.webScraper;
    const results = [];
    let newContentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log('\n🕷️  ═══════════════════════════════════════════');
    console.log('🕷️  Web Scraper - migrasi.id');
    console.log('🕷️  ═══════════════════════════════════════════');
    console.log(`📅 Timestamp: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    console.log(`🔗 Base URL: ${baseUrl}`);
    console.log(`📄 Pages to scrape: ${pages.length}`);
    console.log(`⏱️  Crawl delay: ${crawlDelay}ms`);
    console.log(`🔄 Force re-index: ${forceReindex}`);
    console.log('');

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const url = `${baseUrl}${page.path}`;

      console.log(`\n[${i + 1}/${pages.length}] 🌐 Scraping: ${page.label} (${url})`);

      try {
        // Fetch HTML
        const html = await this.scrapeUrl(url);
        if (!html) {
          console.log(`  ❌ Failed to fetch page`);
          errorCount++;
          results.push({ page: page.label, url, success: false, reason: 'fetch_failed' });
          continue;
        }

        // Clean content
        const cleanedText = this.cleanContent(html, page.label);

        // Check if content has changed
        const newHash = this.computeHash(cleanedText);
        const oldHash = this.hashes[page.path];

        if (!forceReindex && newHash === oldHash) {
          console.log(`  ⏭️  No changes detected, skipping`);
          skippedCount++;
          results.push({ page: page.label, url, success: true, reason: 'no_changes' });
          continue;
        }

        console.log(`  📝 Content: ${cleanedText.length} chars`);
        console.log(`  🔄 ${oldHash ? 'Content changed!' : 'New content!'}`);

        // Process: chunk → embed → upsert to Pinecone
        const chunks = documentService.splitIntoChunks(
          cleanedText,
          config.embeddings.chunkSize,
          config.embeddings.chunkOverlap
        );

        console.log(`  📦 Split into ${chunks.length} chunks`);

        const vectors = [];
        for (let j = 0; j < chunks.length; j++) {
          const chunk = chunks[j];
          const embedding = await openaiService.createEmbedding(chunk);

          vectors.push({
            id: `web-${page.path.replace(/\//g, '-') || 'home'}-chunk-${j}`,
            values: embedding,
            metadata: {
              text: chunk,
              source: 'web-scrape',
              url: url,
              page: page.label,
              chunkIndex: j,
              totalChunks: chunks.length,
              scrapedAt: new Date().toISOString()
            }
          });
        }

        // Upsert to Pinecone
        if (vectors.length > 0) {
          await pineconeService.upsertVectors(vectors);
          console.log(`  ✅ Indexed ${vectors.length} vectors to Pinecone`);
        }

        // Save document to download storage
        try {
          const saveResult = await documentDownloadService.saveScrapedContent(
            page.label,
            url,
            cleanedText,
            'md'
          );
          if (!saveResult.success) {
            console.error(`  ⚠️  Failed to save document: ${saveResult.error}`);
          }
        } catch (error) {
          console.error(`  ⚠️  Failed to save document: ${error.message}`);
        }

        // Update hash
        this.hashes[page.path] = newHash;
        newContentCount++;

        results.push({
          page: page.label,
          url,
          success: true,
          reason: 'indexed',
          chars: cleanedText.length,
          chunks: chunks.length
        });

      } catch (error) {
        console.error(`  ❌ Error processing ${page.label}:`, error.message);
        errorCount++;
        results.push({ page: page.label, url, success: false, reason: 'error', error: error.message });
      }

      // Crawl delay - respect robots.txt
      if (i < pages.length - 1) {
        console.log(`  ⏳ Waiting ${crawlDelay}ms...`);
        await this.sleep(crawlDelay);
      }
    }

    // Save updated hashes
    this.saveHashes();

    // Print summary
    console.log('\n🕷️  ═══════════════════════════════════════════');
    console.log('📊 SCRAPING SUMMARY');
    console.log('🕷️  ═══════════════════════════════════════════');
    console.log(`  📄 Total pages:     ${pages.length}`);
    console.log(`  ✅ New/Updated:     ${newContentCount}`);
    console.log(`  ⏭️  Skipped:         ${skippedCount}`);
    console.log(`  ❌ Errors:          ${errorCount}`);
    console.log('🕷️  ═══════════════════════════════════════════\n');

    return {
      success: true,
      totalPages: pages.length,
      newContent: newContentCount,
      skipped: skippedCount,
      errors: errorCount,
      results
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WebScraperService();

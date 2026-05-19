require('dotenv').config();
const pineconeService = require('../services/pineconeService');
const webScraperService = require('../services/webScraperService');
const documentDownloadService = require('../services/documentDownloadService');

const forceReindex = process.argv.includes('--force');

async function main() {
  try {
    console.log('🚀 Starting Website Scraping...\n');

    if (forceReindex) {
      console.log('⚠️  Force re-index mode: all pages will be re-indexed regardless of changes\n');
    }

    // Initialize Pinecone
    await pineconeService.initialize();

    // Run scraping
    const result = await webScraperService.scrapeAllPages(forceReindex);

    if (result.newContent > 0) {
      console.log(`🎉 Successfully indexed content from ${result.newContent} page(s)!`);
    } else if (result.skipped === result.totalPages) {
      console.log('ℹ️  No changes detected on any page. Knowledge base is up to date.');
      console.log('💡 Tip: Use --force flag to re-index all pages regardless of changes');
    }

    // Show download statistics
    console.log('\n📥 ═══════════════════════════════════════════');
    console.log('📥 DOWNLOAD SUMMARY');
    console.log('📥 ═══════════════════════════════════════════');
    const stats = documentDownloadService.getStatistics();
    console.log(`  📄 Total documents:      ${stats.totalDocuments}`);
    console.log(`  💾 Total file size:      ${formatBytes(stats.totalFileSize)}`);
    console.log(`  📊 Format breakdown:     ${JSON.stringify(stats.formatBreakdown)}`);
    if (stats.lastUpdated) {
      console.log(`  🕐 Last updated:         ${stats.lastUpdated}`);
    }
    console.log('📥 ═══════════════════════════════════════════\n');

    console.log('✅ Scraping completed! Documents are ready for download.');
    console.log('💡 Access downloads via: GET /api/downloads\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

main();

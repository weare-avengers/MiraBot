require('dotenv').config();
const pineconeService = require('../services/pineconeService');
const apiSyncService = require('../services/apiSyncService');
const documentDownloadService = require('../services/documentDownloadService');

const forceReindex = process.argv.includes('--force');

async function main() {
  try {
    console.log('🚀 Starting CMS API Knowledge Base Synchronization...\n');

    if (forceReindex) {
      console.log('⚠️  Force re-index mode: all API items will be re-indexed regardless of changes\n');
    }

    // Initialize Pinecone
    await pineconeService.initialize();

    // Run API Synchronization
    const result = await apiSyncService.syncAll(forceReindex);

    if (result.success) {
      if (result.updated > 0) {
        console.log(`🎉 Successfully synchronized ${result.updated} item(s) from CMS!`);
      } else if (result.skipped === result.totalItems && result.totalItems > 0) {
        console.log('ℹ️  No changes detected on any item. Knowledge base is up to date.');
        console.log('💡 Tip: Use --force flag to re-index all items regardless of changes');
      }
    } else {
      console.log('⚠️  Synchronization finished with errors.');
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

    console.log('✅ Synchronization completed!');
    console.log('💡 Access downloads via: GET /api/downloads\n');

    process.exitCode = 0;
  } catch (error) {
    console.error('\n❌ Synchronization failed:', error);
    process.exitCode = 1;
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

/**
 * Test script untuk Document Download Feature
 * Run: node src/scripts/testDownloads.js
 */

const documentDownloadService = require('../services/documentDownloadService');

async function testFeatures() {
  console.log('🧪 Testing Document Download Feature\n');

  try {
    // Test 1: Get all documents
    console.log('1️⃣  Getting all documents...');
    const allDocs = documentDownloadService.getAllDocuments();
    console.log(`   ✅ Found ${allDocs.totalDocuments} documents\n`);

    // Test 2: Get statistics
    console.log('2️⃣  Getting statistics...');
    const stats = documentDownloadService.getStatistics();
    console.log(`   ✅ Total size: ${formatBytes(stats.totalFileSize)}`);
    console.log(`   📊 Format breakdown: ${JSON.stringify(stats.formatBreakdown)}\n`);

    // Test 3: Save a test document
    console.log('3️⃣  Saving test document...');
    const testContent = `
# Test Document

Created on ${new Date().toLocaleString()}.

## Sample
This is a test document.
    `;

    const saveResult = await documentDownloadService.saveScrapedContent(
      'Test Page',
      'http://example.com/test',
      testContent,
      'md'
    );

    if (saveResult.success) {
      console.log(`   ✅ Document saved: ${saveResult.filename}\n`);

      // Test 4: Get specific document
      console.log('4️⃣  Retrieving saved document...');
      const doc = documentDownloadService.getDocumentById(saveResult.id);
      if (doc && doc.content) {
        console.log(`   ✅ Retrieved: ${doc.filename}\n`);
      }

      // Test 5: Get updated statistics
      console.log('5️⃣  Updated statistics...');
      const newStats = documentDownloadService.getStatistics();
      console.log(`   ✅ New total: ${newStats.totalDocuments} documents\n`);

      console.log('✅ All tests passed!');
    } else {
      console.log(`   ❌ Failed to save: ${saveResult.error}`);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

testFeatures();

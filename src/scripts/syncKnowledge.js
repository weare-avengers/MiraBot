require('dotenv').config();
const knowledgeBaseService = require('../services/knowledgeBaseService');
const pineconeService = require('../services/pineconeService');

async function main() {
  try {
    console.log('🚀 Starting Knowledge Base Sync...\n');

    // Initialize Pinecone first
    await pineconeService.initialize();

    // Initialize knowledge base
    await knowledgeBaseService.initialize();

    // Sync all files from knowledge directory
    const result = await knowledgeBaseService.syncAll();

    if (result.totalFiles === 0) {
      console.log('💡 Tip: Add your documents (PDF, Word, TXT) to the knowledge folder');
      console.log(`📁 Location: ${knowledgeBaseService.getKnowledgePath()}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

main();

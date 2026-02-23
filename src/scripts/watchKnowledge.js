require('dotenv').config();
const knowledgeBaseService = require('../services/knowledgeBaseService');

async function main() {
  try {
    console.log('👀 Starting Knowledge Base Watcher...\n');

    // Initialize knowledge base
    await knowledgeBaseService.initialize();

    console.log('💡 Instructions:');
    console.log(`   1. Add files to: ${knowledgeBaseService.getKnowledgePath()}`);
    console.log('   2. Files will be auto-processed within 5 seconds');
    console.log('   3. Press Ctrl+C to stop\n');

    // Start watching
    await knowledgeBaseService.watchDirectory((filename, result) => {
      // Callback for each processed file
      console.log(`📝 File "${filename}" indexed successfully!`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  Stopping watcher...');
      knowledgeBaseService.stopWatching();
      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ Watcher failed:', error);
    process.exit(1);
  }
}

main();

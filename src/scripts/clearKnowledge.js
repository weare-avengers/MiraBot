require('dotenv').config();
const readline = require('readline');
const pineconeService = require('../services/pineconeService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    console.log('🗑️  Clear Knowledge Base\n');
    console.log('⚠️  WARNING: This will delete ALL documents from the vector store!');
    console.log(`   Namespace: ${process.env.PINECONE_NAMESPACE || 'digi'}\n`);

    rl.question('Are you sure? Type "yes" to confirm: ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\n🔄 Clearing knowledge base...');
        
        await pineconeService.initialize();
        await pineconeService.deleteAll();
        
        console.log('✅ Knowledge base cleared successfully!\n');
      } else {
        console.log('\n❌ Operation cancelled\n');
      }

      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Failed to clear knowledge base:', error);
    rl.close();
    process.exit(1);
  }
}

main();

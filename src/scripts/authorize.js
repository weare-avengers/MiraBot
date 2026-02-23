require('dotenv').config();
const readline = require('readline');
const googleDriveService = require('../services/googleDriveService');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  try {
    console.log('🔐 Google Drive OAuth Setup\n');

    // Initialize OAuth client
    await googleDriveService.initialize();

    // Get auth URL
    const authUrl = await googleDriveService.getAuthUrl();

    console.log('Please visit this URL to authorize the application:');
    console.log(authUrl);
    console.log('');

    rl.question('Enter the authorization code: ', async (code) => {
      const success = await googleDriveService.setTokenFromCode(code);
      
      if (success) {
        console.log('\n✅ Authorization successful!');
        console.log('You can now run: npm run sync-knowledge');
      } else {
        console.log('\n❌ Authorization failed');
      }

      rl.close();
      process.exit(success ? 0 : 1);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

main();

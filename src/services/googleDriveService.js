const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const documentService = require('../services/documentService');

class GoogleDriveSync {
  constructor() {
    this.drive = null;
    this.oauth2Client = null;
  }

  async initialize() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        config.googleDrive.clientId,
        config.googleDrive.clientSecret,
        config.googleDrive.redirectUri
      );

      // Load token if exists
      const tokenPath = path.join(__dirname, '../../token.json');
      if (fs.existsSync(tokenPath)) {
        const token = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
        this.oauth2Client.setCredentials(token);
      } else {
        console.log('⚠️  No token found. Run the authorization flow first.');
        return false;
      }

      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      console.log('✅ Google Drive initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error);
      return false;
    }
  }

  async getAuthUrl() {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly']
    });
    return authUrl;
  }

  async setTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Save token
      const tokenPath = path.join(__dirname, '../../token.json');
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
      
      console.log('✅ Token saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error setting token:', error);
      return false;
    }
  }

  async listFiles(folderId) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, modifiedTime, size)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('❌ Error listing files:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      throw error;
    }
  }

  async syncFolder(folderId = config.googleDrive.folderId) {
    try {
      console.log('🔄 Starting Google Drive sync...');
      
      const files = await this.listFiles(folderId);
      console.log(`📁 Found ${files.length} files in folder`);

      const results = [];
      for (const file of files) {
        try {
          // Skip non-document files
          const supportedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.google-apps.document'
          ];

          if (!supportedTypes.includes(file.mimeType)) {
            console.log(`⏭️  Skipping ${file.name} (unsupported type: ${file.mimeType})`);
            continue;
          }

          console.log(`📥 Processing: ${file.name}`);

          // Download file
          let fileBuffer;
          let mimeType = file.mimeType;

          if (file.mimeType === 'application/vnd.google-apps.document') {
            // Export Google Docs as PDF
            const response = await this.drive.files.export(
              { fileId: file.id, mimeType: 'application/pdf' },
              { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
            mimeType = 'application/pdf';
          } else {
            fileBuffer = await this.downloadFile(file.id);
          }

          // Process and index the document
          const result = await documentService.processDocument(
            fileBuffer,
            file.name,
            mimeType
          );

          results.push(result);
          console.log(`✅ Processed: ${file.name}`);
        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error);
          results.push({
            success: false,
            filename: file.name,
            error: error.message
          });
        }
      }

      console.log('✅ Google Drive sync completed');
      return {
        success: true,
        totalFiles: files.length,
        processedFiles: results.length,
        successCount: results.filter(r => r.success).length,
        results
      };
    } catch (error) {
      console.error('❌ Error syncing folder:', error);
      throw error;
    }
  }

  async watchFolder(folderId = config.googleDrive.folderId, interval = 60000) {
    let lastCheck = new Date();
    
    console.log(`👀 Watching folder for changes (checking every ${interval/1000}s)...`);

    setInterval(async () => {
      try {
        const files = await this.listFiles(folderId);
        const newFiles = files.filter(file => new Date(file.modifiedTime) > lastCheck);

        if (newFiles.length > 0) {
          console.log(`🆕 Found ${newFiles.length} new/modified files`);
          
          for (const file of newFiles) {
            try {
              console.log(`📥 Processing new file: ${file.name}`);
              
              let fileBuffer;
              let mimeType = file.mimeType;

              if (file.mimeType === 'application/vnd.google-apps.document') {
                const response = await this.drive.files.export(
                  { fileId: file.id, mimeType: 'application/pdf' },
                  { responseType: 'arraybuffer' }
                );
                fileBuffer = Buffer.from(response.data);
                mimeType = 'application/pdf';
              } else {
                fileBuffer = await this.downloadFile(file.id);
              }

              await documentService.processDocument(fileBuffer, file.name, mimeType);
              console.log(`✅ Processed: ${file.name}`);
            } catch (error) {
              console.error(`❌ Error processing ${file.name}:`, error);
            }
          }
        }

        lastCheck = new Date();
      } catch (error) {
        console.error('❌ Error checking for updates:', error);
      }
    }, interval);
  }
}

module.exports = new GoogleDriveSync();

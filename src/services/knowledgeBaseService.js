const fs = require('fs');
const path = require('path');
const documentService = require('./documentService');

class KnowledgeBaseService {
  constructor() {
    this.knowledgeDir = path.join(__dirname, '../../knowledge');
    this.processedFiles = new Set();
    this.watchInterval = null;
  }

  async initialize() {
    // Ensure knowledge directory exists
    if (!fs.existsSync(this.knowledgeDir)) {
      fs.mkdirSync(this.knowledgeDir, { recursive: true });
      console.log('📁 Created knowledge directory');
    }
    
    console.log(`📚 Knowledge base directory: ${this.knowledgeDir}`);
  }

  async syncAll() {
    try {
      console.log('🔄 Syncing knowledge base from local directory...\n');

      const files = this.getDocumentFiles();
      
      if (files.length === 0) {
        console.log('📭 No documents found in knowledge directory');
        console.log(`💡 Add files to: ${this.knowledgeDir}\n`);
        return {
          success: true,
          totalFiles: 0,
          processedFiles: 0,
          successCount: 0,
          results: []
        };
      }

      console.log(`📁 Found ${files.length} document(s) to process\n`);

      const results = [];
      for (const file of files) {
        try {
          const filePath = path.join(this.knowledgeDir, file);
          const stats = fs.statSync(filePath);
          
          console.log(`📥 Processing: ${file} (${this.formatFileSize(stats.size)})`);

          // Read file buffer
          const buffer = fs.readFileSync(filePath);
          const mimeType = this.getMimeType(file);

          // Process and index the document
          const result = await documentService.processDocument(
            buffer,
            file,
            mimeType
          );

          results.push(result);
          this.processedFiles.add(file);
          console.log(`✅ Success: ${result.chunksProcessed} chunks indexed\n`);
        } catch (error) {
          console.error(`❌ Error processing ${file}:`, error.message, '\n');
          results.push({
            success: false,
            filename: file,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log('📊 Sync Summary:');
      console.log(`   Total files: ${files.length}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Failed: ${files.length - successCount}`);
      console.log('✅ Sync completed!\n');

      return {
        success: true,
        totalFiles: files.length,
        processedFiles: results.length,
        successCount,
        results
      };
    } catch (error) {
      console.error('❌ Error syncing knowledge base:', error);
      throw error;
    }
  }

  async watchDirectory(callback) {
    console.log('👀 Watching knowledge directory for changes...');
    console.log(`📁 Directory: ${this.knowledgeDir}\n`);

    // Initial sync
    const initialFiles = this.getDocumentFiles();
    initialFiles.forEach(file => this.processedFiles.add(file));

    // Watch for new files every 5 seconds
    this.watchInterval = setInterval(async () => {
      const currentFiles = this.getDocumentFiles();
      const newFiles = currentFiles.filter(file => !this.processedFiles.has(file));

      if (newFiles.length > 0) {
        console.log(`\n🆕 Detected ${newFiles.length} new file(s)!`);
        
        for (const file of newFiles) {
          try {
            const filePath = path.join(this.knowledgeDir, file);
            const buffer = fs.readFileSync(filePath);
            const mimeType = this.getMimeType(file);

            console.log(`📥 Auto-processing: ${file}`);

            const result = await documentService.processDocument(
              buffer,
              file,
              mimeType
            );

            this.processedFiles.add(file);
            console.log(`✅ Success: ${result.chunksProcessed} chunks indexed\n`);

            if (callback) {
              callback(file, result);
            }
          } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message, '\n');
          }
        }
      }
    }, 5000); // Check every 5 seconds
  }

  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      console.log('⏹️  Stopped watching knowledge directory');
    }
  }

  getDocumentFiles() {
    if (!fs.existsSync(this.knowledgeDir)) {
      return [];
    }

    const files = fs.readdirSync(this.knowledgeDir);
    
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.pdf', '.doc', '.docx', '.txt'].includes(ext);
    });
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getKnowledgePath() {
    return this.knowledgeDir;
  }

  async processFile(filename) {
    try {
      const filePath = path.join(this.knowledgeDir, filename);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const buffer = fs.readFileSync(filePath);
      const mimeType = this.getMimeType(filename);

      const result = await documentService.processDocument(
        buffer,
        filename,
        mimeType
      );

      this.processedFiles.add(filename);
      return result;
    } catch (error) {
      console.error(`❌ Error processing file:`, error);
      throw error;
    }
  }
}

module.exports = new KnowledgeBaseService();

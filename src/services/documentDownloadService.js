const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DocumentDownloadService {
  constructor() {
    this.downloadDir = path.join(__dirname, '../../knowledge/downloads');
    this.metadataFile = path.join(this.downloadDir, '_metadata.json');
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Error creating download directory:', error.message);
    }
  }

  loadMetadata() {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const data = fs.readFileSync(this.metadataFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('⚠️  Error loading metadata:', error.message);
    }
    return { documents: [] };
  }

  saveMetadata(metadata) {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      console.error('❌ Error saving metadata:', error.message);
    }
  }

  async saveScrapedContent(pageLabel, url, content, format = 'md') {
    try {
      // Hilangkan timestamp agar file sebelumnya ditimpa (overwrite)
      const filename = `${pageLabel.toLowerCase().replace(/\s+/g, '-')}.${format}`;
      const filepath = path.join(this.downloadDir, filename);
      
      let fileContent;
      
      if (format === 'json') {
        fileContent = JSON.stringify({
          title: pageLabel,
          url: url,
          scrapedAt: new Date().toISOString(),
          content: content
        }, null, 2);
      } else if (format === 'md') {
        fileContent = `# ${pageLabel}\n\n`;
        fileContent += `**Sumber:** ${url}\n`;
        fileContent += `**Di-scrape:** ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n`;
        fileContent += `---\n\n`;
        fileContent += content;
      } else {
        fileContent = content;
      }

      fs.writeFileSync(filepath, fileContent);

      const metadata = this.loadMetadata();
      const existingIndex = metadata.documents.findIndex(d => d.pageLabel === pageLabel);

      const docInfo = {
        id: existingIndex >= 0 ? metadata.documents[existingIndex].id : uuidv4(),
        filename: filename,
        pageLabel: pageLabel,
        url: url,
        format: format,
        fileSize: Buffer.byteLength(fileContent),
        contentLength: content.length,
        scrapedAt: new Date().toISOString(),
        status: 'completed'
      };

      if (existingIndex >= 0) {
        metadata.documents[existingIndex] = docInfo;
      } else {
        metadata.documents.push(docInfo);
      }

      metadata.lastUpdated = new Date().toISOString();
      metadata.totalDocuments = metadata.documents.length;

      this.saveMetadata(metadata);

      console.log(`  💾 Downloaded: ${filename}`);
      return {
        success: true,
        ...docInfo
      };
    } catch (error) {
      console.error(`❌ Error saving document for ${pageLabel}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getAllDocuments() {
    const metadata = this.loadMetadata();
    return metadata;
  }

  getDocumentById(documentId) {
    const metadata = this.loadMetadata();
    const doc = metadata.documents.find(d => d.id === documentId);
    
    if (!doc) {
      return null;
    }

    try {
      const filepath = path.join(this.downloadDir, doc.filename);
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        return {
          ...doc,
          content: content
        };
      }
    } catch (error) {
      console.error('Error reading document file:', error.message);
    }

    return doc;
  }

  getDocumentFilePath(documentId) {
    const metadata = this.loadMetadata();
    const doc = metadata.documents.find(d => d.id === documentId);
    
    if (!doc) {
      return null;
    }

    const filepath = path.join(this.downloadDir, doc.filename);
    if (fs.existsSync(filepath)) {
      return filepath;
    }

    return null;
  }

  deleteDocument(documentId) {
    try {
      const metadata = this.loadMetadata();
      const docIndex = metadata.documents.findIndex(d => d.id === documentId);
      
      if (docIndex === -1) {
        return { success: false, error: 'Document not found' };
      }

      const doc = metadata.documents[docIndex];
      const filepath = path.join(this.downloadDir, doc.filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      metadata.documents.splice(docIndex, 1);
      metadata.lastUpdated = new Date().toISOString();
      metadata.totalDocuments = metadata.documents.length;

      this.saveMetadata(metadata);

      console.log(`  🗑️  Deleted: ${doc.filename}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting document:', error.message);
      return { success: false, error: error.message };
    }
  }

  getStatistics() {
    try {
      const metadata = this.loadMetadata();
      let totalSize = 0;
      let totalContent = 0;

      for (const doc of metadata.documents) {
        totalSize += doc.fileSize || 0;
        totalContent += doc.contentLength || 0;
      }

      return {
        totalDocuments: metadata.documents.length,
        totalFileSize: totalSize,
        totalContentSize: totalContent,
        formatBreakdown: this.getFormatBreakdown(metadata.documents),
        lastUpdated: metadata.lastUpdated
      };
    } catch (error) {
      console.error('Error getting statistics:', error.message);
      return { error: error.message };
    }
  }

  getFormatBreakdown(documents) {
    const breakdown = {};
    for (const doc of documents) {
      breakdown[doc.format] = (breakdown[doc.format] || 0) + 1;
    }
    return breakdown;
  }
}

module.exports = new DocumentDownloadService();

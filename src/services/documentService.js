const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { v4: uuidv4 } = require('uuid');
const openaiService = require('./openaiService');
const pineconeService = require('./pineconeService');
const config = require('../config/config');

class DocumentService {
  async processDocument(buffer, filename, mimeType) {
    try {
      let text = '';

      // Extract text based on file type
      if (mimeType.includes('pdf')) {
        const data = await pdf(buffer);
        text = data.text;
      } else if (mimeType.includes('word') || mimeType.includes('document')) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (mimeType.includes('text') || mimeType.includes('plain')) {
        text = buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Split text into chunks
      const chunks = this.splitIntoChunks(text, config.embeddings.chunkSize, config.embeddings.chunkOverlap);

      // Create embeddings and prepare vectors for Pinecone
      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await openaiService.createEmbedding(chunk);
        
        vectors.push({
          id: `${filename}-chunk-${i}-${uuidv4()}`,
          values: embedding,
          metadata: {
            text: chunk,
            file: filename,
            chunkIndex: i,
            totalChunks: chunks.length,
            createdAt: new Date().toISOString()
          }
        });
      }

      // Upsert to Pinecone
      await pineconeService.upsertVectors(vectors);

      return {
        success: true,
        filename,
        chunksProcessed: chunks.length,
        message: `Successfully processed and indexed ${chunks.length} chunks from ${filename}`
      };
    } catch (error) {
      console.error('❌ Error processing document:', error);
      throw error;
    }
  }

  splitIntoChunks(text, chunkSize = 500, overlap = 20) {
    // 1. Try semantic markdown chunking first if the text contains headings or page labels
    if (text.includes('#') || text.includes('[Halaman:')) {
      const markdownChunks = this.splitMarkdownIntoSemanticChunks(text);
      if (markdownChunks && markdownChunks.length > 0) {
        return markdownChunks;
      }
    }

    // 2. Fallback to classic sentence-based chunking
    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;

      if (currentLength + sentenceLength > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        
        // Keep overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-overlap);
        currentChunk = overlapWords.join(' ') + ' ';
        currentLength = currentChunk.length;
      }

      currentChunk += sentence;
      currentLength += sentenceLength;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  splitMarkdownIntoSemanticChunks(text) {
    const lines = text.split('\n');
    const chunks = [];
    let pageContext = '';
    
    // Extract page context if it exists (e.g., "[Halaman: Services - migrasi.id]")
    for (const line of lines) {
      if (line.trim().startsWith('[Halaman:') && line.trim().endsWith(']')) {
        pageContext = line.trim();
        break;
      }
    }

    let currentSectionTitle = '';
    let currentContentLines = [];

    const saveChunk = () => {
      const contentText = currentContentLines.join('\n').trim();
      if (contentText) {
        let headerText = '';
        if (pageContext) {
          headerText += `${pageContext}\n\n`;
        }
        if (currentSectionTitle) {
          headerText += `${currentSectionTitle}\n`;
        }
        
        const fullChunkText = (headerText + contentText).trim();
        
        // If the chunk is excessively long, split it into smaller sub-chunks while injecting the header/page context
        if (contentText.length > 1000) {
          const subChunks = this.splitTextIntoSubChunks(contentText, 800, 100);
          for (const subChunk of subChunks) {
            chunks.push(`${headerText}${subChunk}`.trim());
          }
        } else {
          chunks.push(fullChunkText);
        }
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip the page context line in the content to avoid duplicating it
      if (trimmed === pageContext) {
        continue;
      }

      // Check if this line is a markdown heading
      if (/^#{1,4}\s+/.test(trimmed)) {
        // Save previous chunk
        saveChunk();
        
        // Start a new chunk
        currentSectionTitle = trimmed;
        currentContentLines = [];
      } else if (trimmed === '---') {
        // Save previous chunk on section separators
        saveChunk();
        currentSectionTitle = '';
        currentContentLines = [];
      } else {
        currentContentLines.push(line);
      }
    }

    // Save final chunk
    saveChunk();

    return chunks;
  }

  splitTextIntoSubChunks(text, maxChars = 800, overlapChars = 100) {
    const subChunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentSub = '';
    for (const sentence of sentences) {
      if (currentSub.length + sentence.length > maxChars && currentSub) {
        subChunks.push(currentSub.trim());
        currentSub = currentSub.slice(-overlapChars) + sentence;
      } else {
        currentSub += sentence;
      }
    }
    if (currentSub.trim()) {
      subChunks.push(currentSub.trim());
    }
    return subChunks;
  }
}

module.exports = new DocumentService();

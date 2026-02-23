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
}

module.exports = new DocumentService();

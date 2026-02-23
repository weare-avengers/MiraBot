const { Pinecone } = require('@pinecone-database/pinecone');
const config = require('../config/config');

class PineconeService {
  constructor() {
    this.client = null;
    this.index = null;
  }

  async initialize() {
    try {
      this.client = new Pinecone({
        apiKey: config.pinecone.apiKey
      });

      this.index = this.client.index(config.pinecone.indexName);
      console.log('✅ Pinecone initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  async queryVectors(embedding, topK = 5) {
    try {
      const queryResponse = await this.index.namespace(config.pinecone.namespace).query({
        vector: embedding,
        topK: topK,
        includeMetadata: true
      });

      return queryResponse.matches;
    } catch (error) {
      console.error('❌ Error querying vectors:', error);
      throw error;
    }
  }

  async upsertVectors(vectors) {
    try {
      await this.index.namespace(config.pinecone.namespace).upsert(vectors);
      console.log(`✅ Upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      console.error('❌ Error upserting vectors:', error);
      throw error;
    }
  }

  async deleteAll() {
    try {
      await this.index.namespace(config.pinecone.namespace).deleteAll();
      console.log('✅ Deleted all vectors from namespace');
    } catch (error) {
      console.error('❌ Error deleting vectors:', error);
      throw error;
    }
  }
}

module.exports = new PineconeService();

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

  async deleteByFilter(filter) {
    try {
      await this.index.namespace(config.pinecone.namespace).deleteMany({ filter });
      console.log(`✅ Deleted previous vectors matching filter:`, filter);
    } catch (error) {
      console.error('❌ Error deleting vectors by filter:', error);
      throw error;
    }
  }

  async deleteMany(ids) {
    try {
      await this.index.namespace(config.pinecone.namespace).deleteMany(ids);
      console.log(`✅ Deleted up to ${ids.length} potential vectors by ID list`);
    } catch (error) {
      console.error('❌ Error deleting vectors by IDs:', error);
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

require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
  },
  
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free',
    baseURL: 'https://openrouter.ai/api/v1',
    enabled: process.env.USE_OPENROUTER === 'true'
  },
  
  jina: {
    apiKey: process.env.JINA_API_KEY || 'free', // 'free' untuk rate-limited, atau daftar API key gratis
    baseURL: 'https://api.jina.ai/v1',
    embeddingModel: 'jina-embeddings-v3',
    enabled: process.env.USE_JINA_EMBEDDINGS === 'true'
  },
  
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
    indexName: process.env.PINECONE_INDEX_NAME || 'n8n-digi',
    namespace: process.env.PINECONE_NAMESPACE || 'digi'
  },
  
  googleDrive: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    folderId: process.env.GOOGLE_FOLDER_ID
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'digi-secret-key-change-this'
  },
  
  embeddings: {
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 500,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 20
  }
};

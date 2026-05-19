const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config');
const pineconeService = require('./services/pineconeService');
const knowledgeBaseService = require('./services/knowledgeBaseService');
const chatRoutes = require('./routes/chatRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const downloadRoutes = require('./routes/downloadRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: config.nodeEnv === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from examples directory
app.use('/examples', express.static(path.join(__dirname, '../examples')));
app.use('/knowledge', express.static(path.join(__dirname, '../knowledge')));

// Routes
app.use('/api', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/downloads', downloadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Digi AI Assistant'
  });
});

// Root endpoint - Serve welcome page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../examples/welcome.html'));
});

// API Info endpoint (untuk development/debug)
app.get('/api-info', (req, res) => {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString()
  };

  // Hanya tampilkan endpoints info di development dengan authentication
  if (config.nodeEnv === 'development' && req.query.debug === process.env.DEBUG_TOKEN) {
    response.service = 'Digi AI Assistant';
    response.version = '1.0.0';
    response.endpoints = {
      chat: 'POST /api/chat',
      streamChat: 'POST /api/chat/stream',
      getHistory: 'GET /api/chat/:sessionId',
      clearHistory: 'DELETE /api/chat/:sessionId',
      uploadDocument: 'POST /api/knowledge/upload',
      bulkUpload: 'POST /api/knowledge/upload/bulk'
    };
  }

  res.json(response);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting Digi AI Assistant...');
    
    // Initialize Pinecone
    await pineconeService.initialize();
    
    // Initialize Knowledge Base
    await knowledgeBaseService.initialize();
    
    // Start watching knowledge directory if AUTO_WATCH is enabled
    if (process.env.AUTO_WATCH === 'true') {
      console.log('👀 Auto-watch enabled for knowledge directory\n');
      knowledgeBaseService.watchDirectory((filename, result) => {
        console.log(`📝 Auto-processed: ${filename}`);
      });
    }
    
    // Start web scraper scheduler if enabled
    if (config.webScraper.enabled) {
      const scrapeScheduler = require('./services/scrapeScheduler');
      scrapeScheduler.start();
    }
    
    // Start Express server
    app.listen(config.port, () => {
      console.log(`✅ Server running on port ${config.port}`);
      console.log(`🌐 API: http://localhost:${config.port}`);
      console.log(`💬 Chat endpoint: http://localhost:${config.port}/api/chat`);
      console.log(`📚 Upload endpoint: http://localhost:${config.port}/api/knowledge/upload`);
      console.log(`📁 Knowledge folder: ${knowledgeBaseService.getKnowledgePath()}`);
      
      if (process.env.AUTO_WATCH === 'true') {
        console.log('👀 Auto-watch: ENABLED - Files in knowledge folder will be auto-processed');
      } else {
        console.log('💡 Tip: Set AUTO_WATCH=true in .env to enable auto-processing');
      }
      
      if (config.webScraper.enabled) {
        console.log(`🕷️  Web scraper: ENABLED - Schedule: ${config.webScraper.schedule}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;

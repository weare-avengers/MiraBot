const express = require('express');
const openaiService = require('../services/openaiService');

const router = express.Router();

// Helper function untuk parse response bubble
// ⚡ Content is in Markdown format - frontend should parse it with marked.js or similar
function parseBubbleResponse(response) {
  // Split by ||| separator
  const parts = response.split('|||').map(p => p.trim()).filter(p => p.length > 0);
  
  if (parts.length === 1) {
    // Single bubble (simple response)
    return {
      bubbles: [
        { type: 'main', content: parts[0], format: 'markdown' }
      ],
      raw: response
    };
  } else if (parts.length === 2) {
    // Two bubbles (intro + main)
    return {
      bubbles: [
        { type: 'intro', content: parts[0], format: 'markdown' },
        { type: 'main', content: parts[1], format: 'markdown' }
      ],
      raw: response
    };
  } else if (parts.length === 3) {
    // Three bubbles (intro + main + cta)
    return {
      bubbles: [
        { type: 'intro', content: parts[0], format: 'markdown' },
        { type: 'main', content: parts[1], format: 'markdown' },
        { type: 'cta', content: parts[2], format: 'markdown' }
      ],
      raw: response
    };
  }
  
  // Fallback jika tidak ada separator
  return {
    bubbles: [
      { type: 'main', content: response, format: 'markdown' }
    ],
    raw: response
  };
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Get or initialize conversation history from session
    if (!req.session.conversations) {
      req.session.conversations = {};
    }

    const conversationId = sessionId || 'default';
    if (!req.session.conversations[conversationId]) {
      req.session.conversations[conversationId] = [];
    }

    const conversationHistory = req.session.conversations[conversationId];

    // Get response from OpenAI
    const assistantResponse = await openaiService.chat(message, conversationHistory);

    // Parse bubble response
    const parsedResponse = parseBubbleResponse(assistantResponse);

    // Update conversation history
    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: assistantResponse });

    // Keep only last 20 messages (10 exchanges)
    if (conversationHistory.length > 20) {
      req.session.conversations[conversationId] = conversationHistory.slice(-20);
    }

    res.json({
      success: true,
      response: assistantResponse,
      bubbles: parsedResponse.bubbles,
      sessionId: conversationId
    });
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    
    // Handle timeout error dengan pesan khusus
    if (error.name === 'TimeoutError') {
      return res.status(503).json({ 
        success: false, 
        error: 'Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Stream chat endpoint (Server-Sent Events)
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get conversation history
    if (!req.session.conversations) {
      req.session.conversations = {};
    }

    const conversationId = sessionId || 'default';
    if (!req.session.conversations[conversationId]) {
      req.session.conversations[conversationId] = [];
    }

    const conversationHistory = req.session.conversations[conversationId];

    // Stream response
    const fullResponse = await openaiService.streamChat(
      message,
      conversationHistory,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    // Parse bubble response
    const parsedResponse = parseBubbleResponse(fullResponse);

    // Update conversation history
    conversationHistory.push({ role: 'user', content: message });
    conversationHistory.push({ role: 'assistant', content: fullResponse });

    if (conversationHistory.length > 20) {
      req.session.conversations[conversationId] = conversationHistory.slice(-20);
    }

    // Send bubbles data
    res.write(`data: ${JSON.stringify({ bubbles: parsedResponse.bubbles })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('❌ Error in stream chat endpoint:', error);
    
    // Handle timeout error dengan pesan khusus
    if (error.name === 'TimeoutError') {
      res.write(`data: ${JSON.stringify({ 
        error: 'Saat ini chat assistant sedang dalam trafic tinggi, silahkan coba lagi beberapa saat kemudian',
        timeout: true
      })}\n\n`);
      res.end();
      return;
    }
    
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Clear conversation history
router.delete('/chat/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (req.session.conversations && req.session.conversations[sessionId]) {
      delete req.session.conversations[sessionId];
    }

    res.json({ 
      success: true, 
      message: 'Conversation history cleared' 
    });
  } catch (error) {
    console.error('❌ Error clearing conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear conversation' 
    });
  }
});

// Get conversation history
router.get('/chat/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const history = req.session.conversations?.[sessionId] || [];

    res.json({ 
      success: true, 
      history,
      sessionId 
    });
  } catch (error) {
    console.error('❌ Error getting conversation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get conversation history' 
    });
  }
});

module.exports = router;

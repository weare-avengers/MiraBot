const express = require('express');
const multer = require('multer');
const documentService = require('../services/documentService');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and text files are allowed.'));
    }
  }
});

// Upload and process document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const result = await documentService.processDocument(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process document',
      details: error.message 
    });
  }
});

// Bulk upload endpoint
router.post('/upload/bulk', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    const results = [];
    for (const file of req.files) {
      try {
        const result = await documentService.processDocument(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      totalFiles: req.files.length,
      successCount: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process documents',
      details: error.message 
    });
  }
});

// Webhook endpoint to trigger database-to-Pinecone auto-sync from CMS changes
router.post('/sync-webhook', async (req, res) => {
  try {
    const { secret, force } = req.body;
    
    // Validate secret token
    const config = require('../config/config');
    const expectedSecret = config.cmsApi.webhookSyncSecret || 'Migrasi#0987';
    
    if (secret !== expectedSecret) {
      console.warn('⚠️  Webhook synchronization attempt blocked: Invalid secret token.');
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden: Invalid secret token' 
      });
    }

    console.log('⚡ Webhook triggered! Initiating API CMS Knowledge Base synchronization in the background...');

    // Trigger sync asynchronously in background to prevent HTTP timeout in NestJS CMS
    const apiSyncService = require('../services/apiSyncService');
    apiSyncService.syncAll(force === true)
      .then(result => {
        console.log('✅ Webhook triggered background sync completed successfully.');
      })
      .catch(error => {
        console.error('❌ Webhook triggered background sync failed:', error);
      });

    // Return instant success response
    res.json({
      success: true,
      message: 'Synchronization process triggered successfully in background'
    });
  } catch (error) {
    console.error('❌ Error handling sync webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate synchronization' 
    });
  }
});

// Trigger full CMS API synchronization manually (equal to npm run sync-api:force)
router.post('/sync', async (req, res) => {
  try {
    console.log('⚡ Manual sync triggered from front-end. Starting sync...');
    const apiSyncService = require('../services/apiSyncService');
    const result = await apiSyncService.syncAll(true); // force = true (equal to sync-api:force)
    
    res.json({
      success: true,
      message: 'Synchronization completed successfully!',
      result
    });
  } catch (error) {
    console.error('❌ Error handling manual sync:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete synchronization',
      details: error.message 
    });
  }
});

module.exports = router;

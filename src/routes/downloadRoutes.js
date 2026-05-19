const express = require('express');
const fs = require('fs');
const path = require('path');
const documentDownloadService = require('../services/documentDownloadService');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const result = documentDownloadService.getAllDocuments();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error getting documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = documentDownloadService.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    const doc = documentDownloadService.getDocumentById(documentId);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('❌ Error getting document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:documentId/download', (req, res) => {
  try {
    const { documentId } = req.params;
    const filepath = documentDownloadService.getDocumentFilePath(documentId);

    if (!filepath) {
      return res.status(404).json({
        success: false,
        error: 'Document file not found'
      });
    }

    const filename = path.basename(filepath);
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('❌ Error downloading file:', err);
      }
    });
  } catch (error) {
    console.error('❌ Error downloading document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    const result = documentDownloadService.deleteDocument(documentId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

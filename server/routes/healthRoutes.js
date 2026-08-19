import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint
// @access  Public
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    service: 'AuditVault API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;

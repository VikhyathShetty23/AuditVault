import express from 'express';
import { getAuditLogsByMemoId } from '../controllers/auditController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Only GET /api/audit/:memoId is exposed (audit records are immutable and protected)
router.get('/:memoId', protect, getAuditLogsByMemoId);

export default router;

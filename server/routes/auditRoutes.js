import express from 'express';
import { getAuditLogsByMemoId, getAllAuditLogs } from '../controllers/auditController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All audit routes require authentication; audit records are immutable (no POST/PUT/DELETE)
router.get('/', protect, getAllAuditLogs);
router.get('/:memoId', protect, getAuditLogsByMemoId);

export default router;

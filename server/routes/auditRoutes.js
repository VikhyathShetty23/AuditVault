import express from 'express';
import { getAuditLogsByMemoId } from '../controllers/auditController.js';

const router = express.Router();

// Only GET /api/audit/:memoId is exposed (audit records are immutable)
router.get('/:memoId', getAuditLogsByMemoId);

export default router;

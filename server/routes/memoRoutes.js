import express from 'express';
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from '../controllers/memoController.js';
import auditMiddleware from '../middleware/auditMiddleware.js';

const router = express.Router();

router.use(auditMiddleware);

router.route('/')
  .post(createMemo)
  .get(getMemos);

router.route('/:id')
  .get(getMemoById)
  .put(updateMemo)
  .delete(deleteMemo);

export default router;

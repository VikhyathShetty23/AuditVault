import express from 'express';
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from '../controllers/memoController.js';

const router = express.Router();

router.route('/')
  .post(createMemo)
  .get(getMemos);

router.route('/:id')
  .get(getMemoById)
  .put(updateMemo)
  .delete(deleteMemo);

export default router;

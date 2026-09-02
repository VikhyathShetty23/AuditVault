import mongoose from 'mongoose';
import Memo from '../models/Memo.js';

// @route   POST /api/memos
// @desc    Create a new memo
// @access  Public (No auth in this phase)
export const createMemo = async (req, res, next) => {
  try {
    const { title, content, ownerId } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required and cannot be empty' });
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required and cannot be empty' });
    }

    const memo = await Memo.create({
      title: title.trim(),
      content: content.trim(),
      ownerId: ownerId || null,
    });

    res.status(201).json(memo);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/memos
// @desc    Get all memos
// @access  Public (No auth in this phase)
export const getMemos = async (req, res, next) => {
  try {
    const memos = await Memo.find().sort({ createdAt: -1 });
    res.status(200).json(memos);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/memos/:id
// @desc    Get a single memo by ID
// @access  Public (No auth in this phase)
export const getMemoById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid memo ID' });
    }

    const memo = await Memo.findById(id);

    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    res.status(200).json(memo);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/memos/:id
// @desc    Update a memo
// @access  Public (No auth in this phase)
export const updateMemo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid memo ID' });
    }

    if (title === undefined && content === undefined) {
      return res.status(400).json({ message: 'At least title or content must be provided for update' });
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    if (content !== undefined && (typeof content !== 'string' || content.trim() === '')) {
      return res.status(400).json({ message: 'Content cannot be empty' });
    }

    const memo = await Memo.findById(id);

    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    if (title !== undefined) {
      memo.title = title.trim();
    }

    if (content !== undefined) {
      memo.content = content.trim();
    }

    const updatedMemo = await memo.save();

    res.status(200).json(updatedMemo);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/memos/:id
// @desc    Delete a memo
// @access  Public (No auth in this phase)
export const deleteMemo = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid memo ID' });
    }

    const memo = await Memo.findById(id);

    if (!memo) {
      return res.status(404).json({ message: 'Memo not found' });
    }

    await memo.deleteOne();

    res.status(200).json({ message: 'Memo deleted successfully' });
  } catch (error) {
    next(error);
  }
};

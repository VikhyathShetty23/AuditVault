import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

// @route   GET /api/audit/:memoId
// @desc    Get audit trail for a specific memo (newest first)
// @access  Public (No auth in this phase)
export const getAuditLogsByMemoId = async (req, res, next) => {
  try {
    const { memoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memoId)) {
      return res.status(400).json({ message: 'Invalid memo ID' });
    }

    const logs = await AuditLog.find({ memoId }).sort({ timestamp: -1 });

    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

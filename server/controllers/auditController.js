import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import Memo from '../models/Memo.js';

// Helper to check user identity match
const isMatchingUser = (idA, idB) => {
  if (!idA || !idB) return false;
  if (typeof idA.equals === 'function') {
    return idA.equals(idB);
  }
  return idA.toString() === idB.toString();
};

// @route   GET /api/audit/:memoId
// @desc    Get audit trail for a specific memo (newest first, ownership authorized)
// @access  Protected
export const getAuditLogsByMemoId = async (req, res, next) => {
  try {
    const { memoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memoId)) {
      return res.status(400).json({ message: 'Invalid memo ID' });
    }

    const memo = await Memo.findById(memoId);

    // Case 1: Memo exists in the repository
    if (memo) {
      if (!isMatchingUser(memo.ownerId, req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to view audit logs for this memo' });
      }

      const logs = await AuditLog.find({ memoId }).sort({ timestamp: -1 });
      return res.status(200).json(logs);
    }

    // Case 2: Memo has been deleted - audit logs remain immutable and readable by authorized owner
    const logs = await AuditLog.find({ memoId }).sort({ timestamp: -1 });

    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: 'Memo or audit history not found' });
    }

    // Allow user only if that user has associated audit logs for this deleted memo
    const hasAssociatedLog = logs.some((log) => isMatchingUser(log.userId, req.user._id));

    if (!hasAssociatedLog) {
      return res.status(403).json({ message: 'Not authorized to view audit logs for this memo' });
    }

    return res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/audit
// @desc    Get all audit logs belonging to the authenticated user (newest first)
// @access  Protected
export const getAllAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find({ userId: req.user._id }).sort({ timestamp: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

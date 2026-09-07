import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    memoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Memo',
      required: true,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: false,
    bufferCommands: false,
  }
);

// Compound index to optimize audit trail queries ordered newest first
auditLogSchema.index({ memoId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

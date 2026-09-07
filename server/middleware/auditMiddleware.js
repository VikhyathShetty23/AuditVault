import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

/**
 * Determines the audit action type based on the HTTP method and request path/params.
 * Returns null if the request is not an auditable individual memo action (e.g. listing all memos).
 */
export const getActionType = (req) => {
  const method = req.method?.toUpperCase();
  if (method === 'POST') {
    return 'CREATE';
  }
  if (method === 'GET') {
    // Audit READ only for individual memo requests (has :id or non-empty path segment)
    if (req.params?.id || (req.path && req.path !== '/' && req.path !== '')) {
      return 'READ';
    }
    return null;
  }
  if (method === 'PUT') {
    return 'UPDATE';
  }
  if (method === 'DELETE') {
    return 'DELETE';
  }
  return null;
};

/**
 * Resolves the memo ID from the request or response body.
 * For CREATE: extracted from response body.
 * For READ, UPDATE, DELETE: extracted from req.params.id (or body / path fallback).
 */
export const getMemoId = (actionType, req, body) => {
  if (actionType === 'CREATE') {
    return body?._id?.toString() || body?.id?.toString() || null;
  }
  if (req.params?.id) {
    return req.params.id.toString();
  }
  if (body?._id || body?.id) {
    return (body._id || body.id).toString();
  }
  if (req.path && req.path !== '/') {
    const segments = req.path.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[0];
    }
  }
  return null;
};

/**
 * Extracts the requester IP address, respecting proxy headers if present.
 */
export const getClientIp = (req) => {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (ip) return ip;
  }
  return req.ip || req.socket?.remoteAddress || null;
};

/**
 * Extracts authenticated user ID if present, ready for future auth.
 */
export const getUserId = (req) => {
  return req.user?._id || req.user?.id || req.userId || null;
};

/**
 * Express middleware to automatically log successful Memo operations.
 */
const auditMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);
  let isAudited = false;

  res.json = async function (body) {
    if (!isAudited && res.statusCode >= 200 && res.statusCode < 300) {
      isAudited = true;
      try {
        const actionType = getActionType(req);
        if (actionType) {
          const memoId = getMemoId(actionType, req, body);
          if (memoId && mongoose.Types.ObjectId.isValid(memoId)) {
            const ipAddress = getClientIp(req);
            const userId = getUserId(req);

            await AuditLog.create({
              memoId,
              actionType,
              timestamp: new Date(),
              userId,
              ipAddress,
            });
          }
        }
      } catch (error) {
        console.error('Audit logging error:', error.message);
      }
    }

    return originalJson(body);
  };

  next();
};

export default auditMiddleware;

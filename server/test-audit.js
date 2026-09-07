import assert from 'node:assert';
import test from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-auditvault-super-secret-key-12345';

import memoRoutes from './routes/memoRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import Memo from './models/Memo.js';
import User from './models/User.js';
import AuditLog from './models/AuditLog.js';
import {
  getActionType,
  getMemoId,
  getClientIp,
  getUserId,
} from './middleware/auditMiddleware.js';
import { getAuditLogsByMemoId } from './controllers/auditController.js';

const defaultUserId = new mongoose.Types.ObjectId().toString();

// Helper to create mock req, res, next for controller unit testing
const createMockContext = (options = {}) => {
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    ip: options.ip || '127.0.0.1',
    socket: options.socket || { remoteAddress: '127.0.0.1' },
    user: options.user !== undefined ? options.user : { _id: defaultUserId },
  };

  let statusCode = 200;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      jsonResponse = data;
      return this;
    },
    getStatusCode() {
      return statusCode;
    },
    getJSON() {
      return jsonResponse;
    },
  };

  let errorPassed = null;
  const next = (err) => {
    errorPassed = err;
  };

  return { req, res, next, getError: () => errorPassed };
};

test('Audit Middleware Unit Tests', async (t) => {
  await t.test('1. getActionType returns correct action for methods and paths', () => {
    assert.strictEqual(getActionType({ method: 'POST', path: '/' }), 'CREATE');
    assert.strictEqual(getActionType({ method: 'GET', path: '/65f123', params: { id: '65f123' } }), 'READ');
    assert.strictEqual(getActionType({ method: 'GET', path: '/', params: {} }), null);
    assert.strictEqual(getActionType({ method: 'PUT', path: '/65f123', params: { id: '65f123' } }), 'UPDATE');
    assert.strictEqual(getActionType({ method: 'DELETE', path: '/65f123', params: { id: '65f123' } }), 'DELETE');
    assert.strictEqual(getActionType({ method: 'PATCH', path: '/65f123' }), null);
  });

  await t.test('2. getClientIp correctly extracts IP from headers or socket', () => {
    const fromForwarded = getClientIp({
      headers: { 'x-forwarded-for': '203.0.113.195, 70.41.3.18' },
    });
    assert.strictEqual(fromForwarded, '203.0.113.195');

    const fromReqIp = getClientIp({
      headers: {},
      ip: '198.51.100.1',
    });
    assert.strictEqual(fromReqIp, '198.51.100.1');

    const fromSocket = getClientIp({
      headers: {},
      socket: { remoteAddress: '192.0.2.1' },
    });
    assert.strictEqual(fromSocket, '192.0.2.1');
  });

  await t.test('3. getUserId extracts user ID without inventing user if null', () => {
    assert.strictEqual(getUserId({ user: null }), null);
    assert.strictEqual(getUserId({}), null);

    const userWithUnderscoreId = { user: { _id: 'user_123' } };
    assert.strictEqual(getUserId(userWithUnderscoreId), 'user_123');

    const userWithId = { user: { id: 'user_456' } };
    assert.strictEqual(getUserId(userWithId), 'user_456');

    const reqUserId = { userId: 'user_789' };
    assert.strictEqual(getUserId(reqUserId), 'user_789');
  });

  await t.test('4. getMemoId extracts ID for CREATE vs other operations', () => {
    const createBody = { _id: 'memo_abc', title: 'Test' };
    assert.strictEqual(getMemoId('CREATE', {}, createBody), 'memo_abc');

    const readReq = { params: { id: 'memo_xyz' } };
    assert.strictEqual(getMemoId('READ', readReq, {}), 'memo_xyz');

    const updateReq = { params: { id: 'memo_upd' } };
    assert.strictEqual(getMemoId('UPDATE', updateReq, {}), 'memo_upd');

    const deleteReq = { params: { id: 'memo_del' } };
    assert.strictEqual(getMemoId('DELETE', deleteReq, {}), 'memo_del');
  });
});

test('Audit Controller Unit Tests', async (t) => {
  const validMemoId = new mongoose.Types.ObjectId().toString();
  const invalidMemoId = 'invalid-id-format';

  await t.test('1. GET /api/audit/:memoId returns 400 for invalid memo ID', async () => {
    const { req, res, next } = createMockContext({
      params: { memoId: invalidMemoId },
    });

    await getAuditLogsByMemoId(req, res, next);

    assert.strictEqual(res.getStatusCode(), 400);
    assert.deepStrictEqual(res.getJSON(), { message: 'Invalid memo ID' });
  });

  await t.test('2. GET /api/audit/:memoId returns sorted audit logs newest first for authorized owner', async () => {
    const mockLogs = [
      { _id: 'log2', memoId: validMemoId, actionType: 'READ', timestamp: new Date(2000), userId: defaultUserId },
      { _id: 'log1', memoId: validMemoId, actionType: 'CREATE', timestamp: new Date(1000), userId: defaultUserId },
    ];

    const originalMemoFindById = Memo.findById;
    const originalFind = AuditLog.find;

    Memo.findById = async () => ({
      _id: validMemoId,
      ownerId: defaultUserId,
    });

    AuditLog.find = (query) => ({
      sort: (sortSpec) => {
        assert.deepStrictEqual(query, { memoId: validMemoId });
        assert.deepStrictEqual(sortSpec, { timestamp: -1 });
        return Promise.resolve(mockLogs);
      },
    });

    try {
      const { req, res, next } = createMockContext({
        params: { memoId: validMemoId },
      });

      await getAuditLogsByMemoId(req, res, next);

      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getJSON().length, 2);
      assert.strictEqual(res.getJSON()[0].actionType, 'READ');
      assert.strictEqual(res.getJSON()[1].actionType, 'CREATE');
    } finally {
      Memo.findById = originalMemoFindById;
      AuditLog.find = originalFind;
    }
  });

  await t.test('3. GET /api/audit/:memoId passes unexpected error to next()', async () => {
    const originalMemoFindById = Memo.findById;
    const dbError = new Error('Database disconnected');
    Memo.findById = async () => {
      throw dbError;
    };

    try {
      const { req, res, next, getError } = createMockContext({
        params: { memoId: validMemoId },
      });

      await getAuditLogsByMemoId(req, res, next);

      assert.strictEqual(getError(), dbError);
    } finally {
      Memo.findById = originalMemoFindById;
    }
  });
});

test('Audit Logging End-to-End Integration Tests', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/memos', memoRoutes);
  app.use('/api/audit', auditRoutes);

  const testUser = {
    _id: defaultUserId,
    name: 'Audit Tester',
    email: 'tester@auditvault.io',
    role: 'user',
  };
  const testToken = jwt.sign({ id: defaultUserId }, process.env.JWT_SECRET);

  // In-memory data stores
  const memoStore = new Map();
  const auditStore = [];

  const originalMemoCreate = Memo.create;
  const originalMemoFind = Memo.find;
  const originalMemoFindById = Memo.findById;
  const originalAuditCreate = AuditLog.create;
  const originalAuditFind = AuditLog.find;
  const originalUserFindById = User.findById;

  User.findById = (id) => ({
    select: () => Promise.resolve(testUser),
  });

  // Mock Memo model methods
  Memo.create = async (data) => {
    const id = new mongoose.Types.ObjectId().toString();
    const memo = {
      _id: id,
      title: data.title,
      content: data.content,
      ownerId: data.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoStore.set(id, memo);
    return memo;
  };

  Memo.find = (filter = {}) => ({
    sort: () => {
      let results = Array.from(memoStore.values());
      if (filter.ownerId) {
        results = results.filter((m) => m.ownerId.toString() === filter.ownerId.toString());
      }
      return Promise.resolve(results);
    },
  });

  Memo.findById = async (id) => {
    const memo = memoStore.get(id);
    if (!memo) return null;
    return {
      ...memo,
      save: async function () {
        const updated = {
          ...memo,
          title: this.title,
          content: this.content,
          updatedAt: new Date().toISOString(),
        };
        memoStore.set(id, updated);
        return updated;
      },
      deleteOne: async function () {
        memoStore.delete(id);
      },
    };
  };

  // Mock AuditLog model methods
  AuditLog.create = async (data) => {
    const log = {
      _id: new mongoose.Types.ObjectId().toString(),
      memoId: data.memoId.toString(),
      actionType: data.actionType,
      timestamp: data.timestamp || new Date(),
      userId: data.userId || null,
      ipAddress: data.ipAddress || null,
    };
    auditStore.push(log);
    return log;
  };

  AuditLog.find = (filter = {}) => ({
    sort: (sortSpec = {}) => {
      let results = auditStore.filter((log) => {
        if (filter.memoId) {
          return log.memoId.toString() === filter.memoId.toString();
        }
        return true;
      });
      if (sortSpec.timestamp === -1) {
        results = [...results].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      return Promise.resolve(results);
    },
  });

  const server = app.listen(0);
  const port = server.address().port;
  const memoBaseUrl = `http://127.0.0.1:${port}/api/memos`;
  const auditBaseUrl = `http://127.0.0.1:${port}/api/audit`;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${testToken}`,
  };

  try {
    let createdMemoId;

    // A. CREATE memo -> exactly one CREATE audit record
    await t.test('A. CREATE memo creates exactly one CREATE audit record with user ID', async () => {
      const res = await fetch(memoBaseUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Top Secret Plan',
          content: 'Confidential strategy details.',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.ok(data._id);
      createdMemoId = data._id;

      // Verify audit record via GET /api/audit/:memoId
      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditLogs = await auditRes.json();
      assert.strictEqual(auditLogs.length, 1);
      assert.strictEqual(auditLogs[0].actionType, 'CREATE');
      assert.strictEqual(auditLogs[0].memoId, createdMemoId);
      assert.strictEqual(auditLogs[0].userId.toString(), defaultUserId);
      assert.ok(auditLogs[0].ipAddress);
    });

    // B. READ a specific memo -> exactly one READ audit record
    await t.test('B. READ a specific memo appends exactly one READ audit record', async () => {
      const res = await fetch(`${memoBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(res.status, 200);
      const memo = await res.json();
      assert.strictEqual(memo._id, createdMemoId);

      // Verify audit logs: now length 2 (newest first: READ, CREATE)
      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditLogs = await auditRes.json();
      assert.strictEqual(auditLogs.length, 2);
      assert.strictEqual(auditLogs[0].actionType, 'READ');
      assert.strictEqual(auditLogs[1].actionType, 'CREATE');
    });

    // C. UPDATE memo -> exactly one UPDATE audit record
    await t.test('C. UPDATE memo appends exactly one UPDATE audit record', async () => {
      const res = await fetch(`${memoBaseUrl}/${createdMemoId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Updated Plan Title',
        }),
      });
      assert.strictEqual(res.status, 200);

      // Verify audit logs: now length 3 (newest first: UPDATE, READ, CREATE)
      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditLogs = await auditRes.json();
      assert.strictEqual(auditLogs.length, 3);
      assert.strictEqual(auditLogs[0].actionType, 'UPDATE');
      assert.strictEqual(auditLogs[1].actionType, 'READ');
      assert.strictEqual(auditLogs[2].actionType, 'CREATE');
    });

    // D. DELETE memo -> exactly one DELETE audit record
    await t.test('D. DELETE memo appends exactly one DELETE audit record', async () => {
      const res = await fetch(`${memoBaseUrl}/${createdMemoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(res.status, 200);

      // Verify memo is deleted from memos collection
      const getDeletedRes = await fetch(`${memoBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(getDeletedRes.status, 404);

      // Verify audit logs: now length 4 (newest first: DELETE, UPDATE, READ, CREATE)
      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditLogs = await auditRes.json();
      assert.strictEqual(auditLogs.length, 4);
      assert.strictEqual(auditLogs[0].actionType, 'DELETE');
      assert.strictEqual(auditLogs[1].actionType, 'UPDATE');
      assert.strictEqual(auditLogs[2].actionType, 'READ');
      assert.strictEqual(auditLogs[3].actionType, 'CREATE');
    });

    // E. GET /api/audit/:memoId returns records sorted newest first
    await t.test('E. GET /api/audit/:memoId returns records sorted newest first', async () => {
      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditLogs = await auditRes.json();
      assert.strictEqual(auditLogs.length, 4);

      // Timestamps must be descending
      for (let i = 0; i < auditLogs.length - 1; i++) {
        const current = new Date(auditLogs[i].timestamp).getTime();
        const next = new Date(auditLogs[i + 1].timestamp).getTime();
        assert.ok(current >= next, `Timestamp at index ${i} (${current}) should be >= index ${i + 1} (${next})`);
      }
    });

    // F. GET /api/memos (list all) does NOT generate audit log
    await t.test('F. GET /api/memos (listing memos) does not generate audit logs', async () => {
      const initialLogCount = auditStore.length;
      const res = await fetch(memoBaseUrl, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(auditStore.length, initialLogCount);
    });

    // G. Failed memo operations do NOT generate audit logs
    await t.test('G. Failed memo operations do not generate audit logs', async () => {
      const initialLogCount = auditStore.length;

      // 1. Failed CREATE (missing content) -> 400
      const failedCreateRes = await fetch(memoBaseUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ title: 'No content' }),
      });
      assert.strictEqual(failedCreateRes.status, 400);

      // 2. Failed READ (non-existent ID) -> 404
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const failedReadRes = await fetch(`${memoBaseUrl}/${nonExistentId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(failedReadRes.status, 404);

      // 3. Failed UPDATE (empty title) -> 400
      const failedUpdateRes = await fetch(`${memoBaseUrl}/${nonExistentId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ title: '   ' }),
      });
      assert.strictEqual(failedUpdateRes.status, 400);

      // 4. Failed DELETE (invalid ID format) -> 400
      const failedDeleteRes = await fetch(`${memoBaseUrl}/invalid-id`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(failedDeleteRes.status, 400);

      // Total logs in store must not have increased
      assert.strictEqual(auditStore.length, initialLogCount);
    });

    // H. GET /api/audit/:memoId with invalid ID returns 400
    await t.test('H. GET /api/audit/:memoId returns 400 for invalid memo ID', async () => {
      const res = await fetch(`${auditBaseUrl}/invalid-id`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.message, 'Invalid memo ID');
    });

    // I. DELETE leaves the DELETE audit record available after the Memo is removed
    await t.test('I. DELETE audit record remains queryable after Memo is removed', async () => {
      const memoCheck = await fetch(`${memoBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(memoCheck.status, 404);

      const auditRes = await fetch(`${auditBaseUrl}/${createdMemoId}`, {
        headers: { Authorization: `Bearer ${testToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const logs = await auditRes.json();
      assert.strictEqual(logs.length, 4);
      assert.strictEqual(logs[0].actionType, 'DELETE');
    });
  } finally {
    server.close();
    User.findById = originalUserFindById;
    Memo.create = originalMemoCreate;
    Memo.find = originalMemoFind;
    Memo.findById = originalMemoFindById;
    AuditLog.create = originalAuditCreate;
    AuditLog.find = originalAuditFind;
  }
});

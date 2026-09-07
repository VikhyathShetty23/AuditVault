import assert from 'node:assert';
import test from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Set test JWT secret
process.env.JWT_SECRET = 'test-auditvault-super-secret-key-12345';

import User from './models/User.js';
import Memo from './models/Memo.js';
import AuditLog from './models/AuditLog.js';
import authRoutes from './routes/authRoutes.js';
import memoRoutes from './routes/memoRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

test('Authentication and Authorization Test Suite', async (t) => {
  const userAId = new mongoose.Types.ObjectId().toString();
  const userBId = new mongoose.Types.ObjectId().toString();

  const userA = {
    _id: userAId,
    name: 'Alice Auditor',
    email: 'alice@auditvault.io',
    role: 'user',
    createdAt: new Date(),
  };

  const userB = {
    _id: userBId,
    name: 'Bob Attacker',
    email: 'bob@auditvault.io',
    role: 'user',
    createdAt: new Date(),
  };

  const tokenA = jwt.sign({ id: userAId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: userBId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // In-memory data stores
  const usersByEmail = new Map();
  const usersById = new Map();
  const memoStore = new Map();
  const auditStore = [];

  // Seed mocked DB with userA and userB
  usersById.set(userAId, userA);
  usersById.set(userBId, userB);

  // Setup Express test app with auth, memo, and audit routes
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/memos', memoRoutes);
  app.use('/api/audit', auditRoutes);

  // Mock User model methods
  const originalUserCreate = User.create;
  const originalUserFindOne = User.findOne;
  const originalUserFindById = User.findById;

  User.create = async (data) => {
    const id = new mongoose.Types.ObjectId().toString();
    const newUser = {
      _id: id,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role || 'user',
      createdAt: new Date(),
    };
    usersByEmail.set(data.email, newUser);
    usersById.set(id, newUser);
    return newUser;
  };

  User.findOne = (query) => {
    let selectFields = '';
    return {
      select(fields) {
        selectFields = fields;
        return this;
      },
      then(resolve) {
        const user = usersByEmail.get(query.email);
        if (!user) return resolve(null);
        if (selectFields.includes('+passwordHash')) {
          return resolve(user);
        }
        const { passwordHash, ...safeUser } = user;
        return resolve(safeUser);
      },
    };
  };

  User.findById = (id) => {
    return {
      select(fields) {
        return this;
      },
      then(resolve) {
        const user = usersById.get(id?.toString());
        if (!user) return resolve(null);
        const { passwordHash, ...safeUser } = user;
        return resolve(safeUser);
      },
    };
  };

  // Mock Memo model methods
  const originalMemoCreate = Memo.create;
  const originalMemoFind = Memo.find;
  const originalMemoFindById = Memo.findById;

  Memo.create = async (data) => {
    const id = new mongoose.Types.ObjectId().toString();
    const newMemo = {
      _id: id,
      title: data.title,
      content: data.content,
      ownerId: data.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoStore.set(id, newMemo);
    return newMemo;
  };

  Memo.find = (filter = {}) => ({
    sort: () => {
      let results = Array.from(memoStore.values());
      if (filter.ownerId) {
        results = results.filter((m) => m.ownerId?.toString() === filter.ownerId.toString());
      }
      return Promise.resolve(results);
    },
  });

  Memo.findById = async (id) => {
    const memo = memoStore.get(id?.toString());
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
        memoStore.set(id.toString(), updated);
        return updated;
      },
      deleteOne: async function () {
        memoStore.delete(id.toString());
      },
    };
  };

  // Mock AuditLog model methods
  const originalAuditCreate = AuditLog.create;
  const originalAuditFind = AuditLog.find;

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
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    let createdMemoIdA;

    // 1. Successful registration returns token and no password hash
    await t.test('1. Successful registration returns token and safe user (no passwordHash)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Carol Compliance',
          email: 'carol@auditvault.io',
          password: 'superSecretPassword123',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.ok(data.token);
      assert.ok(data.user);
      assert.strictEqual(data.user.email, 'carol@auditvault.io');
      assert.strictEqual(data.user.name, 'Carol Compliance');
      assert.strictEqual(data.user.passwordHash, undefined);
      assert.strictEqual(data.user.password, undefined);
    });

    // 2. Duplicate registration is rejected (409)
    await t.test('2. Duplicate registration returns 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Carol Duplicate',
          email: 'carol@auditvault.io',
          password: 'anotherPassword123',
        }),
      });

      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.match(data.message, /already exists/i);
    });

    // 3. Valid login returns token and safe user
    await t.test('3. Valid login returns token and safe user', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carol@auditvault.io',
          password: 'superSecretPassword123',
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.strictEqual(data.user.email, 'carol@auditvault.io');
      assert.strictEqual(data.user.passwordHash, undefined);
    });

    // 4. Invalid login is rejected (401)
    await t.test('4. Invalid login returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'carol@auditvault.io',
          password: 'wrongPassword',
        }),
      });

      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.match(data.message, /invalid/i);
    });

    // 5. Protected memo route with no token returns 401
    await t.test('5. Protected memo route with no token returns 401', async () => {
      const res = await fetch(`${baseUrl}/memos`, {
        method: 'GET',
      });
      assert.strictEqual(res.status, 401);
    });

    // 6. Protected memo route with invalid token returns 401
    await t.test('6. Protected memo route with invalid token returns 401', async () => {
      const res = await fetch(`${baseUrl}/memos`, {
        method: 'GET',
        headers: { Authorization: 'Bearer invalid-token-xyz' },
      });
      assert.strictEqual(res.status, 401);
    });

    // 7. User A creates a memo: owner is User A even if request supplies User B's ownerId
    await t.test('7. User A creates a memo and ownerId is strictly derived from req.user', async () => {
      const res = await fetch(`${baseUrl}/memos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({
          title: "User A's Confidential Memo",
          content: 'Secret content for User A only.',
          ownerId: userBId, // Malicious attempt to assign ownership to User B
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.ownerId.toString(), userAId.toString());
      assert.notStrictEqual(data.ownerId.toString(), userBId.toString());
      createdMemoIdA = data._id;

      // Verify audit record was created with user A's ID
      const lastAudit = auditStore[auditStore.length - 1];
      assert.strictEqual(lastAudit.actionType, 'CREATE');
      assert.strictEqual(lastAudit.memoId.toString(), createdMemoIdA.toString());
      assert.strictEqual(lastAudit.userId.toString(), userAId.toString());
    });

    // 8. User B cannot read User A's memo by changing memo ID (403)
    await t.test("8. User B cannot read User A's memo (returns 403 Forbidden)", async () => {
      const initialAuditCount = auditStore.length;
      const res = await fetch(`${baseUrl}/memos/${createdMemoIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });

      assert.strictEqual(res.status, 403);
      // No READ audit record should be created for unauthorized 403
      assert.strictEqual(auditStore.length, initialAuditCount);
    });

    // 9. User B cannot update User A's memo (403), and no UPDATE audit record is added
    await t.test("9. User B cannot update User A's memo (403 and no audit record)", async () => {
      const initialAuditCount = auditStore.length;
      const res = await fetch(`${baseUrl}/memos/${createdMemoIdA}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ title: 'Tampered Title' }),
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(auditStore.length, initialAuditCount);
      // Verify memo content remained unchanged
      assert.strictEqual(memoStore.get(createdMemoIdA).title, "User A's Confidential Memo");
    });

    // 10. User B cannot delete User A's memo (403)
    await t.test("10. User B cannot delete User A's memo (403)", async () => {
      const initialAuditCount = auditStore.length;
      const res = await fetch(`${baseUrl}/memos/${createdMemoIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenB}` },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(auditStore.length, initialAuditCount);
      assert.ok(memoStore.has(createdMemoIdA));
    });

    // 11. Memo listing returns only the authenticated user's memos
    await t.test('11. Memo listing returns only the authenticated user memos', async () => {
      // Create a memo for User B
      await fetch(`${baseUrl}/memos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({
          title: "User B's Memo",
          content: 'Content belonging to User B.',
        }),
      });

      // User A lists memos -> only user A's memo returned
      const resA = await fetch(`${baseUrl}/memos`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(resA.status, 200);
      const memosA = await resA.json();
      assert.strictEqual(memosA.length, 1);
      assert.strictEqual(memosA[0]._id.toString(), createdMemoIdA.toString());

      // User B lists memos -> only user B's memo returned
      const resB = await fetch(`${baseUrl}/memos`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(resB.status, 200);
      const memosB = await resB.json();
      assert.strictEqual(memosB.length, 1);
      assert.notStrictEqual(memosB[0]._id.toString(), createdMemoIdA.toString());
    });

    // 12. User B cannot view User A's audit trail (403)
    await t.test("12. User B cannot view User A's audit trail (403 Forbidden)", async () => {
      const res = await fetch(`${baseUrl}/audit/${createdMemoIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 13. User A can view their own audit trail
    await t.test("13. User A can view their own audit trail (200 OK)", async () => {
      const res = await fetch(`${baseUrl}/audit/${createdMemoIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 200);
      const logs = await res.json();
      assert.ok(logs.length >= 1);
      assert.strictEqual(logs[0].memoId.toString(), createdMemoIdA.toString());
    });

    // 14. User A deletes their memo, and can still view their audit trail after deletion
    await t.test('14. User A deletes memo and can still view audit trail; User B is forbidden', async () => {
      // User A deletes memo
      const deleteRes = await fetch(`${baseUrl}/memos/${createdMemoIdA}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(deleteRes.status, 200);
      assert.strictEqual(memoStore.has(createdMemoIdA), false);

      // User A checks audit trail of deleted memo -> 200 OK
      const auditResA = await fetch(`${baseUrl}/audit/${createdMemoIdA}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(auditResA.status, 200);
      const logsA = await auditResA.json();
      assert.ok(logsA.length >= 2); // CREATE and DELETE
      assert.strictEqual(logsA[0].actionType, 'DELETE');

      // User B tries to check audit trail of User A's deleted memo -> 403 Forbidden
      const auditResB = await fetch(`${baseUrl}/audit/${createdMemoIdA}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      assert.strictEqual(auditResB.status, 403);
    });

    // 15. Audit trail for nonexistent memo with no history returns 404
    await t.test('15. Audit trail for nonexistent memo with no history returns 404', async () => {
      const randomId = new mongoose.Types.ObjectId().toString();
      const res = await fetch(`${baseUrl}/audit/${randomId}`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.strictEqual(res.status, 404);
    });
  } finally {
    server.close();
    User.create = originalUserCreate;
    User.findOne = originalUserFindOne;
    User.findById = originalUserFindById;
    Memo.create = originalMemoCreate;
    Memo.find = originalMemoFind;
    Memo.findById = originalMemoFindById;
    AuditLog.create = originalAuditCreate;
    AuditLog.find = originalAuditFind;
  }
});

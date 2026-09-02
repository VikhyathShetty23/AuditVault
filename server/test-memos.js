import assert from 'node:assert';
import test from 'node:test';
import mongoose from 'mongoose';
import express from 'express';
import memoRoutes from './routes/memoRoutes.js';
import Memo from './models/Memo.js';
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
} from './controllers/memoController.js';

// Helper to create mock req, res, next
const createMockContext = (options = {}) => {
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
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

test('Memo API Unit Tests', async (t) => {
  const validObjectId = new mongoose.Types.ObjectId().toString();
  const invalidObjectId = 'not-a-valid-object-id';

  await t.test('1. POST with valid title/content returns 201 and created memo', async () => {
    const originalCreate = Memo.create;
    Memo.create = async (data) => ({
      _id: new mongoose.Types.ObjectId(),
      title: data.title,
      content: data.content,
      ownerId: data.ownerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const { req, res, next } = createMockContext({
        body: {
          title: '  Security Review  ',
          content: '  Confidential review information.  ',
        },
      });

      await createMemo(req, res, next);

      assert.strictEqual(res.getStatusCode(), 201);
      const data = res.getJSON();
      assert.strictEqual(data.title, 'Security Review');
      assert.strictEqual(data.content, 'Confidential review information.');
      assert.strictEqual(data.ownerId, null);
    } finally {
      Memo.create = originalCreate;
    }
  });

  await t.test('2. POST with missing title returns 400', async () => {
    const { req, res, next } = createMockContext({
      body: { content: 'Valid content here' },
    });

    await createMemo(req, res, next);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /title/i);
  });

  await t.test('3. POST with missing content returns 400', async () => {
    const { req, res, next } = createMockContext({
      body: { title: 'Valid title here' },
    });

    await createMemo(req, res, next);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /content/i);
  });

  await t.test('4. POST with empty/whitespace title returns 400', async () => {
    const { req, res, next } = createMockContext({
      body: { title: '   ', content: 'Valid content here' },
    });

    await createMemo(req, res, next);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /title/i);
  });

  await t.test('5. POST with empty/whitespace content returns 400', async () => {
    const { req, res, next } = createMockContext({
      body: { title: 'Valid title here', content: '   ' },
    });

    await createMemo(req, res, next);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /content/i);
  });

  await t.test('6. GET all memos returns 200 and list', async () => {
    const originalFind = Memo.find;
    const mockMemos = [
      { _id: new mongoose.Types.ObjectId(), title: 'Memo 1', content: 'Content 1' },
      { _id: new mongoose.Types.ObjectId(), title: 'Memo 2', content: 'Content 2' },
    ];
    Memo.find = () => ({
      sort: () => Promise.resolve(mockMemos),
    });

    try {
      const { req, res, next } = createMockContext();
      await getMemos(req, res, next);

      assert.strictEqual(res.getStatusCode(), 200);
      assert.deepStrictEqual(res.getJSON(), mockMemos);
    } finally {
      Memo.find = originalFind;
    }
  });

  await t.test('7. GET an existing memo returns 200 and memo object', async () => {
    const originalFindById = Memo.findById;
    const mockMemo = {
      _id: validObjectId,
      title: 'Existing Memo',
      content: 'Existing Content',
    };
    Memo.findById = async (id) => (id === validObjectId ? mockMemo : null);

    try {
      const { req, res, next } = createMockContext({ params: { id: validObjectId } });
      await getMemoById(req, res, next);

      assert.strictEqual(res.getStatusCode(), 200);
      assert.deepStrictEqual(res.getJSON(), mockMemo);
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('8. GET a nonexistent memo returns 404', async () => {
    const originalFindById = Memo.findById;
    Memo.findById = async () => null;

    try {
      const { req, res, next } = createMockContext({ params: { id: validObjectId } });
      await getMemoById(req, res, next);

      assert.strictEqual(res.getStatusCode(), 404);
      assert.match(res.getJSON().message, /not found/i);
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('9. GET with an invalid ObjectId returns 400', async () => {
    const { req, res, next } = createMockContext({ params: { id: invalidObjectId } });
    await getMemoById(req, res, next);

    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /invalid memo id/i);
  });

  await t.test('10. PUT an existing memo updates and returns 200', async () => {
    const originalFindById = Memo.findById;
    const mockMemoInstance = {
      _id: validObjectId,
      title: 'Old Title',
      content: 'Old Content',
      save: async function () {
        return this;
      },
    };
    Memo.findById = async (id) => (id === validObjectId ? mockMemoInstance : null);

    try {
      const { req, res, next } = createMockContext({
        params: { id: validObjectId },
        body: { title: 'Updated Title', content: 'Updated Content' },
      });

      await updateMemo(req, res, next);

      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(res.getJSON().title, 'Updated Title');
      assert.strictEqual(res.getJSON().content, 'Updated Content');
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('11. PUT with invalid input returns 400', async () => {
    // 11a: Neither title nor content supplied
    const { req: req1, res: res1, next: next1 } = createMockContext({
      params: { id: validObjectId },
      body: {},
    });
    await updateMemo(req1, res1, next1);
    assert.strictEqual(res1.getStatusCode(), 400);
    assert.match(res1.getJSON().message, /at least title or content/i);

    // 11b: Empty / whitespace title supplied
    const { req: req2, res: res2, next: next2 } = createMockContext({
      params: { id: validObjectId },
      body: { title: '   ' },
    });
    await updateMemo(req2, res2, next2);
    assert.strictEqual(res2.getStatusCode(), 400);
    assert.match(res2.getJSON().message, /title/i);

    // 11c: Empty / whitespace content supplied
    const { req: req3, res: res3, next: next3 } = createMockContext({
      params: { id: validObjectId },
      body: { content: '   ' },
    });
    await updateMemo(req3, res3, next3);
    assert.strictEqual(res3.getStatusCode(), 400);
    assert.match(res3.getJSON().message, /content/i);

    // 11d: Invalid ObjectId
    const { req: req4, res: res4, next: next4 } = createMockContext({
      params: { id: invalidObjectId },
      body: { title: 'New Title' },
    });
    await updateMemo(req4, res4, next4);
    assert.strictEqual(res4.getStatusCode(), 400);
    assert.match(res4.getJSON().message, /invalid memo id/i);
  });

  await t.test('12. PUT a nonexistent memo returns 404', async () => {
    const originalFindById = Memo.findById;
    Memo.findById = async () => null;

    try {
      const { req, res, next } = createMockContext({
        params: { id: validObjectId },
        body: { title: 'New Title' },
      });
      await updateMemo(req, res, next);

      assert.strictEqual(res.getStatusCode(), 404);
      assert.match(res.getJSON().message, /not found/i);
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('13. DELETE an existing memo returns 200 and success message', async () => {
    const originalFindById = Memo.findById;
    let deleted = false;
    const mockMemoInstance = {
      _id: validObjectId,
      deleteOne: async () => {
        deleted = true;
      },
    };
    Memo.findById = async (id) => (id === validObjectId ? mockMemoInstance : null);

    try {
      const { req, res, next } = createMockContext({ params: { id: validObjectId } });
      await deleteMemo(req, res, next);

      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(deleted, true);
      assert.strictEqual(res.getJSON().message, 'Memo deleted successfully');
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('14. DELETE a nonexistent memo returns 404', async () => {
    const originalFindById = Memo.findById;
    Memo.findById = async () => null;

    try {
      const { req, res, next } = createMockContext({ params: { id: validObjectId } });
      await deleteMemo(req, res, next);

      assert.strictEqual(res.getStatusCode(), 404);
      assert.match(res.getJSON().message, /not found/i);
    } finally {
      Memo.findById = originalFindById;
    }
  });

  await t.test('15. DELETE with an invalid ObjectId returns 400', async () => {
    const { req, res, next } = createMockContext({ params: { id: invalidObjectId } });
    await deleteMemo(req, res, next);

    assert.strictEqual(res.getStatusCode(), 400);
    assert.match(res.getJSON().message, /invalid memo id/i);
  });
});

test('Memo Router Integration Tests (Express End-to-End)', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/memos', memoRoutes);

  // In-memory store for integration routing tests
  const store = new Map();
  const originalCreate = Memo.create;
  const originalFind = Memo.find;
  const originalFindById = Memo.findById;

  Memo.create = async (data) => {
    const id = new mongoose.Types.ObjectId().toString();
    const memo = {
      _id: id,
      title: data.title,
      content: data.content,
      ownerId: data.ownerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.set(id, memo);
    return memo;
  };

  Memo.find = () => ({
    sort: () => Promise.resolve(Array.from(store.values())),
  });

  Memo.findById = async (id) => {
    const memo = store.get(id);
    if (!memo) return null;
    return {
      ...memo,
      save: async function () {
        store.set(id, { ...memo, title: this.title, content: this.content, updatedAt: new Date().toISOString() });
        return store.get(id);
      },
      deleteOne: async function () {
        store.delete(id);
      },
    };
  };

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/memos`;

  try {
    let createdId;

    await t.test('HTTP POST /api/memos -> 201', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Security Review',
          content: 'Confidential review information.',
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.title, 'Security Review');
      assert.strictEqual(data.content, 'Confidential review information.');
      assert.ok(data._id);
      createdId = data._id;
    });

    await t.test('HTTP GET /api/memos -> 200', async () => {
      const res = await fetch(baseUrl);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 1);
    });

    await t.test('HTTP GET /api/memos/:id -> 200', async () => {
      const res = await fetch(`${baseUrl}/${createdId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data._id, createdId);
      assert.strictEqual(data.title, 'Security Review');
    });

    await t.test('HTTP PUT /api/memos/:id -> 200', async () => {
      const res = await fetch(`${baseUrl}/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Security Review',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.title, 'Updated Security Review');
    });

    await t.test('HTTP DELETE /api/memos/:id -> 200', async () => {
      const res = await fetch(`${baseUrl}/${createdId}`, {
        method: 'DELETE',
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.message, 'Memo deleted successfully');
    });

    await t.test('HTTP GET /api/memos/:id after deletion -> 404', async () => {
      const res = await fetch(`${baseUrl}/${createdId}`);
      assert.strictEqual(res.status, 404);
    });
  } finally {
    server.close();
    Memo.create = originalCreate;
    Memo.find = originalFind;
    Memo.findById = originalFindById;
  }
});

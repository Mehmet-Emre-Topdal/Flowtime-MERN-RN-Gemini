import request from 'supertest';
import express from 'express';

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('../../config/firebase', () => ({
    adminDb: { collection: jest.fn(), batch: jest.fn() },
    adminAuth: { verifyIdToken: jest.fn() },
}));
jest.mock('../../middleware/auth', () => ({
    authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        req.userId = 'test-user-id';
        next();
    },
}));
jest.mock('firebase-admin/firestore', () => ({
    FieldValue: {
        serverTimestamp: jest.fn(() => 'TIMESTAMP'),
        increment: jest.fn((n: number) => ({ _increment: n })),
    },
    Timestamp: jest.fn(),
}));

import { adminDb } from '../../config/firebase';
import tasksRouter from '../../routes/tasks';
import { todayStr } from '../../utils/dateHelpers';

// ─── App setup ────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRouter);

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeDocSnap(data: Record<string, unknown> | null) {
    return {
        exists: data !== null,
        data: () => data,
        ref: {
            update: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
        },
    };
}

function makeQuerySnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
    return {
        docs: docs.map(d => ({
            id: d.id,
            data: () => d.data,
            ref: { update: jest.fn() },
        })),
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
    it('returns tasks list', async () => {
        const snap = makeQuerySnap([
            { id: 'task-1', data: { userId: 'test-user-id', title: 'Task One', description: '', status: 'todo', totalFocusedTime: 0, order: 0, isArchived: false, isDaily: false, lastResetDate: '', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', completedAt: null } },
        ]);

        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(snap),
        });

        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(200);
        expect(res.body.tasks).toHaveLength(1);
        expect(res.body.tasks[0].title).toBe('Task One');
    });

    it('filters out archived tasks', async () => {
        const snap = makeQuerySnap([
            { id: 't1', data: { userId: 'test-user-id', title: 'Active', isArchived: false, status: 'todo', totalFocusedTime: 0, order: 0, isDaily: false, lastResetDate: '', createdAt: '', updatedAt: '', completedAt: null, description: '' } },
            { id: 't2', data: { userId: 'test-user-id', title: 'Archived', isArchived: true, status: 'todo', totalFocusedTime: 0, order: 1, isDaily: false, lastResetDate: '', createdAt: '', updatedAt: '', completedAt: null, description: '' } },
        ]);

        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(snap),
        });

        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(200);
        expect(res.body.tasks).toHaveLength(1);
        expect(res.body.tasks[0].title).toBe('Active');
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockRejectedValue(new Error('Firestore error')),
        });

        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(500);
    });
});

describe('POST /api/tasks', () => {
    it('creates a task and returns 201', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            add: jest.fn().mockResolvedValue({ id: 'new-task-id' }),
        });

        const res = await request(app)
            .post('/api/tasks')
            .send({ task: { title: 'New Task', status: 'todo', isDaily: false }, order: 0 });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe('new-task-id');
    });

    it('returns 400 when title is missing', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .send({ task: { status: 'todo' }, order: 0 });
        expect(res.status).toBe(400);
    });
});

describe('PUT /api/tasks/:id', () => {
    it('updates a task and returns 200', async () => {
        const docSnap = makeDocSnap({ userId: 'test-user-id', title: 'Old' });
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
                update: jest.fn().mockResolvedValue(undefined),
            }),
        });

        const res = await request(app).put('/api/tasks/task-1').send({
            title: 'Updated',
            status: 'todo',
            isDaily: false,
            order: 1
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 404 when task does not exist', async () => {
        const docSnap = makeDocSnap(null);
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
            }),
        });

        const res = await request(app).put('/api/tasks/not-found').send({
            title: 'X',
            status: 'todo'
        });
        expect(res.status).toBe(404);
    });

    it('returns 404 when userId does not match', async () => {
        const docSnap = makeDocSnap({ userId: 'other-user', title: 'Task' });
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
            }),
        });

        const res = await request(app).put('/api/tasks/task-1').send({
            title: 'X',
            status: 'todo'
        });
        expect(res.status).toBe(404);
    });
});

describe('DELETE /api/tasks/:id', () => {
    it('deletes task and returns 200', async () => {
        const docSnap = makeDocSnap({ userId: 'test-user-id' });
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
                delete: jest.fn().mockResolvedValue(undefined),
            }),
        });

        const res = await request(app).delete('/api/tasks/task-1');
        expect(res.status).toBe(200);
    });

    it('returns 404 for non-existent task', async () => {
        const docSnap = makeDocSnap(null);
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
            }),
        });

        const res = await request(app).delete('/api/tasks/missing');
        expect(res.status).toBe(404);
    });
});

describe('POST /api/tasks/:id/archive', () => {
    it('archives a task and returns 200', async () => {
        const docSnap = makeDocSnap({ userId: 'test-user-id' });
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(docSnap),
                update: jest.fn().mockResolvedValue(undefined),
            }),
        });

        const res = await request(app).post('/api/tasks/task-1/archive');
        expect(res.status).toBe(200);
    });
});

describe('POST /api/tasks/reset-daily', () => {
    it('resets daily tasks that have not been reset today', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        const mockBatch = {
            update: jest.fn(),
            commit: jest.fn().mockResolvedValue(undefined),
        };

        const snap = {
            docs: [{ data: () => ({ lastResetDate: yesterdayStr }), ref: {} }],
        };

        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(snap),
        });
        (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

        const res = await request(app).post('/api/tasks/reset-daily');
        expect(res.status).toBe(200);
        expect(res.body.resetCount).toBe(1);
        expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('skips tasks already reset today', async () => {
        const today = todayStr();
        const mockBatch = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };

        const snap = {
            docs: [{ data: () => ({ lastResetDate: today }), ref: {} }],
        };

        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(snap),
        });
        (adminDb.batch as jest.Mock).mockReturnValue(mockBatch);

        const res = await request(app).post('/api/tasks/reset-daily');
        expect(res.status).toBe(200);
        expect(res.body.resetCount).toBe(0);
        expect(mockBatch.commit).not.toHaveBeenCalled();
    });
});

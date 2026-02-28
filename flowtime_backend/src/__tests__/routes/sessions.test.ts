import request from 'supertest';
import express from 'express';

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
    FieldValue: { serverTimestamp: jest.fn(() => 'TIMESTAMP') },
    Timestamp: jest.fn(),
}));

import { adminDb } from '../../config/firebase';
import sessionsRouter from '../../routes/sessions';

const app = express();
app.use(express.json());
app.use('/api/sessions', sessionsRouter);

describe('GET /api/sessions', () => {
    it('returns sessions list', async () => {
        const snap = {
            docs: [{
                id: 'sess-1',
                data: () => ({
                    userId: 'test-user-id',
                    startedAt: '2024-01-15T10:00:00.000Z',
                    endedAt: '2024-01-15T10:30:00.000Z',
                    durationSeconds: 1800,
                    breakDurationSeconds: 300,
                    taskId: null,
                    taskTitle: null,
                    createdAt: '2024-01-15T10:00:00.000Z',
                }),
            }],
        };

        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(snap),
        });

        const res = await request(app).get('/api/sessions');
        expect(res.status).toBe(200);
        expect(res.body.sessions).toHaveLength(1);
        expect(res.body.sessions[0].id).toBe('sess-1');
        expect(res.body.sessions[0].durationSeconds).toBe(1800);
    });

    it('returns empty array when no sessions', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({ docs: [] }),
        });

        const res = await request(app).get('/api/sessions');
        expect(res.status).toBe(200);
        expect(res.body.sessions).toHaveLength(0);
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockRejectedValue(new Error('DB error')),
        });

        const res = await request(app).get('/api/sessions');
        expect(res.status).toBe(500);
    });
});

describe('POST /api/sessions', () => {
    it('creates a session and returns 201', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            add: jest.fn().mockResolvedValue({ id: 'new-sess-id' }),
        });

        const res = await request(app)
            .post('/api/sessions')
            .send({
                startedAt: '2024-01-15T10:00:00.000Z',
                endedAt: '2024-01-15T10:30:00.000Z',
                durationSeconds: 1800,
                breakDurationSeconds: 300,
                taskId: null,
                taskTitle: null,
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBe('new-sess-id');
    });

    it('returns 400 when startedAt is missing', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .send({ endedAt: '2024-01-15T10:30:00.000Z', durationSeconds: 1800 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when endedAt is missing', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .send({ startedAt: '2024-01-15T10:00:00.000Z', durationSeconds: 1800 });
        expect(res.status).toBe(400);
    });
});

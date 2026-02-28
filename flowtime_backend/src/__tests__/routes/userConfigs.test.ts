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

import { adminDb } from '../../config/firebase';
import userConfigsRouter from '../../routes/userConfigs';

const app = express();
app.use(express.json());
app.use('/api/user-configs', userConfigsRouter);

const mockConfig = {
    intervals: [25, 5, 25, 15],
    dailyGoalMinutes: 120,
    theme: 'dark' as const,
};

describe('GET /api/user-configs', () => {
    it('returns config when document exists', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: true, data: () => mockConfig }),
            }),
        });

        const res = await request(app).get('/api/user-configs');
        console.log('400 ERR BODY:\n', res.body); expect(res.status).toBe(200);
        expect(res.body.config).toEqual(mockConfig);
    });

    it('returns { config: null } when document does not exist', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: false }),
            }),
        });

        const res = await request(app).get('/api/user-configs');
        expect(res.status).toBe(200);
        expect(res.body.config).toBeNull();
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
        });

        const res = await request(app).get('/api/user-configs');
        expect(res.status).toBe(500);
    });
});

describe('PUT /api/user-configs', () => {
    it('saves config and returns 200', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                set: jest.fn().mockResolvedValue(undefined),
            }),
        });

        const res = await request(app)
            .put('/api/user-configs')
            .send(mockConfig);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('returns 400 when intervals is empty', async () => {
        const res = await request(app)
            .put('/api/user-configs')
            .send({ intervals: [], dailyGoalMinutes: 120 });
        expect(res.status).toBe(400);
    });

    it('returns 400 when intervals is missing', async () => {
        const res = await request(app)
            .put('/api/user-configs')
            .send({ dailyGoalMinutes: 120 });
        expect(res.status).toBe(400);
    });
});

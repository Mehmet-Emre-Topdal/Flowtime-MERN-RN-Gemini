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
    Timestamp: jest.fn(),
}));

import { adminDb } from '../../config/firebase';
import analyticsRouter from '../../routes/analytics';

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRouter);

describe('GET /api/analytics', () => {
    it('returns analytics result with correct shape', async () => {
        (adminDb.collection as jest.Mock).mockImplementation((col: string) => {
            if (col === 'sessions') {
                return {
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    get: jest.fn().mockResolvedValue({ docs: [] }),
                };
            }
            return {
                where: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue({ docs: [] }),
            };
        });

        const res = await request(app).get('/api/analytics');
        expect(res.status).toBe(200);

        expect(res.body).toHaveProperty('dailyFlowWaves');
        expect(res.body).toHaveProperty('weeklyWorkTime');
        expect(res.body).toHaveProperty('focusDensity');
        expect(res.body).toHaveProperty('resistancePoint');
        expect(res.body).toHaveProperty('naturalFlowWindow');
        expect(res.body).toHaveProperty('flowStreak');
        expect(res.body).toHaveProperty('taskFlowHarmony');
        expect(res.body).toHaveProperty('warmupPhase');
        expect(res.body).toHaveProperty('summary');
    });

    it('summary.totalSessions equals number of sessions returned', async () => {
        const sessionDocs = Array.from({ length: 5 }, (_, i) => ({
            id: `s${i}`,
            data: () => ({
                userId: 'test-user-id',
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                durationSeconds: 1800,
                breakDurationSeconds: 300,
                taskId: null,
                taskTitle: null,
                createdAt: new Date().toISOString(),
            }),
        }));

        (adminDb.collection as jest.Mock).mockImplementation((col: string) => {
            if (col === 'sessions') {
                return {
                    where: jest.fn().mockReturnThis(),
                    orderBy: jest.fn().mockReturnThis(),
                    get: jest.fn().mockResolvedValue({ docs: sessionDocs }),
                };
            }
            return {
                where: jest.fn().mockReturnThis(),
                get: jest.fn().mockResolvedValue({ docs: [] }),
            };
        });

        const res = await request(app).get('/api/analytics');
        expect(res.status).toBe(200);
        expect(res.body.summary.totalSessions).toBe(5);
        expect(res.body.summary.allTimeMinutes).toBe(5 * 30);
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            get: jest.fn().mockRejectedValue(new Error('DB error')),
        });

        const res = await request(app).get('/api/analytics');
        expect(res.status).toBe(500);
    });

    it('accepts weekOffset query param without error', async () => {
        (adminDb.collection as jest.Mock).mockImplementation((col: string) => {
            if (col === 'sessions') {
                return { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ docs: [] }) };
            }
            return { where: jest.fn().mockReturnThis(), get: jest.fn().mockResolvedValue({ docs: [] }) };
        });

        const res = await request(app).get('/api/analytics?weekOffset=-1');
        expect(res.status).toBe(200);
    });
});

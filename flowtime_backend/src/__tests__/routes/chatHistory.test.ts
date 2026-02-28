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
}));

import { adminDb } from '../../config/firebase';
import chatHistoryRouter from '../../routes/chatHistory';

const app = express();
app.use(express.json());
app.use('/api/chat-history', chatHistoryRouter);

const sampleMessages = [
    { role: 'user', content: 'Hello', timestamp: '2024-01-15T10:00:00.000Z' },
    { role: 'assistant', content: 'Hi there!', timestamp: '2024-01-15T10:00:01.000Z' },
];

describe('GET /api/chat-history', () => {
    it('returns messages and summary when document exists', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ messages: sampleMessages, summary: 'A summary' }),
                }),
            }),
        });

        const res = await request(app).get('/api/chat-history');
        expect(res.status).toBe(200);
        expect(res.body.messages).toHaveLength(2);
        expect(res.body.summary).toBe('A summary');
    });

    it('returns empty messages and null summary when document does not exist', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({ exists: false }),
            }),
        });

        const res = await request(app).get('/api/chat-history');
        expect(res.status).toBe(200);
        expect(res.body.messages).toHaveLength(0);
        expect(res.body.summary).toBeNull();
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                get: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
        });

        const res = await request(app).get('/api/chat-history');
        expect(res.status).toBe(500);
    });
});

describe('PUT /api/chat-history', () => {
    it('saves chat history and returns 200', async () => {
        const mockSet = jest.fn().mockResolvedValue(undefined);
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({ set: mockSet }),
        });

        const res = await request(app)
            .put('/api/chat-history')
            .send({ messages: sampleMessages, summary: 'Summary text' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ messages: sampleMessages, summary: 'Summary text' }),
        );
    });

    it('saves with null summary', async () => {
        const mockSet = jest.fn().mockResolvedValue(undefined);
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({ set: mockSet }),
        });

        const res = await request(app)
            .put('/api/chat-history')
            .send({ messages: [], summary: null });

        expect(res.status).toBe(200);
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ messages: [], summary: null }),
        );
    });
});

describe('DELETE /api/chat-history', () => {
    it('deletes document and returns 200', async () => {
        const mockDelete = jest.fn().mockResolvedValue(undefined);
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({ delete: mockDelete }),
        });

        const res = await request(app).delete('/api/chat-history');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
    });

    it('returns 500 on Firestore error', async () => {
        (adminDb.collection as jest.Mock).mockReturnValue({
            doc: jest.fn().mockReturnValue({
                delete: jest.fn().mockRejectedValue(new Error('DB error')),
            }),
        });

        const res = await request(app).delete('/api/chat-history');
        expect(res.status).toBe(500);
    });
});

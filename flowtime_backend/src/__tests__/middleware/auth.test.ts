import { Request, Response, NextFunction } from 'express';

// Mock Firebase config before importing authMiddleware
jest.mock('../../config/firebase', () => ({
    adminAuth: {
        verifyIdToken: jest.fn(),
    },
    adminDb: {},
}));

import { authMiddleware } from '../../middleware/auth';
import { adminAuth } from '../../config/firebase';

const mockVerify = adminAuth.verifyIdToken as jest.Mock;

function makeReq(authHeader?: string): Partial<Request> {
    return { headers: { authorization: authHeader } } as Partial<Request>;
}

function makeRes(): { status: jest.Mock; json: jest.Mock } {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
}

describe('authMiddleware', () => {
    const next: NextFunction = jest.fn();

    beforeEach(() => {
        (next as jest.Mock).mockClear();
    });

    it('returns 401 when Authorization header is missing', async () => {
        const req = makeReq(undefined);
        const res = makeRes();
        await authMiddleware(req as Request, res as unknown as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when header does not start with "Bearer "', async () => {
        const req = makeReq('Basic sometoken');
        const res = makeRes();
        await authMiddleware(req as Request, res as unknown as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when verifyIdToken throws', async () => {
        mockVerify.mockRejectedValueOnce(new Error('Invalid'));
        const req = makeReq('Bearer bad-token');
        const res = makeRes();
        await authMiddleware(req as Request, res as unknown as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });

    it('sets req.userId and calls next() on valid token', async () => {
        mockVerify.mockResolvedValueOnce({ uid: 'user-123' });
        const req = makeReq('Bearer valid-token') as Request;
        const res = makeRes();
        await authMiddleware(req, res as unknown as Response, next);
        expect(mockVerify).toHaveBeenCalledWith('valid-token');
        expect(req.userId).toBe('user-123');
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

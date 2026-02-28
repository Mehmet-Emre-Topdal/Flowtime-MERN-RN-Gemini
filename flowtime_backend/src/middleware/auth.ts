import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase';

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        req.userId = decoded.uid;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

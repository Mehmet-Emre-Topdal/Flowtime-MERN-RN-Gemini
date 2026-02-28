// Mock auth middleware — injects a fixed userId and calls next()
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
    req.userId = 'test-user-id';
    next();
};

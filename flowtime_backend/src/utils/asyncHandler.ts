import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async express route handler to automatically catch errors
 * and pass them to the global error handler middleware via next(err).
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error('[Global Error]', err);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
        // Stack trace'i canlı ortamda (production) gizliyoruz
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
}

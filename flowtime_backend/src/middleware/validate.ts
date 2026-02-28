import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = (schema: z.ZodObject<any, any>) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Şemaya gelen body parametrelerini doğrula, güvenli hallerini geri ata.
            const parsedData = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            if (parsedData.body !== undefined) req.body = parsedData.body;
            if (parsedData.query !== undefined) req.query = parsedData.query as any;
            if (parsedData.params !== undefined) req.params = parsedData.params as any;

            next();
        } catch (error: any) {
            try {
                if (error && error.name === 'ZodError') {
                    res.status(400).json({
                        error: 'Validation failed',
                        details: error.errors?.map((err: z.ZodIssue) => ({
                            path: err.path.join('.'),
                            message: err.message,
                        })) || [],
                    });
                    return;
                }
                console.error('[validateRequest] Unexpected error:', error);
                res.status(500).json({ error: 'Internal server error during validation' });
            } catch (innerError) {
                console.error('[validateRequest] Error inside catch block:', innerError);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Fatal validation error' });
                }
            }
        }
    };
};

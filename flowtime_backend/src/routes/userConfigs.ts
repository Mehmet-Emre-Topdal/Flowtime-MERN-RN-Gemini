import { Router, Request, Response } from 'express';
import { adminDb } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateUserConfigSchema } from '../schemas';
import type { UserConfig } from '../types/config';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/user-configs
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const docSnap = await adminDb.collection('userConfigs').doc(userId).get();

    if (!docSnap.exists) {
        res.status(200).json({ config: null });
        return;
    }

    res.status(200).json({ config: docSnap.data() as UserConfig });
}));

// PUT /api/user-configs
router.put('/', authMiddleware, validateRequest(updateUserConfigSchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const config = req.body as z.infer<typeof updateUserConfigSchema>['body'];

    await adminDb.collection('userConfigs').doc(userId).set(config, { merge: true });

    res.status(200).json({ success: true });
}));

export default router;

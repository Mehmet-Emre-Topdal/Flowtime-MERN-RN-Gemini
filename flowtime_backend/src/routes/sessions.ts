import { Router, Request, Response } from 'express';
import { adminDb } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { FlowSession, FlowSessionCreateInput } from '../types/session';
import { mapDocToFlowSession } from '../utils/firestoreHelpers';
import { validateRequest } from '../middleware/validate';
import { z } from 'zod';
import { createSessionSchema } from '../schemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/sessions
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    let queryRef = adminDb
        .collection('sessions')
        .where('userId', '==', userId)
        .orderBy('startedAt', 'desc');

    if (startDate) {
        queryRef = queryRef.where('startedAt', '>=', startDate) as typeof queryRef;
    }
    if (endDate) {
        queryRef = queryRef.where('startedAt', '<=', endDate + 'T23:59:59.999Z') as typeof queryRef;
    }

    const snapshot = await queryRef.get();

    const sessions: FlowSession[] = snapshot.docs.map(mapDocToFlowSession);

    res.status(200).json({ sessions });
}));

// POST /api/sessions
router.post('/', authMiddleware, validateRequest(createSessionSchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const input = req.body as z.infer<typeof createSessionSchema>['body'];

    const docRef = await adminDb.collection('sessions').add({
        ...input,
        userId,
        createdAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ success: true, id: docRef.id });
}));

export default router;

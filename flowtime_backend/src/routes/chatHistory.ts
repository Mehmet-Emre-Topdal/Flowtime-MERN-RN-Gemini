import { Router, Request, Response } from 'express';
import { adminDb } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { validateRequest } from '../middleware/validate';
import { updateChatHistorySchema } from '../schemas';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/chat-history
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const doc = await adminDb.collection('chatHistory').doc(userId).get();

    if (!doc.exists) {
        res.status(200).json({ messages: [], summary: null });
        return;
    }

    const data = doc.data()!;
    res.status(200).json({
        messages: data.messages ?? [],
        summary: data.summary ?? null,
    });
}));

// PUT /api/chat-history
router.put('/', authMiddleware, validateRequest(updateChatHistorySchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const { messages, summary } = req.body as z.infer<typeof updateChatHistorySchema>['body'];

    await adminDb.collection('chatHistory').doc(userId).set({
        messages,
        summary: summary ?? null,
        updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true });
}));

// DELETE /api/chat-history
router.delete('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    await adminDb.collection('chatHistory').doc(userId).delete();
    res.status(200).json({ success: true });
}));

export default router;

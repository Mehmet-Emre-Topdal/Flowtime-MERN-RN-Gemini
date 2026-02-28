import { Router, Request, Response } from 'express';
import { adminDb } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import { FieldValue } from 'firebase-admin/firestore';
import type { TaskDto, TaskCreateInput, TaskStatus } from '../types/task';
import { toISO, mapDocToTaskDto } from '../utils/firestoreHelpers';
import { todayStr } from '../utils/dateHelpers';
import { validateRequest } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../schemas';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * Görevi döndürür. Mevcut değilse veya userId eşleşmiyorsa null döner.
 * PUT / DELETE / archive endpointlerindeki ownership kontrolünün tek kaynağı.
 */
async function getOwnedTask(taskId: string, userId: string) {
    const taskRef = adminDb.collection('tasks').doc(taskId);
    const snap = await taskRef.get();
    if (!snap.exists || snap.data()?.userId !== userId) return null;
    return { taskRef, snap };
}

// GET /api/tasks
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const snapshot = await adminDb
        .collection('tasks')
        .where('userId', '==', userId)
        .orderBy('order', 'asc')
        .get();

    const tasks: TaskDto[] = snapshot.docs
        .map(mapDocToTaskDto)
        .filter(t => !t.isArchived);

    res.status(200).json({ tasks });
}));

// POST /api/tasks
router.post('/', authMiddleware, validateRequest(createTaskSchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const { task, order } = req.body as z.infer<typeof createTaskSchema>['body'];

    const today = todayStr();

    const docRef = await adminDb.collection('tasks').add({
        ...task,
        userId,
        order,
        totalFocusedTime: 0,
        isArchived: false,
        isDaily: task.isDaily ?? false,
        lastResetDate: task.isDaily ? today : '',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({ success: true, id: docRef.id });
}));

// POST /api/tasks/reset-daily
router.post('/reset-daily', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const today = todayStr();

    const snapshot = await adminDb
        .collection('tasks')
        .where('userId', '==', userId)
        .where('isDaily', '==', true)
        .where('isArchived', '==', false)
        .get();

    const batch = adminDb.batch();
    let resetCount = 0;

    snapshot.docs.forEach(d => {
        if (d.data().lastResetDate !== today) {
            batch.update(d.ref, {
                status: 'todo',
                lastResetDate: today,
                updatedAt: FieldValue.serverTimestamp(),
            });
            resetCount++;
        }
    });

    if (resetCount > 0) {
        await batch.commit();
    }

    res.status(200).json({ resetCount });
}));

router.put('/:id', authMiddleware, validateRequest(updateTaskSchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const taskId = req.params.id;

    const owned = await getOwnedTask(taskId, userId);
    if (!owned) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    const { taskRef } = owned;

    const body = req.body as z.infer<typeof updateTaskSchema>['body'];
    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.isDaily !== undefined) updates.isDaily = body.isDaily;
    if (body.order !== undefined) updates.order = body.order;

    if (body.status !== undefined) {
        updates.status = body.status;
        updates.completedAt = body.status === 'done' ? new Date().toISOString() : null;
    }

    if (body.additionalMinutes !== undefined) {
        updates.totalFocusedTime = FieldValue.increment(body.additionalMinutes);
    }

    await taskRef.update(updates);
    res.status(200).json({ success: true });
}));

// DELETE /api/tasks/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const taskId = req.params.id;

    const owned = await getOwnedTask(taskId, userId);
    if (!owned) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    await owned.taskRef.delete();
    res.status(200).json({ success: true });
}));

// POST /api/tasks/:id/archive
router.post('/:id/archive', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const taskId = req.params.id;

    const owned = await getOwnedTask(taskId, userId);
    if (!owned) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    await owned.taskRef.update({
        isArchived: true,
        updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ success: true });
}));

export default router;

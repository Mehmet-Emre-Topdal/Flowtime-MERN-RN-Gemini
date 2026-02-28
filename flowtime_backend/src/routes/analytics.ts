import { Router, Request, Response } from 'express';
import { adminDb } from '../config/firebase';
import { authMiddleware } from '../middleware/auth';
import type { FlowSession } from '../types/session';
import type { TaskDto } from '../types/task';
import {
    calcDailyFlowWaves,
    calcWeeklyWorkTime,
    calcFocusDensity,
    calcResistancePoint,
    calcNaturalFlowWindow,
    calcFlowStreak,
    calcTaskFlowHarmony,
    calcWarmupPhase,
} from '../utils/analyticsCalculations';
import { mapDocToFlowSession, mapDocToTaskDto } from '../utils/firestoreHelpers';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// GET /api/analytics
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    const rawOffset = parseInt((req.query.weekOffset as string) ?? '0', 10);
    const weekOffset = Number.isNaN(rawOffset) ? 0 : rawOffset;

    const sessionsSnap = await adminDb
        .collection('sessions')
        .where('userId', '==', userId)
        .orderBy('startedAt', 'desc')
        .get();

    const sessions: FlowSession[] = sessionsSnap.docs.map(mapDocToFlowSession);

    const tasksSnap = await adminDb
        .collection('tasks')
        .where('userId', '==', userId)
        .get();

    const tasks: TaskDto[] = tasksSnap.docs.map(mapDocToTaskDto);

    const result = {
        dailyFlowWaves: calcDailyFlowWaves(sessions),
        weeklyWorkTime: calcWeeklyWorkTime(sessions, weekOffset),
        focusDensity: calcFocusDensity(sessions),
        resistancePoint: calcResistancePoint(sessions),
        naturalFlowWindow: calcNaturalFlowWindow(sessions),
        flowStreak: calcFlowStreak(sessions),
        taskFlowHarmony: calcTaskFlowHarmony(sessions, tasks),
        warmupPhase: calcWarmupPhase(sessions),
        summary: {
            totalSessions: sessions.length,
            allTimeMinutes: Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds / 60, 0)),
        },
    };

    res.status(200).json(result);
}));

export default router;

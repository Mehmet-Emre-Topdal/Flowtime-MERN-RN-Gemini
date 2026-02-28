/**
 * Görev (task) bazlı metrikler.
 * Kapsam: en çok odaklanılan görevler, isme göre arama,
 * tamamlanan görevler ve çalışılan görevler listesi.
 */

import { adminDb } from '../config/firebase';
import { fetchSessionsByRange, getDurationMinutes } from './sessionFetcher';
import { fetchTaskTitles } from './firestoreHelpers';
import { FIRESTORE_IN_QUERY_LIMIT } from '../config/constants';

// ─── Şema ────────────────────────────────────────────────────

interface CompletedTaskDoc {
    title: string;
    totalFocusedTime: number;
    completedAt: string | null;
    updatedAt: FirebaseFirestore.Timestamp | string;
}

// ─── toolGetTopTasks ─────────────────────────────────────────

export async function toolGetTopTasks(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number = 3,
    order: 'asc' | 'desc' = 'desc',
) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const taggedSessions = sessions.filter(s => s.taskId);
    if (taggedSessions.length === 0) return { items: [], hasEnoughData: false };

    const taskTitles: Record<string, string> = {};
    taggedSessions.forEach(s => {
        if (s.taskId && s.taskTitle) taskTitles[s.taskId] = s.taskTitle;
    });

    const missingIds = [...new Set(taggedSessions.map(s => s.taskId!))].filter(id => !taskTitles[id]);
    if (missingIds.length > 0) {
        Object.assign(taskTitles, await fetchTaskTitles(missingIds));
    }

    const aggregates: Record<string, { title: string; totalMinutes: number; count: number }> = {};
    taggedSessions.forEach(s => {
        if (!s.taskId) return;
        const title = taskTitles[s.taskId] || 'Unknown';
        if (!aggregates[s.taskId]) aggregates[s.taskId] = { title, totalMinutes: 0, count: 0 };
        aggregates[s.taskId].totalMinutes += getDurationMinutes(s);
        aggregates[s.taskId].count++;
    });

    const items = Object.values(aggregates)
        .map(a => ({
            taskTitle: a.title,
            totalFocusMinutes: Math.round(a.totalMinutes),
            sessionCount: a.count,
            averageSessionMinutes: Math.round((a.totalMinutes / a.count) * 10) / 10,
        }))
        .sort((a, b) => order === 'asc'
            ? a.totalFocusMinutes - b.totalFocusMinutes
            : b.totalFocusMinutes - a.totalFocusMinutes)
        .slice(0, limit);

    return { items, hasEnoughData: true };
}

// ─── toolGetTaskFocusByName ──────────────────────────────────

export async function toolGetTaskFocusByName(
    userId: string,
    taskName: string,
    startDate: string,
    endDate: string,
) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const normalizedSearch = taskName.toLowerCase().trim();

    const sessionsByTitle = sessions.filter(s =>
        s.taskTitle && s.taskTitle.toLowerCase().includes(normalizedSearch),
    );

    const sessionsWithoutTitle = sessions.filter(s => s.taskId && !s.taskTitle);
    let fallbackSessions = [] as typeof sessions;

    if (sessionsWithoutTitle.length > 0) {
        const taskIds = [...new Set(sessionsWithoutTitle.map(s => s.taskId!))];
        const allTitles = await fetchTaskTitles(taskIds);
        const matchingIds = new Set<string>(
            Object.entries(allTitles)
                .filter(([, title]) => title.toLowerCase().includes(normalizedSearch))
                .map(([id]) => id),
        );
        fallbackSessions = sessionsWithoutTitle.filter(s => s.taskId && matchingIds.has(s.taskId));
    }

    const matchingSessions = [...sessionsByTitle, ...fallbackSessions];
    if (matchingSessions.length === 0) return { found: false, tasks: [], totalFocusMinutes: 0 };

    const aggregates: Record<string, { totalMinutes: number; count: number }> = {};
    matchingSessions.forEach(s => {
        const title = s.taskTitle || taskName;
        if (!aggregates[title]) aggregates[title] = { totalMinutes: 0, count: 0 };
        aggregates[title].totalMinutes += getDurationMinutes(s);
        aggregates[title].count++;
    });

    const tasks = Object.entries(aggregates).map(([title, data]) => ({
        taskTitle: title,
        totalFocusMinutes: Math.round(data.totalMinutes),
        sessionCount: data.count,
    }));

    return {
        found: true,
        tasks,
        totalFocusMinutes: Math.round(matchingSessions.reduce((sum, s) => sum + getDurationMinutes(s), 0)),
    };
}

// ─── toolGetCompletedTasks ───────────────────────────────────

export async function toolGetCompletedTasks(userId: string, startDate: string, endDate: string) {
    // ISO string karşılaştırması lexicografik olarak doğru çalışır (YYYY-MM-DDTHH:mm:ss.sssZ)
    // Firestore composite index gerekli: [userId, status, completedAt]
    const startISO = `${startDate}T00:00:00.000Z`;
    const endISO = `${endDate}T23:59:59.999Z`;

    const snapshot = await adminDb.collection('tasks')
        .where('userId', '==', userId)
        .where('status', '==', 'done')
        .where('completedAt', '>=', startISO)
        .where('completedAt', '<=', endISO)
        .get();

    const tasks = snapshot.docs.map(doc => {
        const data = doc.data() as CompletedTaskDoc;
        return { title: data.title, totalFocusedMinutes: data.totalFocusedTime };
    });

    return { tasks, count: tasks.length };
}

// ─── toolGetWorkedTasks ──────────────────────────────────────

export async function toolGetWorkedTasks(
    userId: string,
    startDate: string,
    endDate: string,
    limit?: number,
) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const taggedSessions = sessions.filter(s => s.taskId);
    if (taggedSessions.length === 0) return { tasks: [], count: 0 };

    // Pre-populate known titles from session data
    const taskTitles: Record<string, string> = {};
    taggedSessions.forEach(s => {
        if (s.taskId && s.taskTitle) taskTitles[s.taskId] = s.taskTitle;
    });

    // Tek geçişte hem eksik başlıkları hem de durumları çek
    const allTaskIds = [...new Set(taggedSessions.map(s => s.taskId!))];
    const statusMap: Record<string, string> = {};

    for (let i = 0; i < allTaskIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
        const batch = allTaskIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
        const snap = await adminDb.collection('tasks').where('__name__', 'in', batch).get();
        snap.docs.forEach(doc => {
            const data = doc.data() as { status?: string; title?: string };
            statusMap[doc.id] = data.status || 'unknown';
            if (!taskTitles[doc.id]) taskTitles[doc.id] = data.title || 'Unknown';
        });
    }

    const aggregates: Record<string, { title: string; totalMinutes: number }> = {};
    taggedSessions.forEach(s => {
        if (!s.taskId) return;
        const title = taskTitles[s.taskId] || 'Unknown';
        if (!aggregates[s.taskId]) aggregates[s.taskId] = { title, totalMinutes: 0 };
        aggregates[s.taskId].totalMinutes += getDurationMinutes(s);
    });

    let tasks = Object.entries(aggregates)
        .map(([taskId, data]) => ({
            taskTitle: data.title,
            totalFocusMinutes: Math.round(data.totalMinutes),
            currentStatus: statusMap[taskId] || 'unknown',
        }))
        .sort((a, b) => b.totalFocusMinutes - a.totalFocusMinutes);

    if (limit && limit > 0) tasks = tasks.slice(0, limit);

    return { tasks, count: tasks.length };
}

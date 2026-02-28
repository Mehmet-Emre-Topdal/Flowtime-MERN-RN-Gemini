import type { Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '../config/firebase';
import type { FlowSession } from '../types/session';
import type { TaskDto } from '../types/task';
import { FIRESTORE_IN_QUERY_LIMIT } from '../config/constants';

export const toISO = (val: Timestamp | string | undefined): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.toDate().toISOString();
};

/** Firestore session dokümanını FlowSession DTO'suna dönüştürür. */
export function mapDocToFlowSession(doc: QueryDocumentSnapshot): FlowSession {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        startedAt: toISO(data.startedAt),
        endedAt: toISO(data.endedAt),
        durationSeconds: data.durationSeconds,
        breakDurationSeconds: data.breakDurationSeconds ?? 0,
        taskId: data.taskId ?? null,
        taskTitle: data.taskTitle ?? null,
        createdAt: toISO(data.createdAt),
    };
}

/** Firestore task dokümanını TaskDto'ya dönüştürür. */
export function mapDocToTaskDto(doc: QueryDocumentSnapshot): TaskDto {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description ?? '',
        status: data.status,
        totalFocusedTime: data.totalFocusedTime ?? 0,
        order: data.order ?? 0,
        isArchived: data.isArchived ?? false,
        isDaily: data.isDaily ?? false,
        lastResetDate: data.lastResetDate ?? '',
        createdAt: toISO(data.createdAt),
        updatedAt: toISO(data.updatedAt),
        completedAt: data.completedAt ?? null,
    };
}

/**
 * Verilen görev ID listesi için Firestore'dan başlıkları 10'luk batch'ler halinde çeker.
 * Birden fazla yerde tekrar eden eksik başlık fetch döngüsünün tek kaynağı.
 */
export async function fetchTaskTitles(taskIds: string[]): Promise<Record<string, string>> {
    const titles: Record<string, string> = {};
    for (let i = 0; i < taskIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
        const batch = taskIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
        const snap = await adminDb.collection('tasks').where('__name__', 'in', batch).get();
        snap.docs.forEach(doc => {
            titles[doc.id] = (doc.data().title as string) || 'Unknown';
        });
    }
    return titles;
}


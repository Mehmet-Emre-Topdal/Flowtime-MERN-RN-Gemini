/**
 * Metrik fonksiyonları için paylaşılan Firestore altyapısı.
 * Tüm metric dosyaları bu modülden session türleri ve fetch yardımcılarını alır.
 */

import { adminDb } from '../config/firebase';
import { getDateString } from './dateHelpers';
import { calculateStreaks } from './streakUtils';
import { MIN_SESSIONS_FOR_STREAK, STREAK_THRESHOLD_RATIO, STREAK_LOOKBACK_DAYS } from '../config/constants';

// ─── Firestore Şeması ────────────────────────────────────────

export interface SessionDoc {
    startedAt: FirebaseFirestore.Timestamp | string;
    endedAt: FirebaseFirestore.Timestamp | string;
    durationSeconds: number;
    breakDurationSeconds: number;
    taskId: string | null;
    taskTitle: string | null;
    userId: string;
}

export interface ParsedSession {
    startedAt: Date;
    endedAt: Date;
    durationSeconds: number;
    breakDurationSeconds: number;
    taskId: string | null;
    taskTitle: string | null;
}

// ─── Dönüştürücüler ──────────────────────────────────────────

export function parseTimestamp(val: FirebaseFirestore.Timestamp | string): Date {
    if (typeof val === 'string') return new Date(val);
    return val.toDate();
}

export function getDurationMinutes(s: ParsedSession): number {
    return s.durationSeconds / 60;
}

function mapDocToParsedSession(doc: FirebaseFirestore.QueryDocumentSnapshot): ParsedSession {
    const data = doc.data() as SessionDoc;
    return {
        startedAt: parseTimestamp(data.startedAt),
        endedAt: parseTimestamp(data.endedAt),
        durationSeconds: data.durationSeconds,
        breakDurationSeconds: data.breakDurationSeconds || 0,
        taskId: data.taskId || null,
        taskTitle: data.taskTitle || null,
    };
}

// ─── Fetch Yardımcıları ──────────────────────────────────────

/** ISO tarih aralığına göre kullanıcının session'larını getirir (tüm araç fonksiyonları için). */
export async function fetchSessionsByRange(
    userId: string,
    startDate: string,
    endDate: string,
): Promise<ParsedSession[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const snapshot = await adminDb.collection('sessions')
        .where('userId', '==', userId)
        .where('startedAt', '>=', start.toISOString())
        .where('startedAt', '<=', end.toISOString())
        .orderBy('startedAt', 'desc')
        .get();

    return snapshot.docs.map(mapDocToParsedSession);
}

// ─── Streak İç Yardımcısı ────────────────────────────────────

/** Son STREAK_LOOKBACK_DAYS günlük session'lardan mevcut ve rekor streak'i hesaplar. */
export async function getCurrentStreak(userId: string) {
    const todayISO = new Date().toISOString().split('T')[0];
    const sinceDate = new Date();
    sinceDate.setHours(0, 0, 0, 0);
    sinceDate.setDate(sinceDate.getDate() - STREAK_LOOKBACK_DAYS);
    const sinceISO = sinceDate.toISOString().split('T')[0];

    const sessions = await fetchSessionsByRange(userId, sinceISO, todayISO);
    if (sessions.length < MIN_SESSIONS_FOR_STREAK) return { currentStreak: 0, recordStreak: 0 };

    const dailyScores: Record<string, number> = {};
    sessions.forEach((s: ParsedSession) => {
        const dateKey = getDateString(s.startedAt);
        dailyScores[dateKey] = (dailyScores[dateKey] || 0) + getDurationMinutes(s);
    });

    const recentDayScores = Object.values(dailyScores);
    const avgScore = recentDayScores.length > 0
        ? recentDayScores.reduce((a, b) => a + b, 0) / recentDayScores.length
        : 0;
    const threshold = avgScore * STREAK_THRESHOLD_RATIO;

    return calculateStreaks(dailyScores, threshold);
}

/**
 * Kullanıcı davranış metrikleri.
 * Kapsam: streak serisi, direnç noktası, en uzun oturum
 * ve ısınma süresi analizleri.
 */

import { fetchSessionsByRange, getDurationMinutes, getCurrentStreak } from './sessionFetcher';
import { getDateString } from './dateHelpers';
import { median, mode } from './statisticsHelpers';
import {
    WARMUP_RATIO,
    MIN_SESSIONS_FOR_RESISTANCE,
    MIN_SUCCESSFUL_SESSIONS_FOR_WARMUP,
    MIN_SUCCESSFUL_SESSION_MINUTES,
} from '../config/constants';

// ─── toolGetStreak ───────────────────────────────────────────

export async function toolGetStreak(userId: string) {
    return getCurrentStreak(userId);
}

// ─── toolGetResistancePoint ──────────────────────────────────

export async function toolGetResistancePoint(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    if (sessions.length < MIN_SESSIONS_FOR_RESISTANCE) return { resistanceMinute: 0, hasEnoughData: false };

    const durations = sessions.map(s => Math.round(getDurationMinutes(s)));
    const modeVal = mode(durations);
    const medianVal = median(durations);
    const diff = Math.abs(modeVal - medianVal) / Math.max(medianVal, 1);
    const resistanceMinute = diff > 0.2 ? Math.round(medianVal) : modeVal;

    return { resistanceMinute, hasEnoughData: true, totalSessionsAnalyzed: sessions.length };
}

// ─── toolGetLongestSession ───────────────────────────────────

export async function toolGetLongestSession(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    if (sessions.length === 0) return { longestMinutes: 0, date: null };

    const longest = sessions.reduce((max, s) =>
        s.durationSeconds > max.durationSeconds ? s : max,
    );

    return {
        longestMinutes: Math.round(getDurationMinutes(longest)),
        date: getDateString(longest.startedAt),
    };
}

// ─── toolGetWarmupDuration ───────────────────────────────────

export async function toolGetWarmupDuration(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const successfulSessions = sessions.filter(s => getDurationMinutes(s) >= MIN_SUCCESSFUL_SESSION_MINUTES);
    if (successfulSessions.length < MIN_SUCCESSFUL_SESSIONS_FOR_WARMUP) return { avgWarmupMinutes: 0, hasEnoughData: false };

    const durations = successfulSessions.map(s => getDurationMinutes(s));
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;

    return {
        avgWarmupMinutes: Math.round(avg * WARMUP_RATIO * 10) / 10,
        hasEnoughData: true,
        sessionsAnalyzed: successfulSessions.length,
    };
}

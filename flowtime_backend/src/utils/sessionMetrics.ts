/**
 * Oturum düzeyinde özet metrikler.
 * Kapsam: belirli tarih aralığı için oturum sayısı, süre dağılımı,
 * saatlik verimlilik ve dönem karşılaştırması.
 */

import { fetchSessionsByRange, getDurationMinutes, ParsedSession } from './sessionFetcher';
import { getDayOfWeek } from './dateHelpers';

// ─── toolGetSessionsSummary ──────────────────────────────────

export async function toolGetSessionsSummary(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const totalFocusMinutes = Math.round(sessions.reduce((sum, s) => sum + getDurationMinutes(s), 0));
    const averageMinutes = sessions.length > 0
        ? Math.round((totalFocusMinutes / sessions.length) * 10) / 10
        : 0;

    const buckets = {
        under_15min: 0, '15_to_25min': 0, '25_to_45min': 0,
        '45_to_60min': 0, '60_to_90min': 0, over_90min: 0,
    };
    sessions.forEach(s => {
        const mins = getDurationMinutes(s);
        if (mins < 15) buckets.under_15min++;
        else if (mins < 25) buckets['15_to_25min']++;
        else if (mins < 45) buckets['25_to_45min']++;
        else if (mins < 60) buckets['45_to_60min']++;
        else if (mins < 90) buckets['60_to_90min']++;
        else buckets.over_90min++;
    });

    return {
        sessionCount: sessions.length,
        totalFocusMinutes,
        averageSessionMinutes: averageMinutes,
        distribution: buckets,
    };
}

// ─── toolGetHourlyDistribution ───────────────────────────────

export async function toolGetHourlyDistribution(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const hourTotals: number[] = new Array(24).fill(0);
    const hourCounts: number[] = new Array(24).fill(0);

    sessions.forEach(s => {
        const hour = s.startedAt.getHours();
        hourTotals[hour] += getDurationMinutes(s);
        hourCounts[hour]++;
    });

    const hourData = hourTotals
        .map((totalMinutes, hour) => ({
            hour,
            totalMinutes: Math.round(totalMinutes),
            sessionCount: hourCounts[hour],
        }))
        .filter(h => h.totalMinutes > 0)
        .sort((a, b) => b.totalMinutes - a.totalMinutes);

    return { peakHours: hourData.slice(0, 3), allHours: hourData };
}

// ─── toolComparePeriods ──────────────────────────────────────

export async function toolComparePeriods(
    userId: string,
    period1Start: string, period1End: string,
    period2Start: string, period2End: string,
) {
    const [p1, p2] = await Promise.all([
        fetchSessionsByRange(userId, period1Start, period1End),
        fetchSessionsByRange(userId, period2Start, period2End),
    ]);

    const summarize = (sessions: ParsedSession[]) => ({
        sessionCount: sessions.length,
        totalFocusMinutes: Math.round(sessions.reduce((sum, s) => sum + getDurationMinutes(s), 0)),
        averageSessionMinutes: sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + getDurationMinutes(s), 0) / sessions.length * 10) / 10
            : 0,
    });

    return {
        period1: { startDate: period1Start, endDate: period1End, ...summarize(p1) },
        period2: { startDate: period2Start, endDate: period2End, ...summarize(p2) },
    };
}

// ─── toolGetWeekdayStats ─────────────────────────────────────

export async function toolGetWeekdayStats(userId: string, startDate: string, endDate: string) {
    const sessions = await fetchSessionsByRange(userId, startDate, endDate);
    const weekdayMinutes: Record<string, number> = {};
    const weekdayCounts: Record<string, number> = {};

    sessions.forEach(s => {
        const day = getDayOfWeek(s.startedAt);
        weekdayMinutes[day] = (weekdayMinutes[day] || 0) + getDurationMinutes(s);
        weekdayCounts[day] = (weekdayCounts[day] || 0) + 1;
    });

    return Object.entries(weekdayMinutes).map(([day, totalMinutes]) => ({
        day,
        totalMinutes: Math.round(totalMinutes),
        sessionCount: weekdayCounts[day],
    }));
}

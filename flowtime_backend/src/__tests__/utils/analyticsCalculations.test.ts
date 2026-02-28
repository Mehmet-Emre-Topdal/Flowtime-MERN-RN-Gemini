import {
    calcDailyFlowWaves,
    calcWeeklyWorkTime,
    calcFocusDensity,
    calcResistancePoint,
    calcNaturalFlowWindow,
    calcFlowStreak,
    calcTaskFlowHarmony,
    calcWarmupPhase,
} from '../../utils/analyticsCalculations';
import { todayStr } from '../../utils/dateHelpers';
import type { FlowSession } from '../../types/session';
import type { TaskDto } from '../../types/task';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<FlowSession> = {}): FlowSession {
    const startedAt = overrides.startedAt ?? new Date().toISOString();
    const durationSeconds = overrides.durationSeconds ?? 1800; // 30 min
    const endedAt = overrides.endedAt ?? new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();
    return {
        id: 'sess-' + Math.random(),
        userId: 'user-1',
        startedAt,
        endedAt,
        durationSeconds,
        breakDurationSeconds: 300,
        taskId: null,
        taskTitle: null,
        createdAt: startedAt,
        ...overrides,
    };
}

/** Create N sessions spread across the last `days` days, all at 10:00 */
function sessionsOverDays(count: number, days: number, durationSeconds = 1800): FlowSession[] {
    return Array.from({ length: count }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (i % days));
        d.setHours(10, 0, 0, 0);
        return makeSession({ startedAt: d.toISOString(), durationSeconds });
    });
}

// ─── calcDailyFlowWaves ─────────────────────────────────────────────────────

describe('calcDailyFlowWaves', () => {
    it('returns hasEnoughData=false for fewer than 5 recent sessions', () => {
        const result = calcDailyFlowWaves(sessionsOverDays(3, 7));
        expect(result.hasEnoughData).toBe(false);
        expect(result.slots).toHaveLength(0);
    });

    it('returns hasEnoughData=true with at least 5 recent sessions', () => {
        const result = calcDailyFlowWaves(sessionsOverDays(10, 7));
        expect(result.hasEnoughData).toBe(true);
        expect(result.slots).toHaveLength(24);
    });

    it('identifies peakHour correctly', () => {
        const sessions: FlowSession[] = [];
        const now = new Date();
        // 5 sessions at hour 14 (large duration) and a few at other hours
        for (let i = 0; i < 5; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(14, 0, 0, 0);
            sessions.push(makeSession({ startedAt: d.toISOString(), durationSeconds: 3600 }));
        }
        for (let i = 0; i < 5; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(9, 0, 0, 0);
            sessions.push(makeSession({ startedAt: d.toISOString(), durationSeconds: 600 }));
        }
        const result = calcDailyFlowWaves(sessions);
        expect(result.hasEnoughData).toBe(true);
        expect(result.peakHour).toBe(14);
    });

    it('slots array has exactly 24 entries when data is sufficient', () => {
        const result = calcDailyFlowWaves(sessionsOverDays(10, 7));
        expect(result.slots).toHaveLength(24);
        result.slots.forEach(slot => {
            expect(slot.hour).toBeGreaterThanOrEqual(0);
            expect(slot.hour).toBeLessThan(24);
        });
    });
});

// ─── calcWeeklyWorkTime ──────────────────────────────────────────────────────

describe('calcWeeklyWorkTime', () => {
    it('returns 7 days', () => {
        const result = calcWeeklyWorkTime([]);
        expect(result.days).toHaveLength(7);
    });

    it('calculates correct totalMinutes for today', () => {
        const todayAt10 = new Date();
        todayAt10.setHours(10, 0, 0, 0);
        const session = makeSession({ startedAt: todayAt10.toISOString(), durationSeconds: 3600 }); // 60 min
        const result = calcWeeklyWorkTime([session]);
        const todayStr = todayAt10.toISOString().slice(0, 10);
        const todayDay = result.days.find(d => d.date === todayStr);
        expect(todayDay?.totalMinutes).toBe(60);
    });

    it('weekTotalMinutes is sum of all days', () => {
        const sessions = sessionsOverDays(5, 5, 1800); // 5 x 30 min = 150 within current week
        const result = calcWeeklyWorkTime(sessions);
        expect(result.weekTotalMinutes).toBe(result.days.reduce((s, d) => s + d.totalMinutes, 0));
    });

    it('hasEnoughData is false when no sessions in week', () => {
        // Sessions from 60 days ago — not in this week
        const old = new Date();
        old.setDate(old.getDate() - 60);
        const session = makeSession({ startedAt: old.toISOString() });
        const result = calcWeeklyWorkTime([session]);
        expect(result.hasEnoughData).toBe(false);
    });
});

// ─── calcFocusDensity ────────────────────────────────────────────────────────

describe('calcFocusDensity', () => {
    it('returns hasEnoughData=false with no sessions today', () => {
        const old = new Date();
        old.setDate(old.getDate() - 1);
        const result = calcFocusDensity([makeSession({ startedAt: old.toISOString() })]);
        expect(result.hasEnoughData).toBe(false);
        expect(result.percentage).toBe(0);
    });

    it('returns 100% for a single session today', () => {
        const today = todayStr();
        const result = calcFocusDensity([makeSession({ startedAt: `${today}T12:00:00.000Z` })]);
        expect(result.hasEnoughData).toBe(true);
        expect(result.percentage).toBe(100);
        expect(result.label).toBe('sharp');
    });

    it('returns "sharp" label when density >= 80%', () => {
        // Two consecutive sessions with minimal gap → high density
        const start1 = new Date();
        start1.setHours(9, 0, 0, 0);
        const end1 = new Date(start1.getTime() + 30 * 60 * 1000);
        const start2 = new Date(end1.getTime() + 1 * 60 * 1000); // 1 min gap
        const end2 = new Date(start2.getTime() + 30 * 60 * 1000);

        const s1 = makeSession({ startedAt: start1.toISOString(), endedAt: end1.toISOString(), durationSeconds: 1800 });
        const s2 = makeSession({ startedAt: start2.toISOString(), endedAt: end2.toISOString(), durationSeconds: 1800 });
        const result = calcFocusDensity([s1, s2]);
        expect(result.hasEnoughData).toBe(true);
        expect(result.label).toBe('sharp');
    });
});

// ─── calcResistancePoint ─────────────────────────────────────────────────────

describe('calcResistancePoint', () => {
    it('returns hasEnoughData=false for fewer than 10 sessions', () => {
        const result = calcResistancePoint(sessionsOverDays(5, 5));
        expect(result.hasEnoughData).toBe(false);
    });

    it('returns a resistanceMinute for 10+ sessions', () => {
        const result = calcResistancePoint(sessionsOverDays(15, 10, 1800));
        expect(result.hasEnoughData).toBe(true);
        expect(result.resistanceMinute).toBeGreaterThan(0);
    });

    it('last7DaysSessions contains only sessions from last 7 days', () => {
        const sessions = sessionsOverDays(15, 10, 1800);
        const result = calcResistancePoint(sessions);
        result.last7DaysSessions.forEach(s => {
            const d = new Date(s.date);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            expect(d.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
        });
    });
});

// ─── calcNaturalFlowWindow ────────────────────────────────────────────────────

describe('calcNaturalFlowWindow', () => {
    it('returns hasEnoughData=false for fewer than 20 sessions', () => {
        const result = calcNaturalFlowWindow(sessionsOverDays(10, 10));
        expect(result.hasEnoughData).toBe(false);
    });

    it('returns buckets and dominant window for 20+ sessions', () => {
        const result = calcNaturalFlowWindow(sessionsOverDays(25, 14));
        expect(result.hasEnoughData).toBe(true);
        expect(result.buckets.length).toBeGreaterThan(0);
        expect(result.dominantWindowEnd).toBeGreaterThan(result.dominantWindowStart);
    });

    it('at least one bucket is marked isDominant', () => {
        const result = calcNaturalFlowWindow(sessionsOverDays(25, 14));
        const dominant = result.buckets.filter(b => b.isDominant);
        expect(dominant.length).toBeGreaterThan(0);
    });
});

// ─── calcFlowStreak ────────────────────────────────────────────────────────

describe('calcFlowStreak', () => {
    it('returns hasEnoughData=false for fewer than 3 sessions', () => {
        const result = calcFlowStreak(sessionsOverDays(2, 2));
        expect(result.hasEnoughData).toBe(false);
    });

    it('returns 30 entries in last30Days', () => {
        const result = calcFlowStreak(sessionsOverDays(10, 10));
        expect(result.last30Days).toHaveLength(30);
    });

    it('currentStreak is 0 when no sessions today/yesterday', () => {
        // All sessions from 15+ days ago
        const oldSessions = Array.from({ length: 5 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (15 + i));
            d.setHours(10, 0, 0, 0);
            return makeSession({ startedAt: d.toISOString() });
        });
        const result = calcFlowStreak(oldSessions);
        expect(result.currentStreak).toBe(0);
    });
});

// ─── calcTaskFlowHarmony ──────────────────────────────────────────────────────

describe('calcTaskFlowHarmony', () => {
    it('returns hasEnoughData=false for fewer than 10 tagged sessions', () => {
        const sessions = sessionsOverDays(5, 5).map(s => ({ ...s, taskId: 'task-1' }));
        const tasks: TaskDto[] = [{ id: 'task-1', userId: 'u', title: 'T1', description: '', status: 'todo', totalFocusedTime: 0, order: 0, isArchived: false, isDaily: false, lastResetDate: '', createdAt: '', updatedAt: '', completedAt: null }];
        const result = calcTaskFlowHarmony(sessions, tasks);
        expect(result.hasEnoughData).toBe(false);
    });

    it('returns top 10 items for sufficient tagged sessions', () => {
        const taskIds = ['t1', 't2', 't3'];
        const sessions = sessionsOverDays(15, 7).map((s, i) => ({
            ...s,
            taskId: taskIds[i % 3],
            taskTitle: `Task ${taskIds[i % 3]}`,
        }));
        const tasks: TaskDto[] = taskIds.map(id => ({
            id, userId: 'u', title: `Task ${id}`, description: '', status: 'todo' as const,
            totalFocusedTime: 0, order: 0, isArchived: false, isDaily: false, lastResetDate: '', createdAt: '', updatedAt: '', completedAt: null,
        }));
        const result = calcTaskFlowHarmony(sessions, tasks);
        expect(result.hasEnoughData).toBe(true);
        expect(result.items.length).toBeGreaterThan(0);
        // sorted descending by totalFocusMinutes
        for (let i = 0; i < result.items.length - 1; i++) {
            expect(result.items[i].totalFocusMinutes).toBeGreaterThanOrEqual(result.items[i + 1].totalFocusMinutes);
        }
    });

    it('untagged sessions are excluded', () => {
        const tagged = sessionsOverDays(10, 7).map(s => ({ ...s, taskId: 'task-x' }));
        const untagged = sessionsOverDays(5, 5); // taskId: null
        const all = [...tagged, ...untagged];
        const tasks: TaskDto[] = [{ id: 'task-x', userId: 'u', title: 'X', description: '', status: 'todo', totalFocusedTime: 0, order: 0, isArchived: false, isDaily: false, lastResetDate: '', createdAt: '', updatedAt: '', completedAt: null }];
        const result = calcTaskFlowHarmony(all, tasks);
        expect(result.hasEnoughData).toBe(true);
        expect(result.items).toHaveLength(1);
    });
});

// ─── calcWarmupPhase ──────────────────────────────────────────────────────────

describe('calcWarmupPhase', () => {
    it('returns hasEnoughData=false for fewer than 30 successful sessions', () => {
        const result = calcWarmupPhase(sessionsOverDays(20, 14, 1800)); // 30 min >= 20 min threshold
        expect(result.hasEnoughData).toBe(false);
    });

    it('returns avgWarmupMinutes > 0 for 30+ successful sessions with low variance', () => {
        // 35 sessions all exactly 40 minutes → very low variance
        const sessions = sessionsOverDays(35, 14, 2400);
        const result = calcWarmupPhase(sessions);
        expect(result.hasEnoughData).toBe(true);
        expect(result.avgWarmupMinutes).toBeGreaterThan(0);
    });

    it('sessions under 20 minutes are excluded', () => {
        // 30 sessions at 10 min (below threshold) → not enough successful sessions
        const short = sessionsOverDays(30, 14, 600); // 10 min
        const result = calcWarmupPhase(short);
        expect(result.hasEnoughData).toBe(false);
    });
});

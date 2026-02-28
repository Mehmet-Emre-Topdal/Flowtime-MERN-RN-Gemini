import {
    toolGetSessionsSummary,
    toolGetHourlyDistribution,
    toolComparePeriods,
    toolGetWeekdayStats,
} from './sessionMetrics';
import {
    toolGetTopTasks,
    toolGetTaskFocusByName,
    toolGetCompletedTasks,
    toolGetWorkedTasks,
} from './taskMetrics';
import {
    toolGetStreak,
    toolGetResistancePoint,
    toolGetLongestSession,
    toolGetWarmupDuration,
} from './behaviorMetrics';

/**
 * Gemini'nin istediği tool adını çalıştırır ve sonucu döner.
 * Yeni tool eklenirken buraya case, assistantTools.ts'e declaration,
 * ve ilgili metrics dosyasına fonksiyon eklenir.
 */
export async function executeToolCall(
    name: string,
    args: Record<string, unknown>,
    userId: string,
): Promise<unknown> {
    console.log('[ToolExecutor] Executing tool:', name, 'args:', JSON.stringify(args));

    switch (name) {
        case 'get_sessions_summary': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetSessionsSummary(userId, startDate, endDate);
        }
        case 'get_top_tasks': {
            const { startDate, endDate, limit, order = 'desc' } = args as {
                startDate: string; endDate: string; limit: number; order?: 'asc' | 'desc';
            };
            const parsed = Math.floor(Number(limit));
            const safeLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
            return toolGetTopTasks(userId, startDate, endDate, safeLimit, order);
        }
        case 'get_hourly_distribution': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetHourlyDistribution(userId, startDate, endDate);
        }
        case 'compare_periods': {
            const { period1Start, period1End, period2Start, period2End } = args as {
                period1Start: string; period1End: string;
                period2Start: string; period2End: string;
            };
            return toolComparePeriods(userId, period1Start, period1End, period2Start, period2End);
        }
        case 'get_streak':
            return toolGetStreak(userId);
        case 'get_resistance_point': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetResistancePoint(userId, startDate, endDate);
        }
        case 'get_longest_session': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetLongestSession(userId, startDate, endDate);
        }
        case 'get_warmup_duration': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetWarmupDuration(userId, startDate, endDate);
        }
        case 'get_weekday_stats': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetWeekdayStats(userId, startDate, endDate);
        }
        case 'get_task_focus_by_name': {
            const { taskName, startDate, endDate } = args as {
                taskName: string; startDate: string; endDate: string;
            };
            return toolGetTaskFocusByName(userId, taskName, startDate, endDate);
        }
        case 'get_completed_tasks': {
            const { startDate, endDate } = args as { startDate: string; endDate: string };
            return toolGetCompletedTasks(userId, startDate, endDate);
        }
        case 'get_worked_tasks': {
            const { startDate, endDate, limit } = args as {
                startDate: string; endDate: string; limit?: number;
            };
            return toolGetWorkedTasks(userId, startDate, endDate, limit ? Number(limit) : undefined);
        }
        default:
            return { error: `Unknown tool: ${name}` };
    }
}

import { getDateString } from './dateHelpers';
import { STREAK_LOOKBACK_DAYS } from '../config/constants';

export interface StreakCalculation {
    currentStreak: number;
    recordStreak: number;
}

/**
 * Günlük skor haritası ve eşik değerinden mevcut ve rekor streak'i hesaplar.
 * Her iki analitik modülü tarafından paylaşılan tek kaynak.
 *
 * @param dailyScores - Tarih (YYYY-MM-DD) → toplam odak dakikası haritası
 * @param threshold   - Bir günün "dolu" sayılması için minimum skor
 */
export function calculateStreaks(
    dailyScores: Record<string, number>,
    threshold: number,
): StreakCalculation {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugünden geriye doğru mevcut streak
    let currentStreak = 0;
    for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const score = dailyScores[getDateString(d)] || 0;
        if (score >= threshold && threshold > 0) currentStreak++;
        else break;
    }

    // Tüm kayıtlı tarihler üzerinden rekor streak
    let recordStreak = 0;
    let tempStreak = 0;
    const allDates = Object.keys(dailyScores).sort();

    if (allDates.length > 0) {
        const iter = new Date(allDates[0]);
        const last = new Date(allDates[allDates.length - 1]);
        while (iter <= last) {
            const score = dailyScores[getDateString(iter)] || 0;
            if (score >= threshold && threshold > 0) {
                tempStreak++;
                recordStreak = Math.max(recordStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
            iter.setDate(iter.getDate() + 1);
        }
    }

    return { currentStreak, recordStreak };
}

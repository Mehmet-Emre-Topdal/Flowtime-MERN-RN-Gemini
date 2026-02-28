import { Type } from '../lib/gemini';
import type { Tool } from '../lib/gemini';

/**
 * Gemini function-calling için tool tanımlarının tek kaynağı.
 * Her yeni tool buraya, executor'a ve metricFunctions'a eklenir.
 */
export const ASSISTANT_TOOLS: Tool[] = [{
    functionDeclarations: [
        {
            name: 'get_sessions_summary',
            description: 'Belirli bir tarih aralığındaki odak oturumlarının özetini döndürür. Toplam süre, oturum sayısı, ortalama süre ve dağılım bilgisi içerir.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD formatında. Örnek: 2025-01-01' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD formatında. Örnek: 2025-01-20' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_top_tasks',
            description: 'Belirli tarih aralığında görevleri odaklanma süresine göre sıralar. Her görev için totalFocusMinutes, sessionCount ve averageSessionMinutes döner.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                    limit: { type: Type.NUMBER, description: 'Kaç görev dönsün.' },
                    order: { type: Type.STRING, description: '"desc" = en çok odaklanılan, "asc" = en az odaklanılan' },
                },
                required: ['startDate', 'endDate', 'limit'],
            },
        },
        {
            name: 'get_hourly_distribution',
            description: 'Günün hangi saatlerinde daha verimli çalışıldığını gösterir.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'compare_periods',
            description: 'İki farklı zaman dilimini karşılaştırır.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    period1Start: { type: Type.STRING, description: 'Birinci dönem başlangıç tarihi YYYY-MM-DD' },
                    period1End: { type: Type.STRING, description: 'Birinci dönem bitiş tarihi YYYY-MM-DD' },
                    period2Start: { type: Type.STRING, description: 'İkinci dönem başlangıç tarihi YYYY-MM-DD' },
                    period2End: { type: Type.STRING, description: 'İkinci dönem bitiş tarihi YYYY-MM-DD' },
                },
                required: ['period1Start', 'period1End', 'period2Start', 'period2End'],
            },
        },
        {
            name: 'get_streak',
            description: 'Kullanıcının mevcut akış serisini ve kişisel rekor serisini döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {},
                required: [],
            },
        },
        {
            name: 'get_weekday_stats',
            description: 'Haftanın günlerine göre odaklanma dağılımını döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_resistance_point',
            description: 'Kullanıcının doğal oturum süresi tatlı noktasını döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_longest_session',
            description: 'Belirli tarih aralığındaki en uzun odak oturumunu ve tarihini döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_warmup_duration',
            description: 'Kullanıcının verimli oturumlara ulaşmak için geçirdiği ortalama ısınma süresini döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_task_focus_by_name',
            description: 'Belirli bir görevin adına göre o göreve harcanan odaklanma süresini döndürür.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    taskName: { type: Type.STRING, description: 'Aranacak görev adı veya bir kısmı' },
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['taskName', 'startDate', 'endDate'],
            },
        },
        {
            name: 'get_completed_tasks',
            description: 'Belirli tarih aralığında tamamlanan görevleri listeler.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                },
                required: ['startDate', 'endDate'],
            },
        },
        {
            name: 'get_worked_tasks',
            description: 'Belirli tarih aralığında üzerinde çalışılan görevleri, harcanan toplam odak süreleri ve güncel durumlarıyla listeler. Kullanıcı "hangi görevlerde çalıştım", "ne üzerine çalıştım", "görev listesi" gibi sorular sorduğunda kullan. limit belirtilmezse tüm görevler döner.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    startDate: { type: Type.STRING, description: 'Başlangıç tarihi YYYY-MM-DD' },
                    endDate: { type: Type.STRING, description: 'Bitiş tarihi YYYY-MM-DD' },
                    limit: { type: Type.NUMBER, description: 'Kaç görev dönsün. Kullanıcı sayı belirtmezse bu parametreyi gönderme.' },
                },
                required: ['startDate', 'endDate'],
            },
        },
    ],
}];

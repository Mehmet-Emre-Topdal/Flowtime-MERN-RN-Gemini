import { z } from 'zod';

// Ortak / Paylaşılan Türler
const isoDateString = z.string().datetime({ message: 'Lütfen geçerli bir ISO-8601 tarih formatı gönderin' });
const stringMessage = 'Lütfen geçerli bir metin girin';

// ─── Tasks (Görevler) ──────────────────────────────────────────

export const createTaskSchema = z.object({
    body: z.object({
        task: z.object({
            title: z.string().min(1, 'Başlık boş bırakılamaz'),
            description: z.string().optional(),
            isDaily: z.boolean().optional(),
        }),
        order: z.number().int().min(0, 'Sıra pozitif olmalıdır'),
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Başlık boş bırakılamaz').optional(),
        description: z.string().optional(),
        isDaily: z.boolean().optional(),
        status: z.enum(['todo', 'in-progress', 'done']).optional(),
        additionalMinutes: z.number().nonnegative().optional(),
        order: z.number().int().nonnegative().optional(),
    }),
});

// ─── Sessions (Oturumlar) ──────────────────────────────────────

export const createSessionSchema = z.object({
    body: z.object({
        startedAt: isoDateString,
        endedAt: isoDateString,
        durationSeconds: z.number().positive('durationSeconds must be a positive number'),
        breakDurationSeconds: z.number().nonnegative().default(0),
        taskId: z.string().nullable().optional(),
        taskTitle: z.string().nullable().optional(),
    }).refine((data) => new Date(data.endedAt) > new Date(data.startedAt), {
        message: 'endedAt must be after startedAt',
        path: ['endedAt'],
    }),
});

// ─── User Configs (Kullanıcı Ayarları) ──────────────────────────

export const updateUserConfigSchema = z.object({
    body: z.object({
        intervals: z.array(z.number().positive()).min(1, 'intervals are required'),
        dailyGoalMinutes: z.number().positive().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.enum(['tr', 'en']).optional(),
        notificationsEnabled: z.boolean().optional(),
        soundEnabled: z.boolean().optional(),
        autoStartBreaks: z.boolean().optional(),
        autoStartPomodoros: z.boolean().optional(),
    }),
});

// ─── Chat History (Mesajlar) ────────────────────────────────────

export const updateChatHistorySchema = z.object({
    body: z.object({
        messages: z.array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string().min(1, stringMessage),
                timestamp: isoDateString,
            })
        ),
        summary: z.string().nullable().optional(),
    }),
});

// ─── Assistant Chat ─────────────────────────────────────────────

export const chatAssistantSchema = z.object({
    body: z.object({
        message: z.string().optional(), // İlk oturumda mesaj boş olabilir (Welcome mesajı için)
        conversationHistory: z.array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string(),
                timestamp: isoDateString.optional(),
            })
        ).optional().default([]),
        conversationSummary: z.string().nullable().optional(),
        language: z.enum(['tr', 'en']).optional().default('tr'),
    }).refine((data) => {
        // Eğer message boş ise bu bir başlangıç (welcome) çağrısıdır,
        // Ancak message verilmemiş ama geçmişte veri yollanmışsa bu anlamsızdır.
        if (!data.message && data.conversationHistory.length > 0) return false;
        return true;
    }, {
        message: 'Message is required unless initiating a new conversation',
        path: ['message']
    })
});

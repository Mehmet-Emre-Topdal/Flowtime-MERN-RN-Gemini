import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { callGemini, callGeminiWithTools } from '../lib/gemini';
import { checkRateLimit, incrementUsage } from '../middleware/rateLimit';
import { ASSISTANT_TOOLS } from '../config/assistantTools';
import { executeToolCall } from '../utils/toolExecutor';
import { validateRequest } from '../middleware/validate';
import { chatAssistantSchema } from '../schemas';
import { z } from 'zod';
import { buildSystemPrompt, SUMMARY_PROMPT } from '../utils/assistantPrompts';
import { CONVERSATION_HISTORY_LIMIT } from '../config/constants';
import type { ChatMessage, ChatResponse } from '../types/assistant';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// ─── Welcome Message Handler ────────────────────────────────

const WELCOME_MESSAGES: Record<string, string> = {
    tr: `Merhaba! 👋 Ben Flowtime yapay zeka asistanıyım. Beni odaklanma verilerini analiz etmek, verimliliğini artırmak ve akış halini derinleştirmek için kullanabilirsin. Ne merak ediyorsun?`,
    en: `Hello! 👋 I'm Flowtime's AI assistant. You can use me to analyze your focus data, boost your productivity, and deepen your flow state. What would you like to know?`,
};

async function handleWelcome(language: string = 'tr'): Promise<ChatResponse> {
    const welcomeMessage = WELCOME_MESSAGES[language] ?? WELCOME_MESSAGES['en'];

    return {
        reply: welcomeMessage,
        updatedHistory: [{
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date().toISOString(),
        }],
        updatedSummary: null,
    };
}

// ─── POST /api/assistant/chat ────────────────────────────────

router.post('/chat', authMiddleware, validateRequest(chatAssistantSchema), asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;

    const { message, conversationHistory = [], conversationSummary = null, language = 'tr' } = req.body as z.infer<typeof chatAssistantSchema>['body'];
    console.log('[Chat API] Message:', message ? message.substring(0, 100) : 'NONE (welcome)');
    console.log('[Chat API] History length:', conversationHistory.length);

    // Welcome: ilk açılışta mesaj ve geçmiş yoktur
    if (!message && conversationHistory.length === 0) {
        const welcomeResponse = await handleWelcome(language);
        res.status(200).json(welcomeResponse);
        return;
    }

    const { allowed, remaining } = checkRateLimit(userId);
    console.log('[Chat API] Rate limit - allowed:', allowed, 'remaining:', remaining);
    if (!allowed) {
        res.status(429).json({
            error: 'rate_limit',
            reply: 'Bugünkü asistan limitine ulaştın, yarın devam edebiliriz. 🌙',
            updatedHistory: conversationHistory,
            updatedSummary: conversationSummary,
        });
        return;
    }

    const systemPrompt = buildSystemPrompt(conversationSummary, language);

    const historyForLLM = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
    }));

    const safeMessage = message ?? '';

    const assistantReply = await callGeminiWithTools(
        systemPrompt,
        safeMessage,
        historyForLLM,
        ASSISTANT_TOOLS,
        (name, args) => executeToolCall(name, args, userId),
    );

    const now = new Date().toISOString();
    const updatedHistory: ChatMessage[] = [
        ...conversationHistory.map(h => ({ ...h, timestamp: h.timestamp ?? now })),
        // Sadece message varsa history'ye user mesajını ekle
        ...(safeMessage ? [{ role: 'user' as const, content: safeMessage, timestamp: now }] : []),
        { role: 'assistant' as const, content: assistantReply, timestamp: now },
    ];

    // Konuşma limiti aşınca eskiler özetlenir
    let updatedSummary = conversationSummary;
    if (updatedHistory.length > CONVERSATION_HISTORY_LIMIT) {
        const oldMessages = updatedHistory.slice(0, updatedHistory.length - CONVERSATION_HISTORY_LIMIT);
        const oldConversationText = oldMessages
            .map((m: ChatMessage) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`)
            .join('\n');

        const summaryInput = conversationSummary
            ? `Önceki özet: ${conversationSummary}\n\nYeni mesajlar:\n${oldConversationText}`
            : oldConversationText;

        try {
            updatedSummary = await callGemini(SUMMARY_PROMPT, summaryInput);
        } catch {
            console.warn('[Chat API] Summarization failed, keeping old summary');
        }

        incrementUsage(userId);
        res.status(200).json({
            reply: assistantReply,
            updatedHistory: updatedHistory.slice(-CONVERSATION_HISTORY_LIMIT),
            updatedSummary,
        });
        return;
    }

    incrementUsage(userId);
    res.status(200).json({ reply: assistantReply, updatedHistory, updatedSummary });
}));

export default router;

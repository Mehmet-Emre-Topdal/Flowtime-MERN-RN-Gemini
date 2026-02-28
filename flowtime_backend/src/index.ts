import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

import tasksRouter from './routes/tasks';
import sessionsRouter from './routes/sessions';
import userConfigsRouter from './routes/userConfigs';
import chatHistoryRouter from './routes/chatHistory';
import assistantRouter from './routes/assistant';
import analyticsRouter from './routes/analytics';
import { globalErrorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:8081'];

app.use(helmet());
app.use(cors({
    origin: allowedOrigins,
}));
app.use(express.json());

// Global Rate Limiter: 15 dakika içinde her IP'den maksimum 100 istek alınabilir.
// (Giriş/Çıkış veya brute-force ataklarını engellemek için)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // Her IP için 15 dakikada en fazla 100 istek
    message: { error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' },
    standardHeaders: true, // `RateLimit-*` header'larını döndürür
    legacyHeaders: false, // `X-RateLimit-*` header'larını kapatır
});

// Rate limiter'ı tüm `/api/` rotalarına uygula
app.use('/api/', apiLimiter);

// Health Check Endpoint - For Docker / AWS / Kubernetes readiness probes
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/user-configs', userConfigsRouter);
app.use('/api/chat-history', chatHistoryRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/analytics', analyticsRouter);

// Global Error Handler'ı her zaman ROUTE TANIMLAMALARINDAN SONRA eklemeliyiz.
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`[Server] Flowtime Backend running on http://localhost:${PORT}`);
});

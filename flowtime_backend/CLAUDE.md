# CLAUDE.md - Flowtime Backend Guide

## Proje Özeti
Flowtime üretkenlik platformunun ana REST API sunucusu. Express.js ve TypeScript ile geliştirilmiştir. Görev yönetimi, odaklanma oturumlarının takibi, analitik veri hesaplamaları ve yapay zeka (Gemini AI) entegrasyonlarını yönetir.

## Teknolojiler (Tech Stack)
- **Framework:** Express.js + Node.js
- **Dil:** TypeScript
- **Veritabanı ve Kimlik Doğrulama:** Firebase Admin SDK (Firestore & Firebase Auth)
- **Validasyon:** Zod
- **Yapay Zeka:** Google GenAI (Gemini)
- **Güvenlik/Performans:** Helmet, CORS, Express-Rate-Limit

## Önemli Komutlar
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (Nodemon ile)
npm run dev

# Projeyi derle (TypeScript -> JavaScript)
npm run build

# Derlenmiş production sürümünü başlat
npm start

# Testleri çalıştır
npm test
```

## Mimari & Kod Standartları

1. **AsyncHandler Kullanımı:** `try-catch` bloklarını Route seviyesinde kullanmaktan kaçının. Bunun yerine tüm senkron ve asenkron hataları yakalayan, `src/utils/asyncHandler.ts` üzerinden `asyncHandler` wrapper'ı kullanın.
2. **Global Error Handling:** Asenkron rotalarda veya middleware'de meydana gelen hatalar `src/middleware/errorHandler.ts` üzerinden geçmelidir. Rotalardan direkt JSON hata döndürmemeye çalışın.
3. **Data Doğrulama:** Tüm `POST` ve `PUT` endpoint'leri için, Zod kullanılarak tanımlanmış `validateRequest` ara yazılımından (middleware) yararlanın (`src/schemas`).
4. **Security & Rate Limit:** Bütün `/api/*` istekleri 15 dakikada 100 istek (`rateLimit`) sınırı altındadır.
5. **Firebase Config:** Veritabanı ve Authenticate işlemleri yalnızca `src/config/firebase.ts` üzerindeki admin objeleri (`adminDb`, `adminAuth`) ile yapılmalıdır.

## Klasör Yapısı
- `src/config`: Sabitler, Firebase konfigürasyonları ve AI araçları
- `src/middleware`: Auth, Validation, RateLimit, ve Hata yönetimi (Error Handler)
- `src/routes`: Express router yapıları (tasks, sessions, analytics, vs.)
- `src/schemas`: Zod schema validasyon doğrulamaları
- `src/types`: TypeScript interface ve type tanımlamaları
- `src/utils`: Firebase helper'ları, tarih yardımcıları, asyncHandler ve analitik matematiksel fonksiyonlar

## Ortam Değişkenleri (.env Gerekli Alanlar)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `PORT` (Opsiyonel, varsayılan: 3001)
- `CORS_ORIGINS` (Opsiyonel, örn: "http://localhost:3000,https://benim-site.com")

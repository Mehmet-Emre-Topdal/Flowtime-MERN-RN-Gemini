# CLAUDE.md - Flowtime Frontend (Web) Guide

## Proje Özeti
Flowtime üretkenlik uygulamasının ana web arayüzüdür. Next.js ile oluşturulmuştur. Kanban board, odaklanma sayacı (timer), analitik ekranı ve kişiselleştirilmiş AI asistan barındırır.

## Teknolojiler (Tech Stack)
- **Framework:** Next.js (Web Framework) + React
- **Dil:** TypeScript
- **State Management:** Redux Toolkit (RTK Query ile API veri çekimi)
- **Stil & UI:** Tailwind CSS, PrimeReact, Framer Motion
- **Sürükle-Bırak (Drag & Drop):** dnd-kit
- **Bağımlı Servisler:** Firebase Client SDK (Auth)

## Önemli Komutlar
```bash
# Bağımlılıkları yükle
npm install

# Geliştirme ortamında (Dev) başlat
npm run dev

# Production sürümü için derle (Build)
npm run build

# Derlenmiş projeyi başlat
npm start

# Kod standartlarını tara (Linting)
npm run lint

# Testleri çalıştır
npm test
```

## Mimari & Kod Standartları

1. **RTK Query İle Veri Yönetimi:** Frontend uygulamasındaki veritabanı iletişimi (Backend Express uygulamasına) `src/store/api/baseApi.ts` tabanlı RTK Query yapısıyla olmalıdır. Verileri Component içinden `fetch` komutuyla doğrudan çekmek yerine API Hook'larını (`useGetTasksQuery` gibi) kullanın.
2. **Component Yapısı:**
   - Sayfa ana çatıları (Pages/Layouts) iş katmanından (Business Logic) mümkün olduğunca bağımsızdır.
   - `src/features/` dizini altındaki modüler yapıyı (analytics, assistant, kanban, vb.) tercih edin.
3. **Temiz Kod (Clean Code):** Yorum satırı kullanmak yerine, kendini ifade eden fonksiyon ve component isimlendirmeleri (Self-Documenting Code) tercih edin.
4. **Tip Güvenliği:** Strict TypeScript yapılarına uygun hareket edin. `any` kesinlikle yasaktır, her türlü prop ve geri dönüş tipini belirtin.

## Klasör Yapısı (Feature-Based)
```text
src/
 ├─ app/ or pages/       # Next.js rotaları
 ├─ components/          # Global UI bileşenleri
 ├─ features/            # Modül tabanlı bileşenler (Analytics, Kanban vs)
 │    └─ {featureName}/
 │         ├─ api/       # İlgili özelliğin RTK Query endpointleri
 │         ├─ components/# İlgili özelliğin bileşenleri
 ├─ lib/                 # Üçüncü parti servis bağlantıları (Firebase vs.)
 ├─ store/               # Redux store ve Base RTK yapılandırması
 ├─ types/               # TS arayüzleri
 └─ utils/               # Uygulama genelindeki yardımcı fonksiyonlar
```

## Ortam Değişkenleri (.env Gerekli Alanlar)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_BACKEND_URL` (Opsiyonel, varsayılan local backend: http://localhost:3001)

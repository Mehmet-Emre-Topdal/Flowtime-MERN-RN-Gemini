# CLAUDE.md - Flowtime Mobile App Guide

## Proje Özeti
React Native ve Expo framework'ü kullanılarak yazılmış Flowtime Mobil uygulaması. Görev yönetimi, odaklanma modları, ve yapay zeka asistanının taşınabilir (iOS/Android) sürümüdür.

## Teknolojiler (Tech Stack)
- **Framework:** React Native + Expo
- **Dil:** TypeScript
- **State Yönetimi:** Redux Toolkit + RTK Query
- **Bağımlı Servisler:** Firebase Auth (@react-native-async-storage destekli)
- **UI & Navigasyon:** React Navigation, Native Component'ler

## Önemli Komutlar
```bash
# Bağımlılıkları yükle
npm install

# Expo Metro geliştirme sunucusunu başlat
npm start

# Android ortamında derle ve başlat
npm run android

# iOS simulatoründe başlat (Sadece macOS)
npm run ios

# Web ortamında test et (Tarayıcıda Expo)
npm run web
```

## Mimari & Kod Standartları

1. **API ve İletişim:** Web uygulamasındaki gibi `src/store/api/baseApi.ts` bazlı Redux RTK Query kullanılmalıdır.
2. **Environment (Ortam) Yönetimi:** API URL'i `EXPO_PUBLIC_API_URL` olarak tutulur. Local test için PC'nizin yerel ağ adresine (`192.168.x.x`) yönlendirilmelidir çünkü telefon emulator'ü `localhost` diyerek bilgisayarınıza ulaşamaz. Firebase için de aynı şekilde `EXPO_PUBLIC_...` prefix'i kullanılmalıdır.
3. **Persistance (Kalıcılık):** Oturum işlemleri için Native donanımda kayıt tutan `@react-native-async-storage/async-storage` kullanılır. Güvenli veya kalıcı verilerin tarayıcılardaki (`localStorage`) karşılığı budur.
4. **Build Stratejisi (EAS):** Canlıya build (.apk, .aab, .ipa) alırken, cihazınızdaki `.env` dosyası bulut sunucuya kopyalanmaz. `eas.json` yapısı veya EAS platformu üzerindeki `Secrets/Env Variables` kısmı ile üretim (production) keylerinizi tanımlamanız zaruridir.

## Ortam Değişkenleri (.env Gerekli Alanlar)
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_API_URL` (Örn: `http://192.168.1.xxx:3001/api` veya PRD URL'si)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

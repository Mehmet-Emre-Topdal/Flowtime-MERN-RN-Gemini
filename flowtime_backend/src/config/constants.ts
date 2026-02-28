/**
 * Uygulama genelinde kullanılan iş sabitleri.
 * Magic number yerine bu isimleri kullanın; değer değiştirmek gerekirse
 * tek bir yerde düzeltmek yeterlidir.
 * tek bir yerde düzeltmek yeterlidir.
 */

// ─── AI ve Asistan Sabitleri ─────────────────────────────────

/** Kullanıcının bir günde asistana gönderebileceği maksimum mesaj sayısı. */
export const AI_DAILY_LIMIT = 20;

/** Konuşma geçmişinin özetlenmeden önce tutulacağı maksimum mesaj sayısı. */
export const CONVERSATION_HISTORY_LIMIT = 10;

// ─── Veritabanı ve Fetch Sınırları ───────────────────────────

/** Firestore 'in' veya 'not-in' sorgularında dizide bulunabilecek maksimum eleman sayısı. */
export const FIRESTORE_IN_QUERY_LIMIT = 10;

// ─── Streak Sabitleri ────────────────────────────────────────

/** Geriye bakılan maksimum gün sayısı (mevcut streak hesaplaması). */
export const STREAK_LOOKBACK_DAYS = 90;

/** Streak hesabı için gereken minimum oturum sayısı. */
export const MIN_SESSIONS_FOR_STREAK = 3;

/**
 * Bir günün "dolu" sayılması için ortalama günlük skorun kaç katı olması gerektiği.
 * Örnek: 0.5 → ortalama*0.5 üzerindeyse o gün streak'e sayılır.
 */
export const STREAK_THRESHOLD_RATIO = 0.5;

// ─── Veri Yeterliliği Eşikleri ───────────────────────────────

/** Günlük akış dalgaları analizi için minimum oturum sayısı. */
export const MIN_SESSIONS_FOR_DAILY_WAVES = 5;

/** Direnç noktası / görev uyumu analizi için minimum oturum sayısı. */
export const MIN_SESSIONS_FOR_RESISTANCE = 10;

/** Doğal akış penceresi analizi için minimum oturum sayısı. */
export const MIN_SESSIONS_FOR_FLOW_WINDOW = 20;

/** Isınma faz analizi için minimum başarılı oturum sayısı (tam model). */
export const MIN_SESSIONS_FOR_WARMUP = 30;

/** Araç tabanlı ısınma hesabı için minimum başarılı oturum sayısı (basit model). */
export const MIN_SUCCESSFUL_SESSIONS_FOR_WARMUP = 10;

// ─── Oturum Kalitesi ─────────────────────────────────────────

/**
 * Bir oturumun "başarılı" sayılması için gereken minimum süre (dakika).
 * Bu eşiğin altındaki oturumlar ısınma hesabına dahil edilmez.
 */
export const MIN_SUCCESSFUL_SESSION_MINUTES = 20;

// ─── Isınma Faz Parametreleri ────────────────────────────────

/**
 * Ortalama oturum süresinin ısınma süresine oranı.
 * avgWarmup = avgSessionDuration * WARMUP_RATIO
 */
export const WARMUP_RATIO = 0.22;

/**
 * Isınma hesabı için kabul edilebilir maksimum varyasyon katsayısı.
 * Bu değerin üzerindeyse veri çok tutarsız sayılır ve hesaplama yapılmaz.
 */
export const WARMUP_CV_THRESHOLD = 0.6;

// ============================================================
// Service Worker — نسخة التخزين المؤقت (Cache)
// مهم جداً: كل مرة تبدل فيها index.html وتبغي التحديث يبان
// فوراً عند المستخدمين، زيدي رقم النسخة تحت (v1 -> v2 -> v3...)
// ============================================================
const CACHE_NAME = 'quiz-app-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // صفحة HTML: نجيبها دائماً من الإنترنت أولاً (Network-First)
  // هكذا أي تحديث تديريه فـ index.html يبان مباشرة عند المستخدم
  // بلا ما يبقى محاصر فـ نسخة قديمة مخزنة فالكاش
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // باقي الملفات (أيقونات، manifest): كاش أولاً، وإلا كاينش نجيبها من النت
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// نام کش (با هر بار تغییر، عدد آن را زیاد کنید تا کش قدیمی پاک شود)
const CACHE_NAME = 'info-day-v3';

// لیست فایل‌هایی که باید کش شوند
const urlsToCache = [
  '/',
  '/static/logo.png',
  '/static/logo-192.png',
  '/static/logo-512.png',
  '/static/manifest.json',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// ===== نصب Service Worker =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ کش باز شد');
        return cache.addAll(urlsToCache);
      })
  );
});

// ===== فعال‌سازی و پاکسازی کش‌های قدیمی =====
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('🗑️ کش قدیمی حذف شد:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ===== پاسخ به درخواست‌ها (از کش یا شبکه) =====
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر در کش بود، از کش برگردان (آفلاین)
        if (response) {
          return response;
        }
        // اگر نه، از شبکه بگیر و در کش ذخیره کن
        return fetch(event.request)
          .then(response => {
            // فقط پاسخ‌های معتبر را کش کن
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (e) {
                  // برخی درخواست‌ها قابل کش نیستند (مثل API)
                }
              });
            return response;
          })
          .catch(() => {
            // اگر آفلاین بود و چیزی در کش نبود، یک صفحه خطا نشان بده
            // می‌توانید یک صفحه آفلاین اختصاصی بسازید
            return new Response('⚠️ شما آفلاین هستید. لطفاً اتصال اینترنت را بررسی کنید.', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

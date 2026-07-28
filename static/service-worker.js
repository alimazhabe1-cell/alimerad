// ============================================================
//  Service Worker – کاملاً بهینه برای آفلاین
// ============================================================

const CACHE_NAME = 'info-day-v5';
const OFFLINE_URL = '/offline.html';  // صفحه آفلاین اختصاصی (اختیاری)

// فایل‌هایی که باید کش شوند (همه مسیرها مطلق از ریشه سایت)
const urlsToCache = [
  '/',
  '/static/logo.png',
  '/static/logo-192.png',
  '/static/logo-512.png',
  '/static/manifest.json',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// ===== نصب و کش کردن فایل‌ها =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ کش در حال ایجاد...');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ برخی فایل‌ها کش نشدند:', err);
        });
      })
      .then(() => self.skipWaiting())  // فعال‌سازی فوری سرویس‌ورکر جدید
  );
});

// ===== فعال‌سازی و پاکسازی کش‌های قدیمی =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ کش قدیمی حذف شد:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())  // کنترل فوری تمام تب‌ها
  );
});

// ===== پاسخ به درخواست‌ها (استراتژی Cache First) =====
self.addEventListener('fetch', event => {
  // درخواست‌های مربوط به API را از کش خارج می‌کنیم (داده‌ها را خودمان در localStorage ذخیره می‌کنیم)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;  // از کش برگردان
        }
        // اگر در کش نبود، از شبکه بگیر و کش کن
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (e) {}
              });
            return response;
          })
          .catch(() => {
            // در صورت خطای شبکه و عدم وجود کش، صفحه آفلاین نمایش داده شود
            return caches.match(OFFLINE_URL) || new Response(
              '⚠️ شما آفلاین هستید. لطفاً اتصال اینترنت را بررسی کنید.',
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
      })
  );
});

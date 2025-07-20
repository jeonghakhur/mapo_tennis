const CACHE_NAME = 'mapo-tennis-v1';
const urlsToCache = [
  '/',
  '/posts',
  '/tournaments',
  '/club',
  '/expenses',
  '/notifications',
  '/profile',
  '/manifest.json',
  '/icon.svg',
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    }),
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // GET 요청만 캐시 처리
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에서 찾으면 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크에서 가져오기
      return fetch(event.request).then((response) => {
        // 유효한 응답이 아니면 그대로 반환
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 정적 리소스만 캐시 (HTML, CSS, JS, 이미지 등)
        const url = new URL(event.request.url);
        const isStaticResource =
          url.pathname.startsWith('/_next/') ||
          url.pathname.startsWith('/static/') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.jpg') ||
          url.pathname.endsWith('.jpeg') ||
          url.pathname.endsWith('.gif') ||
          url.pathname.endsWith('.svg') ||
          url.pathname.endsWith('.ico') ||
          url.pathname.endsWith('.woff') ||
          url.pathname.endsWith('.woff2') ||
          url.pathname.endsWith('.ttf') ||
          url.pathname.endsWith('.eot');

        // API 요청은 캐시하지 않음
        const isApiRequest = url.pathname.startsWith('/api/');

        // 세션 관련 요청은 캐시하지 않음
        const isSessionRequest =
          url.pathname.startsWith('/api/auth/') ||
          url.search.includes('session') ||
          url.search.includes('token');

        if (isStaticResource && !isApiRequest && !isSessionRequest) {
          // 응답을 복제하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    }),
  );
});

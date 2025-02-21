const CACHE_NAME = 'sa-wallet-v1';

// Önbelleğe alınacak dosyalar
const urlsToCache = [
  '/',
  '/wallet',
  '/send',
  '/batch',
  '/chat',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Service Worker kurulumu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ağ isteklerini yakalama
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Önbellekte varsa, önbellekten döndür
        if (response) {
          return response;
        }

        // Önbellekte yoksa, ağdan al ve önbelleğe ekle
        return fetch(event.request).then(
          (response) => {
            // Geçersiz yanıt veya POST isteği ise önbelleğe alma
            if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method === 'POST') {
              return response;
            }

            // Yanıtı önbelleğe ekle
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
}); 
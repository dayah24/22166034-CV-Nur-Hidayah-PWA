const cacheName = 'portofolio-cache-v4';
const assets = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/image.jpg",
    "/icon-192x192.png",
    "/icon-512x512.png",
];

// Install event untuk cache semua assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('Service Worker: Caching assets');
            return cache.addAll(assets);
        })
    );

    self.skipWaiting();
});

// Fetch event untuk mengambil dari cache atau fallback ke network
self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching', event.request.url);

    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                return caches.open(cacheName).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => caches.match('/index.html'))
    );
});

// Activate event untuk membersihkan cache lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== cacheName).map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Event untuk menerima pesan dan menampilkan notifikasi ketika pesan "SHOW_NOTIFICATION" diterima
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        showNotification();
    }
});

// Fungsi untuk menampilkan notifikasi
function showNotification() {
    const title = 'Hallo';
    const options = {
        body: 'Selamat Datang di Web Portofolio Nur Hidayah. Terimakasih telah mengunjungi',
        icon: '/icon-192x192.png'
    };

    if (self.registration) {
        self.registration.showNotification(title, options);
    }
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://cv-nur-hidayah-pwa.vercel.app/')
    );
});

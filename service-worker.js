const cacheName = 'portfolio-cache-v3';
const assets = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/image/image.jpg",
    "/image/icon-192x192.png",
    "/image/icon-512x512.png",
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

    // Skip waiting agar Service Worker segera aktif
    self.skipWaiting();
});

// Fetch event untuk mengambil dari cache atau fallback ke network
self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching', event.request.url);

    if (event.request.method !== 'GET') {
        console.log('Service Worker: Non-GET request, bypassing cache');
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    console.log('Service Worker: Invalid network response', networkResponse);
                    return networkResponse;
                }

                return caches.open(cacheName).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            console.log('Service Worker: Fetch failed, returning offline page');
            return caches.match('/index.html');
        })
    );
});

// Activate event untuk membersihkan cache lama dan menampilkan notifikasi saat aktivasi
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== cacheName).map((name) => caches.delete(name))
            );
        }).then(() => {
            self.clients.claim();
            showNotification(); // Tampilkan notifikasi saat Service Worker diaktifkan
        })
    );
});

// Event untuk menangani pendaftaran aplikasi PWA dan menampilkan tombol Install
let deferredPrompt;
self.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // Mencegah prompt otomatis

    // Simpan event untuk dipicu nanti
    deferredPrompt = event;
    console.log("beforeinstallprompt event triggered");

    // Mengirimkan pesan ke halaman utama untuk menampilkan tombol Install
    self.clients.matchAll().then((clients) => {
        if (clients && clients.length) {
            clients[0].postMessage({ action: 'showInstallButton' });
        }
    });
});

// Fungsi untuk menampilkan notifikasi
function showNotification() {
    const title = 'Hallo';
    const options = {
        body: 'Selamat Datang di Web Portofolio Nur Hidayah. Terimakasih telah mengunjungi',
        icon: '/image/icon-192x192.png'
    };

    // Pastikan registration tersedia sebelum menampilkan notifikasi
    if (self.registration) {
        self.registration.showNotification(title, options);
    } else {
        console.log("Service Worker registration is not available.");
    }
}

// Event untuk menerima pesan dan menampilkan notifikasi ketika pesan "SHOW_NOTIFICATION" diterima
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        showNotification();
    }
});

// Menampilkan notifikasi ketika notifikasi diaktifkan oleh klik
self.addEventListener('notificationclick', event => {
    event.notification.close(); // Menutup notifikasi saat diklik
    event.waitUntil(
        clients.openWindow('https://github.com/dayah24/Portofolio-PWA/')
    );
});

const cacheName = 'portofolio-cache-v4'; // Ganti versi cache ini jika ingin memaksa pembaruan
const assets = [
    "/22166034-CV-Nur-Hidayah-PWA/",
    "/22166034-CV-Nur-Hidayah-PWA/index.html",
    "/22166034-CV-Nur-Hidayah-PWA/style.css",
    "/22166034-CV-Nur-Hidayah-PWA/app.js",
    "/22166034-CV-Nur-Hidayah-PWA/manifest.json",
    "/22166034-CV-Nur-Hidayah-PWA/image.jpg",
    "/22166034-CV-Nur-Hidayah-PWA/icon-192x192.png",
    "/22166034-CV-Nur-Hidayah-PWA/icon-512x512.png",
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
                // Pastikan respons jaringan valid sebelum menambahkannya ke cache
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                return caches.open(cacheName).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Menampilkan halaman offline jika fetch gagal dan cache tidak ada
            return caches.match('/portfolio-hidayah/index.html');
        })
    );
});

// Activate event untuk membersihkan cache lama
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== cacheName).map((name) => caches.delete(name))
            );
        }).then(() => {
            self.clients.claim();
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
        icon: '/22166034-CV-Nur-Hidayah-PWA/icon-192x192.png'
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
        clients.openWindow('https://dayah24.github.io/22166034-CV-Nur-Hidayah-PWA/')
    );
});

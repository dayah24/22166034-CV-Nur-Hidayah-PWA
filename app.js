document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.getElementById('menu-icon');
    const navbar = document.getElementById('navbar');
    const readMoreButton = document.getElementById('read-more');
    const aboutMeSection = document.getElementById('about-me');
    const aboutSection = document.getElementById('about');
    const backToAboutButton = document.getElementById('back-to-about');
    const contactForm = document.getElementById('contact-form');
    const installButton = document.getElementById('install-button'); // Tombol Install

    // Navbar toggle
    menuIcon.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // Show "About Me" section
    if (readMoreButton) {
        readMoreButton.addEventListener('click', (e) => {
            e.preventDefault();
            aboutSection.style.display = 'none';
            aboutMeSection.style.display = 'block';
            aboutMeSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Back to main "About" section
    if (backToAboutButton) {
        backToAboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            aboutMeSection.style.display = 'none';
            aboutSection.style.display = 'block';
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // IndexedDB untuk menyimpan assets
    let db;
    const request = indexedDB.open('portfolioDB', 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('assets')) {
            db.createObjectStore('assets', { keyPath: 'url' });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
    };

    // Menyimpan data ke IndexedDB
    function saveToIndexedDB(url, response) {
        const transaction = db.transaction(['assets'], 'readwrite');
        const store = transaction.objectStore('assets');
        store.put({ url, response });
    }

    // Mengambil data dari IndexedDB
    function loadFromIndexedDB(url) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['assets']);
            const store = transaction.objectStore('assets');
            const request = store.get(url);

            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result.response);
                } else {
                    reject('Data not found in IndexedDB');
                }
            };

            request.onerror = (event) => {
                reject('Error retrieving data from IndexedDB');
            };
        });
    }

    // IndexedDB untuk kontak
    const dbName = 'contactDB';
    const storeName = 'contacts';

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            };
        });
    }

    async function saveContact(contact) {
        const db = await initDB();
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.add(contact);
        return transaction.complete;
    }

    async function displayContacts() {
        const db = await initDB();
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const contacts = await store.getAll();

        const contactList = document.getElementById('contact-list');
        if (contactList) {
            contactList.innerHTML = '';
            contacts.forEach(contact => {
                const contactItem = document.createElement('div');
                contactItem.className = 'contact-item';
                contactItem.innerHTML = `
                    <h3>${contact.fullName}</h3>
                    <p><strong>Email:</strong> ${contact.email}</p>
                    <p><strong>Phone:</strong> ${contact.phone}</p>
                    <p><strong>Subject:</strong> ${contact.subject}</p>
                    <p><strong>Message:</strong> ${contact.message}</p>
                `;
                contactList.appendChild(contactItem);
            });
        }
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const contact = {
                fullName: document.getElementById('full-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
            };
            try {
                await saveContact(contact);
                alert('Contact saved successfully!');
                event.target.reset();
                displayContacts();
            } catch (error) {
                console.error('Failed to save contact:', error);
                alert('Failed to save contact.');
            }
        });
    }

    displayContacts();

    // Install App Event
    let deferredPrompt; // Menyimpan event sebelum prompt

    // Event sebelum prompt pemasangan PWA muncul
    window.addEventListener('beforeinstallprompt', (event) => {
        // Mencegah prompt otomatis
        event.preventDefault();
        deferredPrompt = event;
    
        // Tampilkan tombol "Install App" jika tersedia
        if (installButton) {
            installButton.style.display = 'block';
    
            // Event klik untuk memasang aplikasi
            installButton.addEventListener('click', async () => {
                // Tampilkan prompt pemasangan
                deferredPrompt.prompt();
    
                // Tunggu pilihan pengguna
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
    
                // Reset variabel prompt
                deferredPrompt = null;
                // Sembunyikan tombol "Install App" setelah dipilih
                installButton.style.display = 'none';
            });
        }
    });

    // Mendengarkan pesan dari Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'showInstallButton') {
            installButton.style.display = 'block';
        }
    });
    
    // Menyembunyikan tombol install jika sudah terpasang
    window.addEventListener('appinstalled', () => {
        console.log('App was installed');
        if (installButton) installButton.style.display = 'none';
    });    

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // Meminta izin notifikasi secara otomatis saat halaman dimuat
if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            // Jika izin diberikan, mengirim pesan ke service worker untuk menampilkan notifikasi
            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION'
                });
            }
        } else {
            console.log('Izin notifikasi ditolak atau belum dipilih');
        }
    });
} else {
    console.log('Browser tidak mendukung Notification API.');
}

    // Fetch Manifest
    fetch('/manifest.json')
        .then(response => {
            if (!response.ok) throw new Error('Manifest not found');
            return response.json();
        })
        .then(data => {
            console.log('Manifest loaded:', data);
        })
        .catch(error => {
            console.error('Error loading manifest:', error);
        });
});


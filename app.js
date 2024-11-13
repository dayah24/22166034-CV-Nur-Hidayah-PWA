document.addEventListener('DOMContentLoaded', () => {
    // Elemen-elemen utama
    const menuIcon = document.getElementById('menu-icon');
    const navbar = document.getElementById('navbar');
    const readMoreButton = document.getElementById('read-more');
    const aboutMeSection = document.getElementById('about-me');
    const aboutSection = document.getElementById('about');
    const backToAboutButton = document.getElementById('back-to-about');
    const contactForm = document.getElementById('contact-form');
    const installButton = document.getElementById('install-button');
    const contactList = document.getElementById('contact-list');

    // Navbar toggle
    if (menuIcon) {
        menuIcon.addEventListener('click', () => {
            navbar.classList.toggle('active');
        });
    }

    // Tampilkan "About Me" section
    if (readMoreButton) {
        readMoreButton.addEventListener('click', (e) => {
            e.preventDefault();
            aboutSection.style.display = 'none';
            aboutMeSection.style.display = 'block';
            aboutMeSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Kembali ke section "About"
    if (backToAboutButton) {
        backToAboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            aboutMeSection.style.display = 'none';
            aboutSection.style.display = 'block';
            aboutSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Memeriksa apakah elemen dengan ID 'contact-list' ada
    if (!contactList) {
        console.error("Element with ID 'contact-list' not found.");
    } else {
        console.log("Element with ID 'contact-list' ditemukan.");

        // Tambahkan data kontak contoh jika perlu
        var sampleContacts = [
            { name: "John Doe", email: "johndoe@example.com", phone: "123-456-7890" },
            { name: "Jane Smith", email: "janesmith@example.com", phone: "098-765-4321" }
        ];

        sampleContacts.forEach(function(contact) {
            var contactItem = document.createElement("div");
            contactItem.classList.add("contact-item");
            contactItem.innerHTML = `<strong>Nama:</strong> ${contact.name}<br>
                                     <strong>Email:</strong> ${contact.email}<br>
                                     <strong>Telepon:</strong> ${contact.phone}`;
            contactList.appendChild(contactItem);
        });
    }

    // Inisialisasi IndexedDB
    const dbName = 'contactDB';
    const storeName = 'contacts';

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                }
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
        if (!contactList) {
            console.error("Element with ID 'contact-list' not found.");
            return;
        }

        try {
            const db = await initDB();
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const contacts = await store.getAll();

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
        } catch (error) {
            console.error("Error displaying contacts:", error);
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
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';

        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    installButton.style.display = 'none';
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });

    // Hide install button if app is installed
    window.addEventListener('appinstalled', () => {
        console.log('Aplikasi berhasil diinstal');
        installButton.style.display = 'none';
        localStorage.setItem("isInstalled", true);
    });

    const isInstalled = localStorage.getItem("isInstalled");
    if (isInstalled === "true") {
        installButton.style.display = "none";
    }

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

    // Notification Permission Request
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted' && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION'
                });
            }
        });
    }
});

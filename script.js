let dbPromise = idb.open('portfolio-store', 1, function(upgradeDb) {
  upgradeDb.createObjectStore('contact', {keyPath: 'id', autoIncrement: true});
});

function saveContact(data) {
  return dbPromise.then(function(db) {
    let tx = db.transaction('contact', 'readwrite');
    let store = tx.objectStore('contact');
    store.put(data);
    return tx.complete;
  });
}

function getContacts() {
  return dbPromise.then(function(db) {
    let tx = db.transaction('contact', 'readonly');
    let store = tx.objectStore('contact');
    return store.getAll();
  });
}

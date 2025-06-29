// Define a name for our cache
const CACHE_NAME = 'eatery-finder-cache-v1';

// List all the files that make up the app's "shell"
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'icon-192.png'
];

// 1. On install, open the cache and add the shell files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. On fetch, serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we found a match in the cache, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch it from the network
        return fetch(event.request);
      }
    )
  );
});
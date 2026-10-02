/*
  Private Chat — service worker
  Keeps the app openable and installable. It always tries the network
  first, so when you upload a new index.html to GitHub you get the new
  version straight away. Server calls (Apps Script) are never cached.
*/
const CACHE_NAME = 'private-chat-v2';
const APP_SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (c) { return c.addAll(APP_SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET' || req.url.indexOf('script.google') !== -1 || req.url.indexOf('googleusercontent') !== -1) return;

  event.respondWith(
    fetch(req).then(function (res) {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});

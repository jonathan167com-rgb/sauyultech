/**
 * Sau Yul-Tech - Service Worker (PWA Offline & Asset Caching)
 * Versión 3: Limpieza total de versiones anteriores y datos en caché
 */

const CACHE_NAME = 'sauyultech-pwa-v2026-refine-1788286929219';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/img/logo.png'
];

// Instalación: Precarga de activos locales esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[PWA] Precarga parcial completada:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: Limpieza de versiones anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[PWA] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia de Fetch: Network-First con fallback a Cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar llamadas de API y endpoints backend
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Activos estáticos locales: Network First para garantizar la versión más reciente
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // CDNs externos (Google Fonts, Font Awesome, Leaflet): Cache First con fallback a red
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});

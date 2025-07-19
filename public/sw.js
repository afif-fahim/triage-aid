/* eslint-env serviceworker */

// TriageAid Service Worker
// Handles offline functionality, caching, and error handling

const CACHE_NAME = 'triage-aid-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Icons
  '/icons/manifest-icon-192.maskable.png',
  '/icons/manifest-icon-512.maskable.png',
  // Add other critical assets as needed
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.info('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.info('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.info('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.info('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.info('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.info('Service Worker: Activation complete');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Service Worker: Activation failed', error);
      })
  );
});

// Fetch event - handle network requests with cache-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetchRequest(event.request));
});

async function handleFetchRequest(request) {
  try {
    // Try cache first for navigation requests
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }

    // For other requests, try cache first, then network
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.info('Service Worker: Serving from cache', request.url);
      return cachedResponse;
    }

    // Try network and cache the response
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    return await handleOfflineRequest(request);
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);

    // Cache successful navigation responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Navigation fetch failed', error);
    console.info('Service Worker: Network failed for navigation, trying cache');

    // Try cache for navigation
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for failed navigation
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback response if offline page is not cached
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TriageAid - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem;
              background: #f9fafb;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .icon { font-size: 3rem; margin-bottom: 1rem; }
            h1 { color: #1e40af; margin-bottom: 1rem; }
            p { color: #6b7280; line-height: 1.5; }
            button {
              background: #1e40af;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🏥</div>
            <h1>TriageAid</h1>
            <p>You're currently offline. The app will work normally once you're back online.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}

async function handleOfflineRequest(request) {
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }

  // For other requests, try to return cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return a generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This request is not available offline',
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Handle background sync for when the app comes back online
self.addEventListener('sync', event => {
  console.info('Service Worker: Background sync triggered', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Notify the app that we're back online
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACK_ONLINE',
        timestamp: Date.now(),
      });
    });

    console.info('Service Worker: Background sync completed');
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', event => {
  console.info('Service Worker: Received message', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME,
    });
  }
});

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
});

console.info('Service Worker: Script loaded');

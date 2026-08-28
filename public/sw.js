const CACHE_NAME = 'tripbone-pwa-v3';
const ASSETS = [
  '/',
  '/admin'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Allow cache fallback if some assets fail on specific offline modes
      return cache.addAll(ASSETS).catch(err => console.log('Asset cache warning:', err));
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First falling back to Cache
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/same-origin assets
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(e.request.url);

  // Manifests must ALWAYS be fetched fresh from network so multi-tenant branding is dynamic
  if (url.pathname === '/manifest.json' || url.pathname === '/site.webmanifest' || url.pathname === '/manifest.webmanifest') {
    return;
  }

  // Skip Firestore, APIs, and any dynamic checkout or dynamic admin sub-paths
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('firestore.googleapis.com')) {
    return;
  }

  // ONLY handle static assets, the home page, the admin page, and service worker itself
  const isStatic = url.pathname.match(/\.(js|css|gif|png|jpe?g|svg|woff2?|ico|json)$/) || 
                   url.pathname === '/' || 
                   url.pathname === '/admin';

  if (!isStatic) {
    return; // Let browser handle all non-static pages and checkout flows natively!
  }
  
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Only cache successful standard response types
        if (res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone).catch(() => {});
          });
        }
        return res;
      })
      .catch(async (err) => {
        const cachedResponse = await caches.match(e.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Throw actual error to cleanly signal network failure instead of returning undefined (which causes TypeError)
        throw err;
      })
  );
});

// Listen to Background Messages or VAPID Push Notifications
self.addEventListener('push', (e) => {
  let data = { title: 'Tripbone Alert', body: 'New travel activity update!' };
  if (e.data) {
    try {
      data = e.data.json();
    } catch (err) {
      data = { title: 'Tripbone Alert', body: e.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/api/uploads/q08dkhNCIxtWc4kuqnrv',
    badge: data.badge || '/api/uploads/q08dkhNCIxtWc4kuqnrv',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/admin'
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = e.notification.data?.url || '/admin';
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

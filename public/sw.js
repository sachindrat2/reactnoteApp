// Service Worker for NotesApp PWA
const CACHE_NAME = 'notesapp-v2.0.0';
const STATIC_CACHE = 'notesapp-static-v2.0.0';
const API_CACHE = 'notesapp-api-v2.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('SW: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.includes('/api/') || url.hostname.includes('azurewebsites.net')) {
    event.respondWith(
      caches.open(API_CACHE)
        .then((cache) => {
          return fetch(request)
            .then((response) => {
              // Only cache GET requests and successful responses
              if (request.method === 'GET' && response.ok && response.status < 400) {
                try {
                  // Clone response before caching to avoid body consumption
                  const responseClone = response.clone();
                  cache.put(request, responseClone).catch(err => {
                    console.warn('Failed to cache response:', err);
                  });
                } catch (cacheError) {
                  console.warn('Error cloning response for cache:', cacheError);
                }
              }
              return response;
            })
            .catch(() => {
              // Return cached response if network fails (only for GET requests)
              if (request.method === 'GET') {
                return cache.match(request);
              }
              // For non-GET requests, just reject
              throw new Error('Network request failed');
            });
        })
    );
    return;
  }
  
  // Handle static files
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request)
          .then((networkResponse) => {
            // Only cache successful GET requests for static files
            if (request.method === 'GET' && networkResponse.ok && networkResponse.status < 400) {
              try {
                // Clone response before caching
                const responseClone = networkResponse.clone();
                
                caches.open(STATIC_CACHE)
                  .then((c) => c.put(request, responseClone))
                  .catch(err => {
                    console.warn('Failed to cache static file:', err);
                  });
              } catch (cloneError) {
                console.warn('Error cloning response for static cache:', cloneError);
              }
            }
            return networkResponse;
          });
      })
      .catch(() => {
        // Fallback for offline
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notes') {
    event.waitUntil(
      syncNotes()
    );
  }
});

// Sync notes when back online
async function syncNotes() {
  try {
    // Get pending notes from IndexedDB or localStorage
    const pendingNotes = JSON.parse(localStorage.getItem('pending_notes') || '[]');
    
    if (pendingNotes.length > 0) {
      console.log('SW: Syncing', pendingNotes.length, 'pending notes');
      
      // Sync each note
      for (const note of pendingNotes) {
        try {
          await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
          });
        } catch (error) {
          console.error('SW: Failed to sync note:', error);
        }
      }
      
      // Clear pending notes after successful sync
      localStorage.removeItem('pending_notes');
      console.log('SW: Notes synced successfully');
    }
  } catch (error) {
    console.error('SW: Sync failed:', error);
  }
}
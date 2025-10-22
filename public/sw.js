// Service Worker for NotesApp PWA - API requests bypass SW
const CACHE_NAME = 'notesapp-v2.1.0';
const STATIC_CACHE = 'notesapp-static-v2.1.0';
const API_CACHE = 'notesapp-api-v2.1.0';

// Files to cache immediately - Updated for Vite build output
const STATIC_FILES = [
  '/reactnoteApp/',
  '/reactnoteApp/index.html',
  '/reactnoteApp/manifest.json',
  // Note: Vite generates hashed filenames, so we'll cache them dynamically
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
  
  // Skip service worker for auth and API requests - let them go directly to network
  if (url.hostname.includes('azurewebsites.net') || 
      url.pathname.includes('/api/') || 
      url.pathname.includes('/register') || 
      url.pathname.includes('/token') || 
      url.pathname.includes('/notes')) {
    // Let these requests bypass service worker completely
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
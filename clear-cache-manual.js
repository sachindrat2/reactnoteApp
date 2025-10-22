// Clear Cache and Refresh Script
// Add this to browser console if you encounter cache issues

console.log('🧹 Starting cache clear and refresh...');

// Clear all caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('Found caches:', cacheNames);
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('Clearing cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('✅ All caches cleared');
    
    // Clear localStorage
    const notesCacheKey = 'notesapp_notes_cache';
    const userKey = 'notesapp_user';
    
    if (localStorage.getItem(notesCacheKey)) {
      localStorage.removeItem(notesCacheKey);
      console.log('✅ Notes cache cleared');
    }
    
    console.log('🔄 Forcing hard refresh...');
    
    // Force hard refresh with cache bypass
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  });
} else {
  console.log('Cache API not supported, doing hard refresh...');
  window.location.reload(true);
}
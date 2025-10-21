// Clear all app data - useful for debugging authentication issues
export const clearAllAppData = () => {
  console.log('🧹 Clearing all app data...');
  
  // Clear localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notesapp_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('🧹 Removed:', key);
  });
  
  // Clear service worker caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.includes('notesapp') || cacheName.includes('notes-')) {
            console.log('🧹 Clearing cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    });
  }
  
  console.log('🧹 App data cleared. Refresh the page to start fresh.');
};
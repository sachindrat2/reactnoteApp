// Quick Performance Reset - Run this in browser console
console.log('🚀 Quick Performance Reset Starting...');

// Clear all caches and localStorage
const clearEverything = () => {
  // Clear localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('notesapp_')) {
      localStorage.removeItem(key);
      console.log('🗑️ Cleared:', key);
    }
  });
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear any pending timeouts (if possible)
  if (window.perfTimers) {
    window.perfTimers.forEach(timer => clearTimeout(timer));
    window.perfTimers = [];
  }
  
  console.log('✅ Caches cleared');
};

// Reset performance state
const resetPerformance = () => {
  // Stop any background processes
  if (window.backgroundSync) {
    clearInterval(window.backgroundSync);
    window.backgroundSync = null;
  }
  
  console.log('✅ Background processes stopped');
};

// Quick connectivity test
const quickConnectivityTest = async () => {
  console.log('🔗 Testing connectivity...');
  
  try {
    const start = performance.now();
    const response = await fetch('http://localhost:3001/api/notes', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    const duration = performance.now() - start;
    
    console.log(`✅ Local proxy: ${response.status} (${duration.toFixed(0)}ms)`);
  } catch (error) {
    console.log(`❌ Local proxy failed: ${error.message}`);
  }
};

// Execute all
const performanceReset = async () => {
  clearEverything();
  resetPerformance();
  await quickConnectivityTest();
  
  console.log('🎯 Performance reset complete! Reload the page for best results.');
  
  // Auto-reload after 2 seconds
  setTimeout(() => {
    console.log('🔄 Auto-reloading...');
    window.location.reload();
  }, 2000);
};

// Run the reset
performanceReset();
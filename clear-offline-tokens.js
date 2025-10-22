// Clear offline tokens and fix authentication
console.log('🧹 === CLEARING OFFLINE TOKENS ===');

// Check what's currently stored
const authData = localStorage.getItem('notesapp_user');
console.log('Current auth data:', authData);

if (authData) {
  try {
    const parsed = JSON.parse(authData);
    const token = parsed.access_token || parsed.token;
    
    if (token && token.startsWith('offline_token_')) {
      console.log('🚫 FOUND OFFLINE TOKEN - REMOVING IT NOW');
      
      // Clear all notesapp data
      const keys = Object.keys(localStorage);
      const notesAppKeys = keys.filter(key => key.startsWith('notesapp_'));
      
      notesAppKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ Removed:', key);
      });
      
      console.log('✅ All offline data cleared!');
      console.log('🔄 Please refresh the page and login again with real credentials');
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } else {
      console.log('✅ Token looks good - no offline token detected');
      console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'None');
    }
  } catch (e) {
    console.log('❌ Corrupted auth data - clearing it');
    localStorage.removeItem('notesapp_user');
    console.log('✅ Corrupted data cleared');
  }
} else {
  console.log('ℹ️ No auth data found - user not logged in');
}

console.log('🏁 Offline token cleanup complete!');
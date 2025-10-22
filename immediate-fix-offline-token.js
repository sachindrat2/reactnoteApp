// IMMEDIATE FIX for 401 Offline Token Issue
// Copy and paste this into your browser console to fix the issue immediately

console.log('🚀 === FIXING OFFLINE TOKEN 401 ERRORS ===');

// Step 1: Check what's currently in localStorage
const currentAuth = localStorage.getItem('notesapp_user');
console.log('Current auth data:', currentAuth);

if (currentAuth) {
  try {
    const parsed = JSON.parse(currentAuth);
    const token = parsed.access_token || parsed.token;
    
    if (token && token.startsWith('offline_token_')) {
      console.log('🚫 FOUND THE PROBLEM: Offline token being used for real API calls');
      console.log('🎯 Offline token:', token);
      
      // Step 2: Clear all offline authentication data
      console.log('🧹 Clearing offline authentication data...');
      
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notesapp_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ Removed:', key);
      });
      
      console.log('✅ All offline data cleared successfully!');
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('1. Refresh the page (F5 or Ctrl+R)');
      console.log('2. You will see the login screen');
      console.log('3. Login with your real credentials');
      console.log('4. You should now get a real authentication token');
      console.log('');
      console.log('💡 The 401 errors were happening because you had a fake "offline_token"');
      console.log('   instead of a real authentication token from the server.');
      
      // Auto-refresh after 3 seconds
      console.log('🔄 Auto-refreshing in 3 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } else {
      console.log('ℹ️ No offline token found. The issue might be different.');
      console.log('Current token type:', typeof token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'None');
    }
  } catch (e) {
    console.log('❌ Error parsing auth data:', e.message);
    console.log('🧹 Clearing corrupted data...');
    localStorage.removeItem('notesapp_user');
    console.log('✅ Corrupted data cleared. Please refresh and login again.');
  }
} else {
  console.log('ℹ️ No authentication data found. User is not logged in.');
  console.log('💡 Please login to get a proper authentication token.');
}

console.log('');
console.log('🔧 If you need to manually refresh, press F5 or Ctrl+R');
console.log('📋 If the problem persists, check the network tab for other errors');
// Test script to debug authentication persistence
// Add this to browser console to check localStorage

console.log('=== Authentication Debug ===');
console.log('localStorage keys:', Object.keys(localStorage));
console.log('notesapp_user:', localStorage.getItem('notesapp_user'));

try {
  const userData = JSON.parse(localStorage.getItem('notesapp_user') || '{}');
  console.log('Parsed user data:', userData);
  console.log('Has access_token:', !!userData.access_token);
  console.log('Token preview:', userData.access_token ? userData.access_token.substring(0, 20) + '...' : 'None');
} catch (error) {
  console.error('Error parsing user data:', error);
}

// Test authentication state
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);
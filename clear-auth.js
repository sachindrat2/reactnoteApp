// Quick fix utility to clear corrupted authentication state
// Run this in browser console to reset authentication

console.log('🧹 Clearing all authentication data...');

// Clear localStorage
localStorage.removeItem('notesapp_user');
localStorage.removeItem('notesapp_notes_cache');

// Clear any other auth-related storage
const keys = Object.keys(localStorage);
keys.forEach(key => {
  if (key.includes('notesapp') || key.includes('auth') || key.includes('token')) {
    console.log('🗑️ Removing:', key);
    localStorage.removeItem(key);
  }
});

// Force reload to clear memory state
console.log('🔄 Reloading page to clear memory state...');
window.location.reload();
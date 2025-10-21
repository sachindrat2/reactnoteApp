// Reset authentication and clear offline mode
// Run this in browser console to test fresh login

console.log('🔄 Resetting authentication state...');

// Clear all app-related localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('notesapp_')) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log('🗑️ Removing:', key);
  localStorage.removeItem(key);
});

console.log('✅ Authentication state reset!');
console.log('🔄 Reload the page to test fresh login with CORS proxy');

// Reload the page automatically
setTimeout(() => {
  window.location.reload();
}, 1000);
// Quick Fix and Test Script
// Copy and paste this entire script into your browser console

console.log('🛠️ Quick Fix Script Starting...');

// 1. Clear any corrupted state
const clearCorruptedState = () => {
  console.log('🧹 Clearing potentially corrupted state...');
  
  // Keep user auth but clear everything else
  const userData = localStorage.getItem('notesapp_user');
  
  // Clear all other keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notesapp_') && key !== 'notesapp_user') {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log('🗑️ Removed:', key);
  });
  
  // Clear session storage
  sessionStorage.clear();
  
  console.log('✅ State cleared');
};

// 2. Test basic functionality
const testBasicFunctionality = () => {
  console.log('\n🧪 Testing basic functionality...');
  
  // Check if user is logged in
  const userData = localStorage.getItem('notesapp_user');
  if (!userData) {
    console.log('❌ Not logged in - need to login first');
    return false;
  }
  
  console.log('✅ User is logged in');
  
  // Test if we can access the current URL
  console.log('Current URL:', window.location.href);
  console.log('Current path:', window.location.pathname);
  
  return true;
};

// 3. Force reload with clean state
const forceCleanReload = () => {
  console.log('\n🔄 Forcing clean reload...');
  
  // Add a timestamp to force cache busting
  const url = new URL(window.location);
  url.searchParams.set('_t', Date.now());
  
  // Reload with new URL
  window.location.href = url.toString();
};

// 4. Test logout (if user wants to test it)
const testLogoutFunction = () => {
  console.log('\n🚪 To test logout:');
  console.log('1. Click the logout button in the top-right corner');
  console.log('2. Check if you are redirected to login page');
  console.log('3. Check browser console for any errors');
  
  // Provide manual logout option
  console.log('\n💡 Manual logout option:');
  console.log('Run this command to logout manually:');
  console.log('localStorage.removeItem("notesapp_user"); window.location.reload();');
};

// 5. Test note creation (provide tips)
const testNoteCreation = () => {
  console.log('\n📝 To test note creation:');
  console.log('1. Click the "New Note" button');
  console.log('2. Fill in the note details');
  console.log('3. Click Save');
  console.log('4. Check browser console for any errors');
  console.log('5. Check if note appears in the list');
};

// Main execution
const runQuickFix = () => {
  console.log('🚀 === QUICK FIX AND TEST ===');
  
  clearCorruptedState();
  const isLoggedIn = testBasicFunctionality();
  
  if (isLoggedIn) {
    testLogoutFunction();
    testNoteCreation();
    
    console.log('\n✅ Quick fix completed!');
    console.log('💡 If issues persist, try the manual reload option below:');
    console.log('👆 Run: forceCleanReload()');
  } else {
    console.log('\n⚠️ Please login first, then run this script again');
  }
};

// Create global functions for manual use
window.quickFixDebug = {
  clearState: clearCorruptedState,
  testBasic: testBasicFunctionality,
  forceReload: forceCleanReload,
  runAll: runQuickFix
};

// Auto-run
runQuickFix();

console.log('\n🔧 Additional commands available:');
console.log('• quickFixDebug.clearState() - Clear corrupted state');
console.log('• quickFixDebug.forceReload() - Force clean reload');
console.log('• quickFixDebug.runAll() - Run full quick fix');
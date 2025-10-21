// Quick Error Check Script
// Copy and paste this into browser console to verify the fix

console.log('🔍 Checking for React errors...');

// Check if there are any React errors in console
const originalError = console.error;
let errorCount = 0;

console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

// Check current state
const checkAppState = () => {
  console.log('\n📊 Current App State:');
  console.log('• URL:', window.location.href);
  console.log('• User logged in:', !!localStorage.getItem('notesapp_user'));
  
  // Check if React is working
  if (window.React) {
    console.log('• React loaded:', 'YES');
  } else {
    console.log('• React loaded:', 'NO');
  }
  
  // Check for DOM elements
  const notesApp = document.querySelector('[data-testid="notes-app"]') || 
                   document.querySelector('.notes-app') ||
                   document.querySelector('header'); // Check for header as app indicator
  
  if (notesApp) {
    console.log('• App rendered:', 'YES');
  } else {
    console.log('• App rendered:', 'NO - might still be loading');
  }
};

// Test basic functionality
const testBasicFunctions = () => {
  console.log('\n🧪 Testing Basic Functions:');
  
  // Test if we can access localStorage
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('• localStorage:', 'WORKING');
  } catch (e) {
    console.log('• localStorage:', 'ERROR -', e.message);
  }
  
  // Test if fetch is available
  if (typeof fetch !== 'undefined') {
    console.log('• fetch API:', 'AVAILABLE');
  } else {
    console.log('• fetch API:', 'NOT AVAILABLE');
  }
};

// Run checks
checkAppState();
testBasicFunctions();

console.log('\n✅ Error check completed!');
console.log('If you see any "Cannot access before initialization" errors above, they should be fixed now.');
console.log('\n💡 To test the app:');
console.log('1. Try logging in');
console.log('2. Try creating a new note');
console.log('3. Try logging out');

// Reset console.error after 5 seconds
setTimeout(() => {
  console.error = originalError;
  if (errorCount === 0) {
    console.log('🎉 No new errors detected during testing!');
  } else {
    console.log(`⚠️ ${errorCount} errors detected - check console above`);
  }
}, 5000);
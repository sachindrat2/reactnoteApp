// Debug script for notes app issues
// Copy and paste this into browser console

console.log('🔍 Starting comprehensive debug...');

// 1. Check authentication state
const checkAuth = () => {
  console.log('\n🔐 === AUTHENTICATION DEBUG ===');
  
  const userData = localStorage.getItem('notesapp_user');
  console.log('Raw user data:', userData ? 'Found' : 'Not found');
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('User object:', {
        hasToken: !!user.access_token,
        isOffline: user.isOffline,
        userEmail: user.user?.email,
        userId: user.user?.id
      });
      return user;
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return null;
    }
  }
  return null;
};

// 2. Test API connectivity
const testConnectivity = async () => {
  console.log('\n🌐 === CONNECTIVITY TEST ===');
  
  const endpoints = [
    { name: 'Local CORS Proxy', url: 'http://localhost:3001/api/notes' },
    { name: 'Direct Backend', url: 'https://noteappweb-backend.delightfulwave-7d742510.japaneast.azurecontainerapps.io/notes' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const start = performance.now();
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const duration = performance.now() - start;
      console.log(`✅ ${endpoint.name}: ${response.status} (${duration.toFixed(0)}ms)`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
};

// 3. Test notes operations
const testNotesOperations = async () => {
  console.log('\n📝 === NOTES OPERATIONS TEST ===');
  
  // Test loading notes
  try {
    console.log('Testing notes loading...');
    
    // Check if notesService is available
    if (typeof window.notesService === 'undefined') {
      console.log('⚠️ notesService not available globally - this is normal');
      console.log('Will test via localStorage instead');
      
      // Check cached notes
      const userId = JSON.parse(localStorage.getItem('notesapp_user') || '{}').user?.id || 'unknown_user';
      const cacheKey = `notesapp_notes_cache_${userId}`;
      const cachedNotes = localStorage.getItem(cacheKey);
      console.log('Cached notes:', cachedNotes ? JSON.parse(cachedNotes).length + ' notes' : 'None');
    }
    
  } catch (error) {
    console.error('Notes loading test failed:', error);
  }
};

// 4. Test logout functionality
const testLogout = () => {
  console.log('\n🚪 === LOGOUT TEST ===');
  
  // Check if logout would work
  const userData = localStorage.getItem('notesapp_user');
  if (userData) {
    console.log('✅ User data exists - logout should work');
    console.log('💡 To test logout: click the logout button in the app');
  } else {
    console.log('❌ No user data - already logged out');
  }
};

// 5. Performance check
const checkPerformance = () => {
  console.log('\n⚡ === PERFORMANCE CHECK ===');
  
  const start = performance.now();
  
  // Test localStorage performance
  const testData = { test: 'data', timestamp: Date.now() };
  localStorage.setItem('perf-test', JSON.stringify(testData));
  const retrieved = JSON.parse(localStorage.getItem('perf-test'));
  localStorage.removeItem('perf-test');
  
  const duration = performance.now() - start;
  console.log(`localStorage performance: ${duration.toFixed(2)}ms`);
  
  // Check memory usage (if available)
  if (performance.memory) {
    console.log('Memory usage:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + ' MB'
    });
  }
};

// Run all tests
const runFullDiagnostic = async () => {
  console.log('🚀 === FULL DIAGNOSTIC STARTING ===');
  
  const user = checkAuth();
  await testConnectivity();
  await testNotesOperations();
  testLogout();
  checkPerformance();
  
  console.log('\n🎯 === DIAGNOSTIC COMPLETE ===');
  console.log('Check the logs above to identify issues');
  
  // Provide recommendations
  console.log('\n💡 === RECOMMENDATIONS ===');
  if (!user) {
    console.log('• Need to login first');
  } else if (user.isOffline) {
    console.log('• Currently in offline mode - API calls may fail');
  } else {
    console.log('• User authenticated - app should work normally');
  }
  
  console.log('• If logout not working: check console for navigation errors');
  console.log('• If notes not loading: check network connectivity');
  console.log('• If creating notes fails: check API responses above');
};

// Auto-run diagnostic
runFullDiagnostic();
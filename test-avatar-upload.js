// Test script to debug avatar upload issue
// Run this in browser console while on the app

async function debugAvatarUpload() {
  console.log('🔍 Debugging avatar upload...');
  
  // Create a test file
  const testFile = new File(['test'], 'test-avatar.png', { type: 'image/png' });
  
  // Check FormData creation
  const formData = new FormData();
  formData.append('avatar', testFile);
  
  console.log('📄 FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value instanceof File ? `File: ${value.name} (${value.size} bytes, ${value.type})` : value);
  }
  
  // Get the API URL and headers
  const baseUrl = 'https://noteappweb-backend.delightfulwave-7d742510.japaneast.azurecontainerapps.io';
  const url = `${baseUrl}/profile/avatar`;
  
  const userData = localStorage.getItem('notesapp_user');
  if (!userData) {
    console.error('❌ No user data found in localStorage');
    return;
  }
  
  const user = JSON.parse(userData);
  const token = user.token;
  
  if (!token) {
    console.error('❌ No token found');
    return;
  }
  
  console.log('📤 Making request to:', url);
  console.log('🔑 Using token:', token.substring(0, 10) + '...');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
        // Note: NOT setting Content-Type to let browser set it automatically for FormData
      },
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache'
    });
    
    console.log('📨 Response status:', response.status);
    console.log('📨 Response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('📨 Response text:', responseText);
    
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📨 Response JSON:', responseJson);
      } catch (e) {
        console.log('📨 Response is not JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Also check what the current API call is doing
function checkCurrentAPICall() {
  console.log('🔍 Checking current API implementation...');
  
  // Monkey patch fetch to log all requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (url.includes('/profile/avatar')) {
      console.log('🕵️ Intercepted avatar upload request:');
      console.log('  URL:', url);
      console.log('  Options:', options);
      
      if (options.body instanceof FormData) {
        console.log('  FormData entries:');
        for (let [key, value] of options.body.entries()) {
          console.log(`    ${key}:`, value instanceof File ? `File: ${value.name}` : value);
        }
      }
    }
    
    return originalFetch.apply(this, arguments);
  };
  
  console.log('✅ Request interceptor installed. Try uploading an avatar now.');
}

console.log('Avatar upload debug functions loaded:');
console.log('- debugAvatarUpload() - Test with dummy file');
console.log('- checkCurrentAPICall() - Monitor actual requests');
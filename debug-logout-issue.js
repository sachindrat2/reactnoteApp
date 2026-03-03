// DEBUG: Find why automatic logout is happening
// Run this in browser console to trace authentication flow

console.log('🔍 === AUTHENTICATION FLOW DEBUG ===');

// 1. Check localStorage auth data
console.log('📱 1. Checking localStorage...');
const authData = localStorage.getItem('notesapp_user');
if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('✅ Auth data found:', {
      hasAccessToken: !!parsed.access_token,
      tokenType: parsed.token_type,
      tokenPreview: parsed.access_token?.substring(0, 50) + '...',
      userEmail: parsed.user?.email,
      fullData: parsed
    });

    // 2. Test token format
    console.log('🎫 2. Testing token format...');
    if (parsed.access_token && parsed.access_token.includes('.')) {
      const parts = parsed.access_token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log('✅ JWT Token payload:', {
            sub: payload.sub,
            exp: payload.exp ? new Date(payload.exp * 1000) : 'No expiration',
            iat: payload.iat ? new Date(payload.iat * 1000) : 'No issued at',
            isExpired: payload.exp ? Date.now() > payload.exp * 1000 : 'Unknown',
            remainingTime: payload.exp ? Math.max(0, payload.exp * 1000 - Date.now()) + 'ms' : 'Unknown'
          });
        } catch (e) {
          console.log('⚠️ Could not decode JWT payload:', e);
        }
      } else {
        console.log('⚠️ Token doesn\'t look like JWT (wrong number of parts)');
      }
    } else {
      console.log('⚠️ Token doesn\'t contain dots (not JWT format)');
    }

    // 3. Test API call manually
    console.log('🌐 3. Testing API call manually...');
    fetch('https://noteappweb-backend.delightfulwave-7d742510.japaneast.azurecontainerapps.io/notes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${parsed.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    })
    .then(response => {
      console.log('📡 Manual API test result:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - This is why logout is triggered!');
        console.log('🔍 Possible causes:');
        console.log('   - Token is expired');
        console.log('   - Token format is wrong');
        console.log('   - Server doesn\'t recognize this token');
      } else if (response.ok) {
        console.log('✅ API call successful - logout shouldn\'t happen');
      }
      
      return response.text();
    })
    .then(text => {
      console.log('📄 Response body:', text);
      try {
        const json = JSON.parse(text);
        console.log('📋 Parsed JSON response:', json);
      } catch (e) {
        console.log('ℹ️ Response is not JSON');
      }
    })
    .catch(error => {
      console.log('❌ Manual API test failed:', error);
      console.log('🔍 This network error might be triggering logout');
    });

  } catch (e) {
    console.log('❌ Invalid JSON in localStorage:', e);
  }
} else {
  console.log('❌ No auth data in localStorage');
}

// 4. Monitor logout calls
console.log('👀 4. Setting up logout monitoring...');
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  if (url && url.includes('/logout')) {
    console.log('🚨 LOGOUT API CALL DETECTED!');
    console.log('   URL:', url);
    console.log('   Options:', options);
    console.trace('   Call stack:');
  }
  return originalFetch.apply(this, args);
};

console.log('🔍 === DEBUG SETUP COMPLETE ===');
console.log('Now try logging in and watch the console for detailed logs!');
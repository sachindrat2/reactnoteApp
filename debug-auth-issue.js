// Debug authentication issues
// Run this in browser console after login to see what's happening

console.log('🔍 === AUTHENTICATION DEBUG ===');

// Check localStorage
const authData = localStorage.getItem('notesapp_user');
console.log('📱 Auth data in localStorage:', authData);

if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('🔑 Parsed auth data:', {
      hasToken: !!parsed.access_token,
      tokenStart: parsed.access_token?.substring(0, 20) + '...',
      tokenType: parsed.access_token?.startsWith('ey') ? 'JWT' : 'Other',
      user: parsed.user || parsed.name || 'No user info'
    });

    // Try to decode JWT if it looks like one
    if (parsed.access_token && parsed.access_token.includes('.')) {
      const parts = parsed.access_token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🎫 JWT payload:', {
            sub: payload.sub,
            exp: payload.exp ? new Date(payload.exp * 1000) : 'No expiration',
            iat: payload.iat ? new Date(payload.iat * 1000) : 'No issued at',
            isExpired: payload.exp ? Date.now() > payload.exp * 1000 : 'Unknown'
          });
        } catch (e) {
          console.log('⚠️ Could not decode JWT payload:', e);
        }
      }
    }

    // Test API call
    console.log('🌐 Testing API call...');
    fetch('https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net/notes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${parsed.access_token}`,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    })
    .then(response => {
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      return response.text();
    })
    .then(text => {
      console.log('📄 Response body:', text);
      try {
        const json = JSON.parse(text);
        console.log('📋 Parsed response:', json);
      } catch (e) {
        console.log('⚠️ Response is not JSON');
      }
    })
    .catch(error => {
      console.log('❌ API test failed:', error);
    });

  } catch (e) {
    console.log('❌ Invalid auth data in localStorage:', e);
  }
} else {
  console.log('❌ No auth data found');
}

console.log('🔍 === DEBUG COMPLETE ===');
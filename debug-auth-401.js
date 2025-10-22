// Debug authentication state and API calls
async function debugAuthState() {
    console.log('=== Authentication Debug ===');
    
    // Check localStorage
    const storedUser = localStorage.getItem('notesapp_user');
    console.log('Stored user data:', storedUser);
    
    if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            console.log('Parsed user data:', parsed);
            console.log('Token available:', !!parsed.access_token);
            console.log('Token preview:', parsed.access_token ? parsed.access_token.substring(0, 20) + '...' : 'None');
            console.log('User info:', parsed.user);
        } catch (e) {
            console.error('Error parsing stored user data:', e);
        }
    } else {
        console.log('No stored user data found');
    }
    
    // Test API endpoint directly
    console.log('\n=== Direct API Test ===');
    const baseUrl = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';
    
    // Test with current token
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            const token = userData.access_token || userData.token;
            
            if (token) {
                console.log('Testing API with current token...');
                const response = await fetch(`${baseUrl}/notes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('API Response Status:', response.status);
                console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response Data:', data);
                } else {
                    const errorText = await response.text();
                    console.log('API Error Response:', errorText);
                }
            } else {
                console.log('No token found in stored data');
            }
        } catch (e) {
            console.error('Error testing API:', e);
        }
    }
    
    // Check if token is expired by attempting to decode it (if it's a JWT)
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            const token = userData.access_token || userData.token;
            
            if (token && token.includes('.')) {
                console.log('\n=== Token Analysis ===');
                const parts = token.split('.');
                if (parts.length === 3) {
                    // Looks like a JWT
                    try {
                        const payload = JSON.parse(atob(parts[1]));
                        console.log('JWT Payload:', payload);
                        
                        if (payload.exp) {
                            const expDate = new Date(payload.exp * 1000);
                            const now = new Date();
                            console.log('Token expires at:', expDate);
                            console.log('Current time:', now);
                            console.log('Token expired:', now > expDate);
                        }
                    } catch (e) {
                        console.log('Could not decode JWT payload:', e);
                    }
                }
            }
        } catch (e) {
            console.error('Error analyzing token:', e);
        }
    }
}

// Run the debug
debugAuthState();
// Enhanced authentication debugger and token validator
class AuthDebugger {
    constructor() {
        this.baseUrl = 'https://notesapp.agreeableocean-d7058ab3.japanwest.azurecontainerapps.io';
    }

    async checkAuthState() {
        console.log('🔍 === AUTHENTICATION DEBUG REPORT ===');
        
        // 1. Check localStorage
        const storedData = localStorage.getItem('notesapp_user');
        if (!storedData) {
            console.log('❌ No authentication data found in localStorage');
            return { authenticated: false, reason: 'No stored auth data' };
        }

        let userData;
        try {
            userData = JSON.parse(storedData);
            console.log('✅ Auth data found in localStorage');
        } catch (e) {
            console.log('❌ Corrupted auth data in localStorage');
            localStorage.removeItem('notesapp_user');
            return { authenticated: false, reason: 'Corrupted auth data' };
        }

        // 2. Check token availability
        const token = userData.access_token || userData.token;
        if (!token) {
            console.log('❌ No access token found in stored data');
            console.log('📋 Available keys:', Object.keys(userData));
            return { authenticated: false, reason: 'No access token' };
        }

        console.log('✅ Access token found');
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');

        // 3. Check if token is JWT and validate expiration
        if (token.includes('.')) {
            const parts = token.split('.');
            if (parts.length === 3) {
                try {
                    const payload = JSON.parse(atob(parts[1]));
                    console.log('📋 JWT Payload:', payload);
                    
                    if (payload.exp) {
                        const expDate = new Date(payload.exp * 1000);
                        const now = new Date();
                        const isExpired = now > expDate;
                        
                        console.log('⏰ Token expires:', expDate.toLocaleString());
                        console.log('⏰ Current time:', now.toLocaleString());
                        console.log(isExpired ? '❌ Token is EXPIRED' : '✅ Token is valid');
                        
                        if (isExpired) {
                            return { authenticated: false, reason: 'Token expired', expiredAt: expDate };
                        }
                    }
                } catch (e) {
                    console.log('⚠️ Could not decode JWT payload (might not be JWT)');
                }
            }
        }

        // 4. Test token with API
        console.log('🧪 Testing token with API...');
        try {
            const response = await fetch(`${this.baseUrl}/notes`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            console.log('📡 API Response Status:', response.status);
            console.log('📡 API Response Headers:', Object.fromEntries(response.headers.entries()));

            if (response.status === 401) {
                console.log('❌ API returned 401 - Token invalid or expired');
                return { authenticated: false, reason: 'API rejected token (401)', apiStatus: 401 };
            } else if (response.ok) {
                const data = await response.json();
                console.log('✅ API accepted token - authentication valid');
                console.log('📋 Notes data:', data);
                return { authenticated: true, notesCount: Array.isArray(data) ? data.length : 'unknown' };
            } else {
                console.log('⚠️ API returned unexpected status:', response.status);
                const errorText = await response.text();
                console.log('📋 Error response:', errorText);
                return { authenticated: false, reason: `API error: ${response.status}`, apiStatus: response.status };
            }
        } catch (error) {
            console.log('❌ API request failed:', error.message);
            
            if (error.message.includes('CORS')) {
                console.log('💡 CORS error detected - trying with proxy...');
                return await this.testWithProxy(token);
            }
            
            return { authenticated: false, reason: 'API request failed', error: error.message };
        }
    }

    async testWithProxy(token) {
        const proxies = [
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
        ];

        for (let i = 0; i < proxies.length; i++) {
            const proxyUrl = proxies[i](`${this.baseUrl}/notes`);
            console.log(`🔄 Testing with proxy ${i + 1}:`, proxyUrl);
            
            try {
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                console.log(`📡 Proxy ${i + 1} Response Status:`, response.status);
                
                if (response.status === 401) {
                    console.log(`❌ Proxy ${i + 1} also returned 401`);
                    continue;
                } else if (response.ok) {
                    console.log(`✅ Proxy ${i + 1} succeeded!`);
                    return { authenticated: true, workingProxy: i };
                }
            } catch (error) {
                console.log(`❌ Proxy ${i + 1} failed:`, error.message);
            }
        }

        return { authenticated: false, reason: 'All proxies failed with 401' };
    }

    async forceReauth() {
        console.log('🔄 Forcing re-authentication...');
        
        // Clear stored auth
        localStorage.removeItem('notesapp_user');
        localStorage.removeItem('notesapp_notes_cache');
        
        // Reload page to trigger login
        window.location.reload();
    }

    getRecommendations(result) {
        console.log('\n🎯 === RECOMMENDATIONS ===');
        
        if (!result.authenticated) {
            switch (result.reason) {
                case 'Token expired':
                    console.log('💡 Your session has expired. Please log in again.');
                    break;
                case 'API rejected token (401)':
                    console.log('💡 The server rejected your token. This usually means:');
                    console.log('   - Token has expired');
                    console.log('   - Token format is incorrect');
                    console.log('   - Server authentication settings changed');
                    console.log('   - Your account was deactivated');
                    break;
                case 'All proxies failed with 401':
                    console.log('💡 All CORS proxies returned 401. This suggests:');
                    console.log('   - Your token is invalid/expired');
                    console.log('   - The API endpoint authentication requirements changed');
                    break;
                default:
                    console.log('💡 Please try logging in again.');
            }
            
            console.log('\n🔧 Quick fix: Run authDebugger.forceReauth() to clear auth and restart');
        } else {
            console.log('✅ Authentication is working correctly!');
        }
    }
}

// Create global instance for easy access
window.authDebugger = new AuthDebugger();

// Auto-run check
authDebugger.checkAuthState().then(result => {
    authDebugger.getRecommendations(result);
    console.log('\n🎮 Use authDebugger.forceReauth() to clear auth and restart');
});
// 401 Error Quick Fix Script
// Run this in the browser console when experiencing 401 errors

(function() {
    console.log('🚀 === 401 Error Quick Fix Tool ===');
    
    // Function to clear all authentication data
    function clearAuth() {
        console.log('🧹 Clearing all authentication data...');
        
        // Clear localStorage keys
        const keysToRemove = [
            'notesapp_user',
            'notesapp_notes_cache'
        ];
        
        // Also clear any user-specific cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('notesapp_notes_cache_')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
                console.log(`✅ Removed: ${key}`);
            }
        });
        
        console.log('✅ Authentication data cleared');
    }
    
    // Function to test API connectivity
    async function testAPI() {
        console.log('🧪 Testing API connectivity...');
        
        const baseUrl = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';
        
        try {
            // Test basic connectivity
            const response = await fetch(`${baseUrl}/notes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 API Response Status:', response.status);
            
            if (response.status === 401) {
                console.log('✅ API is accessible but requires authentication (this is expected)');
                return true;
            } else if (response.ok) {
                console.log('✅ API is accessible and working');
                return true;
            } else {
                console.log('⚠️ API returned unexpected status:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ API test failed:', error.message);
            
            if (error.message.includes('CORS')) {
                console.log('💡 CORS issue detected - this is likely the root cause');
            }
            
            return false;
        }
    }
    
    // Function to force refresh the app
    function forceRefresh() {
        console.log('🔄 Force refreshing the application...');
        window.location.reload(true);
    }
    
    // Main fix function
    async function fix401Issues() {
        console.log('🔧 Starting 401 error diagnosis and fix...');
        
        // Step 1: Check current auth state
        const currentAuth = localStorage.getItem('notesapp_user');
        if (currentAuth) {
            console.log('🔍 Found authentication data in localStorage');
            try {
                const authData = JSON.parse(currentAuth);
                const token = authData.access_token || authData.token;
                
                if (!token) {
                    console.log('❌ No token found in auth data');
                } else {
                    console.log('✅ Token found in auth data');
                    
                    // Check if token looks like JWT and is expired
                    if (token.includes('.')) {
                        const parts = token.split('.');
                        if (parts.length === 3) {
                            try {
                                const payload = JSON.parse(atob(parts[1]));
                                if (payload.exp) {
                                    const expDate = new Date(payload.exp * 1000);
                                    const now = new Date();
                                    
                                    console.log('⏰ Token expires:', expDate.toLocaleString());
                                    console.log('⏰ Current time:', now.toLocaleString());
                                    
                                    if (now > expDate) {
                                        console.log('❌ Token is EXPIRED - this is the cause of 401 errors');
                                        clearAuth();
                                        console.log('✅ Expired token cleared. Please refresh and login again.');
                                        return;
                                    } else {
                                        console.log('✅ Token is not expired');
                                    }
                                }
                            } catch (e) {
                                console.log('⚠️ Could not decode JWT payload');
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('❌ Auth data is corrupted');
                clearAuth();
                console.log('✅ Corrupted auth data cleared. Please refresh and login again.');
                return;
            }
        } else {
            console.log('ℹ️ No authentication data found (user not logged in)');
        }
        
        // Step 2: Test API connectivity
        const apiWorking = await testAPI();
        
        // Step 3: Provide recommendations
        console.log('\n🎯 === RECOMMENDATIONS ===');
        
        if (!apiWorking) {
            console.log('💡 API connectivity issues detected:');
            console.log('   1. Check your internet connection');
            console.log('   2. CORS proxy may be failing');
            console.log('   3. Backend server may be down');
            console.log('   4. Try refreshing the page');
        } else if (currentAuth) {
            console.log('💡 API is working but authentication is failing:');
            console.log('   1. Your session may have expired');
            console.log('   2. Token format may be incorrect');
            console.log('   3. Server authentication settings may have changed');
            console.log('   4. Try logging out and logging back in');
        } else {
            console.log('💡 You are not logged in:');
            console.log('   1. Please log in to access your notes');
            console.log('   2. If login fails, there may be server issues');
        }
        
        console.log('\n🔧 === QUICK ACTIONS ===');
        console.log('Run these commands in the console:');
        console.log('• quickFix.clearAuth() - Clear authentication data');
        console.log('• quickFix.forceRefresh() - Force refresh the app');
        console.log('• quickFix.testAPI() - Test API connectivity');
    }
    
    // Make functions globally available
    window.quickFix = {
        clearAuth,
        testAPI,
        forceRefresh,
        fix401Issues
    };
    
    // Auto-run the diagnosis
    fix401Issues();
    
    console.log('\n✨ Quick Fix Tool loaded! Use quickFix.* functions for manual control.');
})();
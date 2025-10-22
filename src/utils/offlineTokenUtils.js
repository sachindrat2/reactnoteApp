// Offline Token Detector and Cleaner
// This utility detects when offline tokens are being used for real API calls and fixes the issue

export const offlineTokenUtils = {
  // Check if the current user has an offline token
  hasOfflineToken() {
    try {
      const userData = localStorage.getItem('notesapp_user');
      if (!userData) return false;
      
      const parsed = JSON.parse(userData);
      const token = parsed.access_token || parsed.token;
      
      return token && token.startsWith('offline_token_');
    } catch (e) {
      return false;
    }
  },

  // Check if user is marked as offline
  isOfflineMode() {
    try {
      const userData = localStorage.getItem('notesapp_user');
      if (!userData) return false;
      
      const parsed = JSON.parse(userData);
      return parsed.isOffline === true;
    } catch (e) {
      return false;
    }
  },

  // Clear offline authentication and force proper login
  clearOfflineAuth() {
    console.log('🧹 Clearing offline authentication data...');
    
    const userData = localStorage.getItem('notesapp_user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const token = parsed.access_token || parsed.token;
        
        if (token && token.startsWith('offline_token_')) {
          console.log('🚫 Found offline token:', token.substring(0, 30) + '...');
          
          // Clear all notesapp related data
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('notesapp_')) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('✅ Removed:', key);
          });
          
          // Dispatch event to notify components
          window.dispatchEvent(new CustomEvent('auth:offline-token-cleared', {
            detail: { 
              reason: 'Offline token detected and cleared',
              clearedKeys: keysToRemove
            }
          }));
          
          return true;
        }
      } catch (e) {
        console.error('Error clearing offline auth:', e);
      }
    }
    
    return false;
  },

  // Get user info for offline mode
  getOfflineUserInfo() {
    try {
      const userData = localStorage.getItem('notesapp_user');
      if (!userData) return null;
      
      const parsed = JSON.parse(userData);
      if (!parsed.isOffline) return null;
      
      return {
        id: parsed.user?.id || 'offline_user',
        email: parsed.user?.email || 'offline@example.com',
        name: parsed.user?.name || 'Offline User',
        isOffline: true
      };
    } catch (e) {
      return null;
    }
  },

  // Check if we should make API calls or use offline mode
  shouldUseAPI() {
    // If user has offline token, don't make API calls
    if (this.hasOfflineToken() && this.isOfflineMode()) {
      console.log('🚫 Skipping API call - user is in offline mode');
      return false;
    }
    
    // If user has offline token but is NOT marked offline, clear it
    if (this.hasOfflineToken() && !this.isOfflineMode()) {
      console.warn('⚠️ Found offline token without offline flag - clearing invalid auth');
      this.clearOfflineAuth();
      return false;
    }
    
    return true;
  },

  // Create proper demo notes for offline mode
  getDemoNotes() {
    return [
      {
        id: 'offline-demo-1',
        title: '🔒 You are in Offline Mode',
        content: `Welcome to offline mode! This happens when:

• The server couldn't be reached during login
• Your internet connection is unstable
• The authentication server is temporarily unavailable

**What you can do in offline mode:**
✅ View these demo notes
✅ Create new notes (saved locally)
✅ Edit and delete notes
✅ Search through your notes

**To get back online:**
1. Check your internet connection
2. Click "Logout" and try logging in again
3. Refresh the page if needed

Your data will be saved locally and sync when you're back online.`,
        updated_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
        isDemo: true
      },
      {
        id: 'offline-demo-2',
        title: '📝 How to Use Notes App',
        content: `**Creating Notes:**
• Click the "+" button to create a new note
• Give your note a title and content
• Notes are automatically saved

**Organizing Notes:**
• Use the search box to find specific notes
• Notes are sorted by last modified date
• Click on any note to view or edit it

**Keyboard Shortcuts:**
• Ctrl+N (or Cmd+N): New note
• Ctrl+S (or Cmd+S): Save current note
• Esc: Cancel editing

**Offline Features:**
All your notes are saved locally in your browser and will sync with the server when you're back online.`,
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        isDemo: true
      }
    ];
  }
};

// Auto-check for offline token issues on load
if (typeof window !== 'undefined') {
  // Run check after a short delay to allow other scripts to load
  setTimeout(() => {
    if (offlineTokenUtils.hasOfflineToken() && !offlineTokenUtils.isOfflineMode()) {
      console.warn('🚨 DETECTED: Offline token without offline mode flag');
      console.warn('🔧 This will cause 401 errors. Run offlineTokenUtils.clearOfflineAuth() to fix.');
      
      // Auto-fix if user is not intentionally in offline mode
      offlineTokenUtils.clearOfflineAuth();
    }
  }, 1000);
}
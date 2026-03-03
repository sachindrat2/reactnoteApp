// src/services/profileService.js
import { authAPI, handleAPIError } from './api.js';

export const profileService = {
  async getProfile() {
    try {
      const response = await authAPI.getProfile();
      
      // API returns: { id, username, email, avatar }
      if (response && (response.id || response.username || response.email)) {
        return { success: true, data: response };
      }
      
      return { success: false, error: 'No profile data received' };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { success: false, error: handleAPIError(error) };
    }
  },

  async updateUsername(newUsername) {
    try {
      // Check if token is expired and refresh if needed
      const tokenValid = await this.validateAndRefreshToken();
      if (!tokenValid) {
        return { success: false, error: 'Authentication expired. Please login again.' };
      }
      
      const response = await authAPI.updateUsername(newUsername);
      
      // API returns: { success: true, username: "new_username" }
      if (response && response.success && response.username) {
        return { success: true, data: { username: response.username } };
      }
      
      return { success: false, error: response?.error || 'Failed to update username' };
    } catch (error) {
      console.error('Username update error:', error);
      
      // If it's a 401 error, try one more time with token refresh
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 Retrying username update after 401 error...');
        try {
          const tokenValid = await this.validateAndRefreshToken();
          if (tokenValid) {
            const retryResponse = await authAPI.updateUsername(newUsername);
            if (retryResponse && retryResponse.success && retryResponse.username) {
              return { success: true, data: { username: retryResponse.username } };
            }
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      return { success: false, error: handleAPIError(error) };
    }
  },

  // Helper method to validate and refresh token if needed
  async validateAndRefreshToken() {
    try {
      const userDataStr = localStorage.getItem('notesapp_user');
      if (!userDataStr) {
        console.log('❌ No user data in localStorage');
        return false;
      }
      
      const userData = JSON.parse(userDataStr);
      if (!userData.access_token) {
        console.log('❌ No access token in user data');
        return false;
      }
      
      console.log('🔍 Validating token...', {
        tokenPrefix: userData.access_token.substring(0, 20) + '...',
        hasToken: !!userData.access_token
      });
      
      // Check if token is expired
      const payload = JSON.parse(atob(userData.access_token.split('.')[1]));
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        const timeUntilExpiry = expDate.getTime() - now.getTime();
        
        console.log('⏰ Token timing:', {
          expiresAt: expDate.toISOString(),
          currentTime: now.toISOString(),
          millisecondsUntilExpiry: timeUntilExpiry,
          minutesUntilExpiry: Math.floor(timeUntilExpiry / (1000 * 60))
        });
        
        // If token expires in less than 2 minutes, refresh it
        if (timeUntilExpiry < 2 * 60 * 1000) {
          console.log('🔄 Token expires soon, refreshing...');
          const { refreshTokenAPI } = await import('./api.js');
          const refreshed = await refreshTokenAPI();
          
          if (refreshed && refreshed.access_token) {
            const newUserData = { ...userData, ...refreshed };
            localStorage.setItem('notesapp_user', JSON.stringify(newUserData));
            console.log('✅ Token refreshed successfully');
            
            // Dispatch custom event to update auth context
            window.dispatchEvent(new CustomEvent('auth:token-refreshed', {
              detail: { userData: newUserData }
            }));
            
            return true;
          }
        } else {
          console.log('✅ Token is still valid for', Math.floor(timeUntilExpiry / (1000 * 60)), 'minutes');
        }
      }
      
      return true; // Token is still valid
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  },

  async updateEmail(newEmail) {
    try {
      // Check if token is expired and refresh if needed
      const tokenValid = await this.validateAndRefreshToken();
      if (!tokenValid) {
        return { success: false, error: 'Authentication expired. Please login again.' };
      }
      
      const response = await authAPI.updateEmail(newEmail);
      
      // API returns: { success: true, email: "new_email" }
      if (response && response.success && response.email) {
        return { success: true, data: { email: response.email } };
      }
      
      return { success: false, error: response?.error || 'Failed to update email' };
    } catch (error) {
      console.error('Email update error:', error);
      
      // If it's a 401 error, try one more time with token refresh
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 Retrying email update after 401 error...');
        try {
          const tokenValid = await this.validateAndRefreshToken();
          if (tokenValid) {
            const retryResponse = await authAPI.updateEmail(newEmail);
            if (retryResponse && retryResponse.success && retryResponse.email) {
              return { success: true, data: { email: retryResponse.email } };
            }
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      return { success: false, error: handleAPIError(error) };
    }
  },

  async uploadAvatar(avatarFile) {
    try {
      console.log('📤 Uploading avatar file:', {
        name: avatarFile.name,
        size: avatarFile.size,
        type: avatarFile.type
      });
      
      const response = await authAPI.uploadAvatar(avatarFile);
      
      // API returns: { success: true, avatar: "/path/to/avatar.png" }
      if (response && response.success && response.avatar) {
        return { success: true, data: { avatar: response.avatar } };
      }
      
      console.error('❌ Avatar upload failed:', response);
      return { success: false, error: response?.error || response?.message || 'Failed to upload avatar' };
    } catch (error) {
      console.error('Avatar upload error:', error);
      
      // Try to extract meaningful error message
      let errorMessage = 'Failed to upload avatar';
      if (error.message && error.message !== '[object Object]') {
        errorMessage = error.message;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: handleAPIError(error) };
    }
  },

  async removeAvatar() {
    try {
      const response = await authAPI.removeAvatar();
      
      // API returns: { success: true, message: "Avatar removed." }
      if (response && response.success) {
        return { success: true, data: { message: response.message || 'Avatar removed' } };
      }
      
      return { success: false, error: response?.message || 'Failed to remove avatar' };
    } catch (error) {
      console.error('Avatar removal error:', error);
      return { success: false, error: handleAPIError(error) };
    }
  },

  // Legacy method - kept for backward compatibility but uses individual endpoints
  async updateProfile({ name, email, avatar }) {
    try {
      let results = [];
      
      // Update username if provided
      if (name) {
        const result = await this.updateUsername(name);
        if (!result.success) {
          return result;
        }
        results.push({ username: result.data.username });
      }
      
      // Update email if provided
      if (email) {
        const result = await this.updateEmail(email);
        if (!result.success) {
          return result;
        }
        results.push({ email: result.data.email });
      }
      
      // Upload avatar if provided
      if (avatar) {
        const result = await this.uploadAvatar(avatar);
        if (!result.success) {
          return result;
        }
        results.push({ avatar: result.data.avatar });
      }
      
      // Combine all results
      const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      return { success: true, data: combinedData };
      
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: handleAPIError(error) };
    }
  },
};

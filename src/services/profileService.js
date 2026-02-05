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
      const response = await authAPI.updateUsername(newUsername);
      
      // API returns: { success: true, username: "new_username" }
      if (response && response.success && response.username) {
        return { success: true, data: { username: response.username } };
      }
      
      return { success: false, error: response?.error || 'Failed to update username' };
    } catch (error) {
      console.error('Username update error:', error);
      return { success: false, error: handleAPIError(error) };
    }
  },

  async updateEmail(newEmail) {
    try {
      const response = await authAPI.updateEmail(newEmail);
      
      // API returns: { success: true, email: "new_email" }
      if (response && response.success && response.email) {
        return { success: true, data: { email: response.email } };
      }
      
      return { success: false, error: response?.error || 'Failed to update email' };
    } catch (error) {
      console.error('Email update error:', error);
      return { success: false, error: handleAPIError(error) };
    }
  },

  async uploadAvatar(avatarFile) {
    try {
      const response = await authAPI.uploadAvatar(avatarFile);
      
      // API returns: { success: true, avatar: "/path/to/avatar.png" }
      if (response && response.success && response.avatar) {
        return { success: true, data: { avatar: response.avatar } };
      }
      
      return { success: false, error: response?.error || 'Failed to upload avatar' };
    } catch (error) {
      console.error('Avatar upload error:', error);
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

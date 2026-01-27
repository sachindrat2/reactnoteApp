// src/services/profileService.js
import apiRequest from './api.js';

export const profileService = {
  async getProfile() {
    try {
      const res = await apiRequest('/profile', { method: 'GET' });
      if (res && res.data) {
        return { success: true, data: res.data };
      }
      if (res && res.success && res.success === true) {
        return { success: true, data: res };
      }
      return { success: false, error: 'No profile data' };
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to fetch profile' };
    }
  },

  async updateProfile({ name, email, avatar }) {
    try {
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (email) formData.append('email', email);
      if (avatar) formData.append('avatar', avatar);
      const res = await apiRequest('/profile', {
        method: 'PUT',
        body: formData
      });
      if (res && res.data && res.data.success) {
        return { success: true, data: res.data };
      }
      if (res && res.success === true) {
        return { success: true, data: res };
      }
      return { success: false, error: res?.data?.message || 'Profile update failed' };
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to update profile' };
    }
  },

  async removeAvatar() {
    try {
      const res = await apiRequest('/profile/avatar', { method: 'DELETE' });
      if (res && res.data && res.data.success) {
        return { success: true, data: res.data };
      }
      if (res && res.success === true) {
        return { success: true, data: res };
      }
      return { success: false, error: res?.data?.message || 'Failed to remove avatar' };
    } catch (error) {
      return { success: false, error: error?.message || 'Failed to remove avatar' };
    }
  },
};

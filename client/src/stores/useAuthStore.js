import { create } from 'zustand';
import api from '../config/api';
import { connectSocket, disconnectSocket } from '../config/socket';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token') || null,
  isAuthenticated: !!localStorage.getItem('pos_token'),
  onboardingCompleted: JSON.parse(localStorage.getItem('pos_onboarding') || 'true'),
  loading: false,
  error: null,

  register: async ({ name, email, password, businessName, phone, otpCode }) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password, businessName, phone, otpCode });
      const { token, user, onboardingCompleted } = data.data;

      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_user', JSON.stringify(user));
      localStorage.setItem('pos_onboarding', JSON.stringify(onboardingCompleted));

      connectSocket(token);

      set({ user, token, isAuthenticated: true, onboardingCompleted, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  requestOTP: async (email, type) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/request-otp', { email, type });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reset password';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user, onboardingCompleted } = data.data;

      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_user', JSON.stringify(user));
      localStorage.setItem('pos_onboarding', JSON.stringify(onboardingCompleted));

      // Connect socket after login
      connectSocket(token);

      set({ user, token, isAuthenticated: true, onboardingCompleted, loading: false });
      return { success: true, onboardingCompleted };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_onboarding');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false, onboardingCompleted: true });
  },
}));

export default useAuthStore;

import { create } from 'zustand';
import api from '../config/api';
import { connectSocket, disconnectSocket } from '../config/socket';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token') || null,
  isAuthenticated: !!localStorage.getItem('pos_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { token, user } = data.data;

      localStorage.setItem('pos_token', token);
      localStorage.setItem('pos_user', JSON.stringify(user));

      // Connect socket after login
      connectSocket(token);

      set({ user, token, isAuthenticated: true, loading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: message });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;

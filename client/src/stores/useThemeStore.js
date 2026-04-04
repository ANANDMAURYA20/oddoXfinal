import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
  mode: localStorage.getItem('theme_mode') || 'light',

  toggleMode: () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme_mode', next);
    set({ mode: next });
  },

  setMode: (mode) => {
    localStorage.setItem('theme_mode', mode);
    set({ mode });
  },
}));

export default useThemeStore;

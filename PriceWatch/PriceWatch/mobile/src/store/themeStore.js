// PriceWatch — store/themeStore.js
import { create } from 'zustand';

export const useThemeStore = create((set, get) => ({
  isDark: false,
  systemScheme: 'light',

  toggleDark: () => set(s => ({ isDark: !s.isDark })),

  setSystemScheme: (scheme) => {
    const isDark = scheme === 'dark';
    set({ systemScheme: scheme, isDark });
  },
}));

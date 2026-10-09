import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme) => {
        applyThemeToDOM(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDOM(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: 'crmos-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDOM(state.theme);
        } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          applyThemeToDOM('dark');
          state?.setTheme('dark');
        }
      },
    }
  )
);

// Initialize immediately upon script evaluation
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('crmos-theme-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.theme) {
        applyThemeToDOM(parsed.state.theme);
      }
    }
  } catch (e) {
    console.error('Kon thema niet direct initialiseren:', e);
  }
}

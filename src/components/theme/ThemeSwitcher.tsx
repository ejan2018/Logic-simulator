'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { THEMES } from '@/lib/themes';

const STORAGE_KEY = 'logicsim-theme';
const DARK_THEMES = ['dark', 'cyberpunk', 'matrix', 'hacker', 'sunset', 'forest', 'royal'];

function applyThemeToDOM(themeId: string) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
  if (DARK_THEMES.includes(themeId)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, themeId);
}

function useMounted() { return useSyncExternalStore(() => () => {}, () => true, () => false); }

// Initialize theme from localStorage on first render
function getInitialTheme(): string {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  applyThemeToDOM(saved);
  return saved;
}

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<string>(getInitialTheme);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();

  const handleSelect = useCallback((themeId: string) => {
    setCurrentTheme(themeId);
    applyThemeToDOM(themeId);
    setOpen(false);
  }, []);

  const current = THEMES.find((t) => t.id === currentTheme) ?? THEMES[0];

  if (!mounted) {
    return <button type="button" className="h-9 px-2.5 rounded-md border border-border bg-card inline-flex items-center gap-1.5 text-xs"><span className="text-base">{current.icon}</span></button>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 px-2.5 rounded-md border border-border bg-card hover:bg-accent inline-flex items-center gap-1.5 transition-colors text-xs"
        title="Change theme"
      >
        <span className="text-base">{current.icon}</span>
        <span className="hidden sm:inline">{current.name}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors ${
                  currentTheme === t.id ? 'bg-primary/10 font-semibold' : ''
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span>{t.name}</span>
                {currentTheme === t.id && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

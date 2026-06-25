'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

function useMounted() { return useSyncExternalStore(() => () => {}, () => true, () => false); }

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <button type="button" className="w-9 h-9 rounded-md border border-border bg-card inline-flex items-center justify-center" aria-label="Toggle theme"><Sun className="h-4 w-4" /></button>;
  const isDark = theme === 'dark';
  return <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="w-9 h-9 rounded-md border border-border bg-card hover:bg-accent inline-flex items-center justify-center transition-colors" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>{isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-600" />}</button>;
}

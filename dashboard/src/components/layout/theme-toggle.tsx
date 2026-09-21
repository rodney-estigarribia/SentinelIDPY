'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

type ThemeMode = 'system' | 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem('sentinel_theme') as ThemeMode) || 'system';
    setTheme(stored);
    applyTheme(stored);

    // Listen to computer OS system theme preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentStored = (localStorage.getItem('sentinel_theme') as ThemeMode) || 'system';
      if (currentStored === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (mode === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // System mode: Follow computer OS setting
      if (systemDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  };

  const handleSelectTheme = (newMode: ThemeMode) => {
    setTheme(newMode);
    localStorage.setItem('sentinel_theme', newMode);
    applyTheme(newMode);
  };

  const cycleTheme = () => {
    let next: ThemeMode = 'system';
    if (theme === 'system') next = 'light';
    else if (theme === 'light') next = 'dark';
    else if (theme === 'dark') next = 'system';
    handleSelectTheme(next);
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center opacity-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm"
      title={`Tema actual: ${
        theme === 'system' ? 'Sistema (Automático)' : theme === 'light' ? 'Modo Claro' : 'Modo Oscuro'
      }. Haz clic para cambiar.`}
    >
      {theme === 'system' && (
        <>
          <Laptop className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline text-[11px]">Auto</span>
        </>
      )}
      {theme === 'light' && (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline text-[11px]">Claro</span>
        </>
      )}
      {theme === 'dark' && (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline text-[11px]">Oscuro</span>
        </>
      )}
    </button>
  );
}

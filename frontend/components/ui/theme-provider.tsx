'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

const ThemeProvider = ({ children, attribute = 'class', defaultTheme = 'light', enableSystem = true }: ThemeProviderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const stored = window.localStorage.getItem('theme') as Theme | null;
    let theme = stored || defaultTheme;

    if (theme === 'system' && enableSystem) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = isDark ? 'dark' : 'light';
    }

    root.setAttribute(attribute, theme);
    setMounted(true);
  }, [attribute, defaultTheme, enableSystem]);

  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return <div>{children}</div>;
};

export { ThemeProvider };

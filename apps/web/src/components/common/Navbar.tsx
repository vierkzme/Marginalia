import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Brain, BarChart3, BookmarkCheck, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('criv_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('criv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('criv_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-editorial-rust text-editorial-rust dark:border-editorial-orange dark:text-editorial-orange font-semibold'
        : 'border-transparent text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-paper-light/95 dark:bg-ink-dark/95 backdrop-blur-sm border-b border-[#E7E2D8] dark:border-[#262930]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-2 text-ink-charcoal dark:text-ink-ivory group">
              <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-paper-cream dark:bg-ink-elevated text-editorial-rust dark:text-editorial-orange border border-[#E7E2D8] dark:border-[#262930]">
                01
              </span>
              <span className="font-serif text-xl font-bold tracking-tight">
                Marginalia <span className="font-sans text-xs font-normal text-ink-graphite dark:text-ink-pewter">Vault</span>
              </span>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              <NavLink to="/" end className={navLinkClass}>
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                Library
              </NavLink>
              <NavLink to="/review" className={navLinkClass}>
                <Brain className="w-4 h-4" aria-hidden="true" />
                Daily Review
              </NavLink>
              <NavLink to="/vault" className={navLinkClass}>
                <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                Idiom Vault
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                Analytics
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded border border-[#E7E2D8] dark:border-[#262930] hover:bg-paper-cream dark:hover:bg-ink-elevated text-ink-graphite dark:text-ink-pewter hover:text-ink-charcoal dark:hover:text-ink-ivory transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

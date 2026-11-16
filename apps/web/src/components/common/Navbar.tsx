import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Brain, BarChart3, BookmarkCheck, Sun, Moon, Flame } from 'lucide-react';
import { api } from '../../api/client';

export const Navbar: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('criv_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [streakCount, setStreakCount] = useState<number>(14);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('criv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('criv_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    let mounted = true;
    api.auth
      .me()
      .then((res: any) => {
        const user = res?.data || res;
        if (mounted && typeof user?.currentStreak === 'number') {
          setStreakCount(user.currentStreak);
        }
      })
      .catch(() => {
        // Keep default streak badge when offline
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all ${
      isActive
        ? 'bg-[#141413] dark:bg-violet-brand text-white shadow-xs'
        : 'text-ink-muted hover:text-[#141413] dark:text-ink-pewter dark:hover:text-ink-ivory hover:bg-paper-cream dark:hover:bg-ink-surface'
    }`;

  const mobileDockLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-center flex-1 py-2.5 rounded-xl transition-all ${
      isActive
        ? 'bg-[#141413] dark:bg-violet-brand text-white'
        : 'text-[#141413] dark:text-ink-pewter hover:bg-paper-cream dark:hover:bg-ink-surface'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-canvas-cream/95 dark:bg-ink-dark/95 backdrop-blur-sm border-b-2 border-[#141413] dark:border-[#3A3E4C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <NavLink to="/" className="flex items-center gap-2.5 text-[#141413] dark:text-ink-ivory group">
              <span className="font-mono text-xs font-extrabold px-2 py-1 rounded-lg bg-violet-brand text-white border-2 border-[#141413] dark:border-[#3A3E4C] shadow-brutal-xs">
                M
              </span>
              <span className="font-sans text-xl font-extrabold tracking-tight">
                Marginalia
              </span>
            </NavLink>

            <nav
              className="hidden md:flex items-center gap-1 p-1 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated shadow-brutal-xs dark:shadow-brutal-dark-xs"
              aria-label="Primary"
            >
              <NavLink to="/" end className={navLinkClass}>
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Library</span>
              </NavLink>
              <NavLink to="/review" className={navLinkClass}>
                <Brain className="w-4 h-4" aria-hidden="true" />
                <span>Daily Review</span>
              </NavLink>
              <NavLink to="/vault" className={navLinkClass}>
                <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                <span>Idiom Vault</span>
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span>Analytics</span>
              </NavLink>
            </nav>

            <div className="flex items-center gap-2.5">
              <NavLink
                to="/dashboard"
                aria-label={`${streakCount} day learning streak`}
                className="brutal-pill-btn inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-ink-elevated text-sm font-extrabold text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-surface"
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-400" aria-hidden="true" />
                <span className="font-mono tabular-nums">{streakCount}</span>
              </NavLink>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="brutal-pill-btn p-2 bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-surface"
              >
                {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Pill-Dock matching reference bottom bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm p-1.5 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated shadow-brutal dark:shadow-brutal-dark flex items-center gap-1"
      >
        <NavLink to="/" end className={mobileDockLinkClass} aria-label="Library">
          <BookOpen className="w-5 h-5" aria-hidden="true" />
        </NavLink>
        <NavLink to="/review" className={mobileDockLinkClass} aria-label="Daily Review">
          <Brain className="w-5 h-5" aria-hidden="true" />
        </NavLink>
        <NavLink to="/vault" className={mobileDockLinkClass} aria-label="Idiom Vault">
          <BookmarkCheck className="w-5 h-5" aria-hidden="true" />
        </NavLink>
        <NavLink to="/dashboard" className={mobileDockLinkClass} aria-label="Analytics">
          <BarChart3 className="w-5 h-5" aria-hidden="true" />
        </NavLink>
      </nav>
    </>
  );
};

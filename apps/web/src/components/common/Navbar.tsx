import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  BarChart3,
  BookmarkCheck,
  Sun,
  Moon,
  Flame,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isDark, toggleTheme, logout } = useAuth();

  if (!user) {
    return null;
  }

  const streakCount = user.currentStreak ?? 0;
  const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Account';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs lg:text-sm font-bold transition-all ${
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
          <div className="flex items-center justify-between h-16 gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 text-[#141413] dark:text-ink-ivory group shrink-0">
              <span className="font-mono text-xs font-extrabold px-2 py-1 rounded-lg bg-violet-brand text-white border-2 border-[#141413] dark:border-[#3A3E4C] shadow-brutal-xs">
                M
              </span>
              <span className="font-sans text-lg sm:text-xl font-extrabold tracking-tight">
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
                <span>Review</span>
              </NavLink>
              <NavLink to="/vault" className={navLinkClass}>
                <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                <span>Vault</span>
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                <span>Analytics</span>
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span>Settings</span>
              </NavLink>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <NavLink
                to="/dashboard"
                aria-label={`${streakCount} day learning streak`}
                className="brutal-pill-btn inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-white dark:bg-ink-elevated text-xs sm:text-sm font-extrabold text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-surface"
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-400" aria-hidden="true" />
                <span className="font-mono tabular-nums">{streakCount}</span>
              </NavLink>

              <NavLink
                to="/settings"
                aria-label="Account and Settings"
                className="hidden sm:inline-flex brutal-pill-btn items-center gap-1.5 px-3 py-1 bg-violet-soft dark:bg-violet-darkSoft text-xs font-extrabold text-violet-brand dark:text-violet-bright"
              >
                <span>{firstName}</span>
                {user.isDemo && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white text-[#141413] text-[9px] font-mono">
                    DEMO
                  </span>
                )}
              </NavLink>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="brutal-pill-btn p-2 bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-surface"
              >
                {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log Out"
                title="Log Out"
                className="brutal-pill-btn inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-950 text-rose-950 dark:text-rose-200 text-xs font-extrabold"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden lg:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Pill-Dock */}
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
        <NavLink to="/settings" className={mobileDockLinkClass} aria-label="Settings">
          <Settings className="w-5 h-5" aria-hidden="true" />
        </NavLink>
      </nav>
    </>
  );
};

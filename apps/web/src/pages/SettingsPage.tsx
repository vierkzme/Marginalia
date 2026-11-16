import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sliders,
  LogOut,
  Save,
  Check,
  Sparkles,
  Sun,
  Moon,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getReaderPreferences,
  setReaderPreferences,
  ReaderPreferences,
} from '../api/client';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isDark, setThemeDark, updateProfile, loginAsDemo, logout } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [dailyGoal, setDailyGoal] = useState<number>(user?.dailyReviewGoal ?? 20);
  const [newPassword, setNewPassword] = useState('');
  const [readerPrefs, setReaderPrefsState] = useState<ReaderPreferences>(() =>
    getReaderPreferences()
  );

  const [saving, setSaving] = useState(false);
  const [switchingDemo, setSwitchingDemo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setDailyGoal(user.dailyReviewGoal);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(null);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        dailyReviewGoal: Number(dailyGoal),
        ...(newPassword.trim().length > 0 ? { newPassword: newPassword.trim() } : {}),
      });
      setNewPassword('');
      setSaveSuccess('Profile & learning goal saved!');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateReaderPref = (patch: Partial<ReaderPreferences>) => {
    const next = { ...readerPrefs, ...patch };
    setReaderPrefsState(next);
    setReaderPreferences(next);
    setSaveSuccess('Reader preferences updated!');
    setTimeout(() => setSaveSuccess(null), 2500);
  };

  const handleSwitchToDemo = async () => {
    setSwitchingDemo(true);
    setErrorMsg(null);
    try {
      await loginAsDemo();
      navigate('/');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not switch to demo account.');
    } finally {
      setSwitchingDemo(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas-cream dark:bg-ink-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-7">
        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter block mb-1">
              PREFERENCES &amp; ACCOUNT
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
              Settings
            </h1>
          </div>

          <span
            className={`px-3.5 py-1 rounded-full border-2 border-[#141413] text-xs font-mono font-extrabold shadow-brutal-xs ${
              user?.isDemo
                ? 'bg-amber-200 text-[#141413]'
                : 'bg-emerald-200 text-emerald-950'
            }`}
          >
            {user?.isDemo ? 'DEMO ACCOUNT' : 'PERSONAL ACCOUNT'}
          </span>
        </div>

        {saveSuccess && (
          <div
            role="status"
            className="brutal-card-sm p-3.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 text-xs font-extrabold flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="brutal-card-sm p-3.5 bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 text-xs font-extrabold"
          >
            {errorMsg}
          </div>
        )}

        {/* CARD 1: PROFILE & SM-2 LEARNING GOAL */}
        <section className="brutal-card p-6 border-t-4 border-t-violet-brand space-y-5">
          <div className="flex items-center gap-2.5 border-b-2 border-[#141413]/15 dark:border-[#3A3E4C] pb-3">
            <span className="w-9 h-9 rounded-full border-2 border-[#141413] bg-violet-soft text-violet-brand flex items-center justify-center">
              <User className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-sans text-lg font-extrabold text-[#141413] dark:text-ink-ivory">
                Profile &amp; Daily Review Goal
              </h2>
              <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter">
                Signed in as <strong>{user?.email}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="settings-fullname"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5"
              >
                Full Name
              </label>
              <input
                id="settings-fullname"
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="brutal-input w-full rounded-2xl px-4 py-2.5 text-sm font-semibold"
              />
            </div>

            <div>
              <label
                htmlFor="settings-daily-goal"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5"
              >
                Daily Cloze Review Goal (Cards / Day)
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {[10, 20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDailyGoal(preset)}
                    className={`brutal-pill-btn px-4 py-1.5 text-xs font-mono font-extrabold ${
                      dailyGoal === preset
                        ? 'bg-violet-brand text-white'
                        : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <input
                  id="settings-daily-goal"
                  type="number"
                  min={5}
                  max={200}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value) || 20)}
                  className="brutal-input w-24 rounded-full px-3.5 py-1.5 text-xs font-mono font-bold text-center"
                />
              </div>
            </div>

            {!user?.isDemo && (
              <div>
                <label
                  htmlFor="settings-new-password"
                  className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5"
                >
                  New Password (Leave blank to keep current)
                </label>
                <input
                  id="settings-new-password"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="brutal-input w-full rounded-2xl px-4 py-2.5 text-sm"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </section>

        {/* CARD 2: READER & APPEARANCE PREFERENCES */}
        <section className="brutal-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b-2 border-[#141413]/15 dark:border-[#3A3E4C] pb-3">
            <span className="w-9 h-9 rounded-full border-2 border-[#141413] bg-amber-100 text-[#141413] flex items-center justify-center">
              <Sliders className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-sans text-lg font-extrabold text-[#141413] dark:text-ink-ivory">
                Reader &amp; Appearance
              </h2>
              <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter">
                Customize your workspace theme and default distraction-free reader typography
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* App Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory">
                  Workspace Theme
                </div>
                <div className="text-xs text-ink-muted dark:text-ink-pewter">
                  Switch between Warm Cream Light and Deep Ink Dark mode
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setThemeDark(false)}
                  aria-pressed={!isDark}
                  className={`brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold ${
                    !isDark
                      ? 'bg-[#141413] text-white'
                      : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setThemeDark(true)}
                  aria-pressed={isDark}
                  className={`brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-extrabold ${
                    isDark
                      ? 'bg-violet-brand text-white'
                      : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Reader Font Size */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#141413]/10 dark:border-[#3A3E4C]">
              <div>
                <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-violet-brand" aria-hidden="true" />
                  <span>Default Reader Font Size</span>
                </div>
                <div className="text-xs text-ink-muted dark:text-ink-pewter">
                  Applied automatically when opening articles
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => {
                  const labels = { sm: 'S', base: 'M', lg: 'L', xl: 'XL' };
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleUpdateReaderPref({ fontSize: sz })}
                      aria-pressed={readerPrefs.fontSize === sz}
                      className={`brutal-pill-btn px-3.5 py-1.5 text-xs font-mono font-extrabold ${
                        readerPrefs.fontSize === sz
                          ? 'bg-violet-brand text-white'
                          : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {labels[sz]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reader Paper Theme */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#141413]/10 dark:border-[#3A3E4C]">
              <div>
                <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory">
                  Default Reader Sheet Theme
                </div>
                <div className="text-xs text-ink-muted dark:text-ink-pewter">
                  Paper tint used inside the Web Reader sheet
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {(['light', 'sepia', 'dark'] as const).map((theme) => {
                  const labels = { light: 'Paper', sepia: 'Sepia', dark: 'Dark' };
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => handleUpdateReaderPref({ readingTheme: theme })}
                      aria-pressed={readerPrefs.readingTheme === theme}
                      className={`brutal-pill-btn px-3.5 py-1.5 text-xs font-extrabold ${
                        readerPrefs.readingTheme === theme
                          ? 'bg-[#141413] dark:bg-violet-brand text-white'
                          : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {labels[theme]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CARD 3: SESSION & LOG OUT */}
        <section className="brutal-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-sans text-lg font-extrabold text-[#141413] dark:text-ink-ivory">
              Session Management
            </h2>
            <p className="text-xs text-ink-muted dark:text-ink-pewter font-mono mt-0.5">
              {user?.isDemo
                ? 'You are exploring the seeded Demo Account (Raka Developer).'
                : 'Switch to the seeded Demo Account anytime or sign out.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!user?.isDemo && (
              <button
                type="button"
                onClick={handleSwitchToDemo}
                disabled={switchingDemo}
                className="brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-violet-soft hover:bg-violet-progress text-violet-brand"
              >
                {switchingDemo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Use Demo Account</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold bg-rose-100 hover:bg-rose-200 text-rose-950"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

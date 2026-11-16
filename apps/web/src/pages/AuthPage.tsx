import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BauhausHeaderArt } from '../components/common/BauhausHeaderArt';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dailyGoal, setDailyGoal] = useState<number>(20);

  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
  }, [initialMode]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          fullName,
          dailyReviewGoal: dailyGoal,
        });
      }
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg(null);
    try {
      await loginAsDemo();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not enter demo account.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-cream dark:bg-ink-dark flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md brutal-card rounded-3xl overflow-hidden">
        {/* BAUHAUS BANNER */}
        <div className="relative border-b-2 border-[#141413] dark:border-[#3A3E4C] overflow-hidden">
          <BauhausHeaderArt variant="mondrian" className="w-full h-36 sm:h-40" />
          <div className="absolute top-3 left-4 flex items-center gap-2 px-3 py-1 rounded-full border-2 border-[#141413] bg-white shadow-brutal-xs">
            <span className="w-5 h-5 rounded-md bg-violet-brand text-white font-mono text-[11px] font-extrabold flex items-center justify-center">
              M
            </span>
            <span className="font-sans text-xs font-extrabold text-[#141413]">Marginalia</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white dark:bg-ink-elevated space-y-5">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright text-[11px] font-extrabold uppercase tracking-wider mb-2">
              {mode === 'login' ? 'SIGN IN TO VAULT' : 'CREATE ACCOUNT'}
            </span>
            <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
              {mode === 'login' ? 'Welcome back' : 'Start your vault'}
            </h1>
            <p className="text-xs text-ink-muted dark:text-ink-pewter mt-1 font-medium">
              Contextual Reading &amp; Idiom Vault powered by spaCy NLP and SuperMemo-2.
            </p>
          </div>

          {/* MODE TOGGLE PILLS */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream dark:bg-ink-surface">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'login'
                  ? 'bg-[#141413] dark:bg-violet-brand text-white'
                  : 'text-[#141413] dark:text-ink-pewter hover:text-violet-brand'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'register'
                  ? 'bg-[#141413] dark:bg-violet-brand text-white'
                  : 'text-[#141413] dark:text-ink-pewter hover:text-violet-brand'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Register</span>
            </button>
          </div>

          {/* INSTANT DEMO ACCOUNT CTA */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading || submitting}
            className="brutal-pill-btn w-full py-3 px-4 bg-violet-soft hover:bg-violet-progress dark:bg-violet-darkSoft dark:hover:bg-violet-brand/40 text-violet-brand dark:text-violet-bright font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {demoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Continue with Demo Account (Raka)</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] w-full" />
            <span className="bg-white dark:bg-ink-elevated px-3 text-[10px] font-mono font-bold uppercase tracking-widest text-ink-muted shrink-0">
              OR USE EMAIL
            </span>
            <div className="border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] w-full" />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border-2 border-[#141413] dark:border-rose-700 text-rose-950 dark:text-rose-200 text-xs font-bold"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-fullname"
                  className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ardy Nugroho"
                  className="brutal-input w-full rounded-2xl px-4 py-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1"
              >
                Email Address *
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="brutal-input w-full rounded-2xl px-4 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1"
              >
                Password *
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={mode === 'register' ? 6 : 1}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter password'}
                className="brutal-input w-full rounded-2xl px-4 py-2.5 text-sm"
              />
            </div>

            {mode === 'register' && (
              <div>
                <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
                  Daily SM-2 Review Goal
                </span>
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 50].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setDailyGoal(goal)}
                      className={`flex-1 py-1.5 rounded-full border-2 border-[#141413] text-xs font-mono font-extrabold transition-colors ${
                        dailyGoal === goal
                          ? 'bg-violet-brand text-white'
                          : 'bg-canvas-cream dark:bg-ink-surface text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || demoLoading}
              className="brutal-pill-btn w-full py-3 mt-2 bg-violet-brand hover:bg-violet-hover text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="pt-2 text-center text-[11px] font-mono text-ink-muted dark:text-ink-pewter">
              Demo credentials: <strong>raka@engineering.dev</strong> / <strong>password123</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

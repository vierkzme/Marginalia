import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { MarginaliaLogo } from './components/common/MarginaliaLogo';
import { LibraryPage } from './pages/LibraryPage';
import { AuthPage } from './pages/AuthPage';

function lazyPage<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as React.ComponentType };
  });
}

const ReaderPage = lazyPage(() => import('./pages/ReaderPage'), 'ReaderPage');
const ReviewPage = lazyPage(() => import('./pages/ReviewPage'), 'ReviewPage');
const VaultPage = lazyPage(() => import('./pages/VaultPage'), 'VaultPage');
const DashboardPage = lazyPage(() => import('./pages/DashboardPage'), 'DashboardPage');
const SettingsPage = lazyPage(() => import('./pages/SettingsPage'), 'SettingsPage');

const RouteFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
    <Loader2 className="w-6 h-6 animate-spin text-violet-brand mb-2" />
    <p className="font-mono text-xs font-bold text-ink-muted dark:text-ink-pewter">
      Loading view...
    </p>
  </div>
);

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas-cream dark:bg-ink-dark">
        <MarginaliaLogo className="w-12 h-12 mb-3" />
        <Loader2 className="w-6 h-6 animate-spin text-violet-brand mb-2" />
        <p className="font-mono text-xs font-bold text-ink-muted dark:text-ink-pewter">
          Restoring session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas-cream dark:bg-ink-dark text-ink-border dark:text-ink-ivory font-sans selection:bg-violet-brand selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-violet-brand focus:text-white focus:border-2 focus:border-[#141413] focus:font-bold"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-8 focus:outline-none">
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <LibraryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reader/:articleId"
            element={
              <ProtectedLayout>
                <ReaderPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reader/:id"
            element={
              <ProtectedLayout>
                <ReaderPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/review"
            element={
              <ProtectedLayout>
                <ReviewPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/vault"
            element={
              <ProtectedLayout>
                <VaultPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout>
                <SettingsPage />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

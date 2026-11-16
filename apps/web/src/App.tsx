import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { ReviewPage } from './pages/ReviewPage';
import { VaultPage } from './pages/VaultPage';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas-cream dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
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
        {children}
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

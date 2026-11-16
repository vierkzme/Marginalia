import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { ReviewPage } from './pages/ReviewPage';
import { VaultPage } from './pages/VaultPage';
import { DashboardPage } from './pages/DashboardPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-canvas-cream dark:bg-ink-dark text-ink-border dark:text-ink-ivory font-sans selection:bg-violet-brand selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-violet-brand focus:text-white focus:border-2 focus:border-[#141413] focus:font-bold"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 pb-24 md:pb-8 focus:outline-none">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/reader/:articleId" element={<ReaderPage />} />
            <Route path="/reader/:id" element={<ReaderPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;

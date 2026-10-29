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
      <div className="min-h-screen flex flex-col bg-paper-light dark:bg-ink-dark text-ink-charcoal dark:text-ink-ivory font-sans selection:bg-editorial-rust selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/reader/:articleId" element={<ReaderPage />} />
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

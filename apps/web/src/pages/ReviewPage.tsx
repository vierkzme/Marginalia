import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ClozeCard, DueReviewItem } from '../components/quiz/ClozeCard';
import { ReviewButtonType } from '../components/quiz/SM2GradeButtons';
import { Loader2, CheckCircle2, BookMarked, ArrowRight, RefreshCw, Trophy } from 'lucide-react';

export const ReviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<DueReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [grading, setGrading] = useState(false);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [reviewedStats, setReviewedStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0,
  });

  const cardStartTimeRef = useRef<number>(Date.now());

  const fetchDueReviews = () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionFinished(false);

    api.reviews
      .getDue()
      .then((res: any) => {
        const dueCards = res?.data?.cards || res?.cards || (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(dueCards)) {
          setCards(dueCards);
          cardStartTimeRef.current = Date.now();
        } else {
          setError(res?.error || 'Failed to fetch due review cards.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error while fetching reviews.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDueReviews();
  }, []);

  const handleGrade = async (button: ReviewButtonType) => {
    if (grading || currentIndex >= cards.length) return;

    const currentCard = cards[currentIndex];
    const responseTimeMs = Date.now() - cardStartTimeRef.current;
    setGrading(true);

    try {
      await api.reviews.grade(currentCard.vocabItemId, {
        button,
        responseTimeMs,
      });

      setReviewedStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        again: button === 'AGAIN' ? prev.again + 1 : prev.again,
        hard: button === 'HARD' ? prev.hard + 1 : prev.hard,
        good: button === 'GOOD' ? prev.good + 1 : prev.good,
        easy: button === 'EASY' ? prev.easy + 1 : prev.easy,
      }));

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        cardStartTimeRef.current = Date.now();
      } else {
        setSessionFinished(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit grade.';
      alert(msg);
    } finally {
      setGrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
        <p className="font-mono font-semibold text-sm text-ink-muted dark:text-ink-pewter">
          Loading your spaced repetition due deck...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark text-center">
        <div className="brutal-card p-8 max-w-md space-y-4">
          <h1 className="font-sans text-2xl font-extrabold">Review Deck Error</h1>
          <p className="text-sm text-ink-muted dark:text-ink-pewter">{error}</p>
          <button
            type="button"
            onClick={fetchDueReviews}
            className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-sm font-extrabold bg-violet-brand text-white"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  if (sessionFinished) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark">
        <div className="w-full max-w-md brutal-card rounded-3xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full border-2 border-[#141413] bg-violet-soft text-violet-brand mx-auto flex items-center justify-center shadow-brutal-xs">
            <Trophy className="w-8 h-8" aria-hidden="true" />
          </div>

          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight">Session Complete!</h1>
            <p className="text-sm text-ink-muted dark:text-ink-pewter font-mono mt-1">
              You reviewed {reviewedStats.total} cards with SuperMemo-2 scheduling.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono py-3 border-y-2 border-[#141413]/15 dark:border-[#3A3E4C]">
            <div>
              <div className="text-lg font-extrabold text-rose-700 dark:text-rose-400">{reviewedStats.again}</div>
              <div className="text-[10px] uppercase font-bold text-ink-muted">Again</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400">{reviewedStats.hard}</div>
              <div className="text-[10px] uppercase font-bold text-ink-muted">Hard</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-violet-brand dark:text-violet-bright">{reviewedStats.good}</div>
              <div className="text-[10px] uppercase font-bold text-ink-muted">Good</div>
            </div>
            <div>
              <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{reviewedStats.easy}</div>
              <div className="text-[10px] uppercase font-bold text-ink-muted">Easy</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Link
              to="/"
              className="brutal-pill-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 font-extrabold text-sm bg-violet-brand hover:bg-violet-hover text-white"
            >
              <span>Back to Library</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/vault"
              className="brutal-pill-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 font-extrabold text-sm bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory"
            >
              <BookMarked className="w-4 h-4 text-violet-brand" aria-hidden="true" />
              <span>Inspect Vault</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark text-center">
        <div className="brutal-card rounded-3xl p-8 max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-[#141413] bg-violet-soft text-violet-brand flex items-center justify-center mx-auto shadow-brutal-xs">
            <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="font-sans text-3xl font-extrabold tracking-tight">Zero Cards Due Today</h1>
          <p className="text-sm text-ink-muted dark:text-ink-pewter leading-relaxed">
            Your memory retention is fully scheduled. Read a new article to mine idioms and vocabulary into your vault!
          </p>
          <Link
            to="/"
            className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2.5 font-extrabold text-sm bg-violet-brand hover:bg-violet-hover text-white"
          >
            <span>Explore Reading Library</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas-cream dark:bg-ink-dark pt-5 pb-28 sm:py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto mb-5 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <h1 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
            Daily Cloze Review
          </h1>
          <span className="px-3 py-1 rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated text-xs font-mono font-extrabold shadow-brutal-xs">
            {currentIndex + 1} / {cards.length} • {progressPercent}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-white dark:bg-ink-elevated overflow-hidden border-2 border-[#141413] dark:border-[#3A3E4C]">
          <div
            className="h-full bg-violet-brand dark:bg-violet-bright transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <ClozeCard
        card={currentCard}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(true)}
        onGrade={handleGrade}
        grading={grading}
      />
    </div>
  );
};

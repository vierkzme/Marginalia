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

    api.reviews.getDue()
      .then((res) => {
        if (res.success && Array.isArray(res.data?.cards)) {
          setCards(res.data.cards);
          cardStartTimeRef.current = Date.now();
        } else {
          setError(res.error || 'Failed to fetch due review cards.');
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
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-rust mb-3" />
        <p className="font-serif text-sm text-ink-graphite dark:text-ink-pewter">
          Loading your spaced repetition due deck...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark text-center">
        <h2 className="font-serif text-2xl font-bold mb-2">Review Deck Error</h2>
        <p className="text-sm text-ink-graphite dark:text-ink-pewter mb-6 max-w-md">
          {error}
        </p>
        <button
          type="button"
          onClick={fetchDueReviews}
          className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm bg-editorial-rust text-white"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // Session Completed State
  if (sessionFinished) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark">
        <div className="w-full max-w-md bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#D9D3C7] dark:border-[#2E323B] rounded-2xl p-8 text-center shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold">Session Complete!</h2>
            <p className="text-sm text-ink-graphite dark:text-ink-pewter font-mono mt-1">
              You reviewed {reviewedStats.total} cards with SuperMemo-2 scheduling.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono py-2 border-y border-[#E7E2D8] dark:border-[#262930]">
            <div>
              <div className="text-lg font-bold text-rose-700">{reviewedStats.again}</div>
              <div className="text-[10px] uppercase text-ink-graphite">Again</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-700">{reviewedStats.hard}</div>
              <div className="text-[10px] uppercase text-ink-graphite">Hard</div>
            </div>
            <div>
              <div className="text-lg font-bold text-sky-700">{reviewedStats.good}</div>
              <div className="text-[10px] uppercase text-ink-graphite">Good</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-700">{reviewedStats.easy}</div>
              <div className="text-[10px] uppercase text-ink-graphite">Easy</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-serif font-bold text-sm bg-editorial-rust text-white shadow-xs"
            >
              <span>Back to Library</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/vault"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-serif text-sm bg-paper-cream dark:bg-ink-elevated border border-[#D9D3C7] dark:border-[#2E323B] text-ink-charcoal dark:text-ink-ivory"
            >
              <BookMarked className="w-4 h-4 text-editorial-rust" />
              <span>Inspect Vault</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Zero Cards Due Initially
  if (cards.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark text-center">
        <div className="w-16 h-16 rounded-full bg-paper-cream dark:bg-ink-elevated border border-[#D9D3C7] dark:border-[#2E323B] flex items-center justify-center text-editorial-rust dark:text-editorial-orange mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-bold mb-2">Zero Cards Due Today</h2>
        <p className="text-sm text-ink-graphite dark:text-ink-pewter mb-8 max-w-md leading-relaxed">
          Your memory retention is fully scheduled. Read a new article to mine idioms and vocabulary into your vault!
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif font-bold text-sm bg-editorial-rust text-white shadow-xs"
        >
          <span>Explore Reading Library</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper-light dark:bg-ink-dark py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between text-xs font-mono text-ink-graphite dark:text-ink-pewter mb-2">
          <span>
            Card <strong>{currentIndex + 1}</strong> of <strong>{cards.length}</strong>
          </span>
          <span>{progressPercent}% Complete</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-paper-cream dark:bg-ink-elevated overflow-hidden border border-[#E7E2D8] dark:border-[#262930]">
          <div
            className="h-full bg-editorial-rust transition-all duration-300"
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

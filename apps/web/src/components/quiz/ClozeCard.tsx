import React, { useState, useEffect } from 'react';
import { MultiContextHint } from './MultiContextHint';
import { SM2GradeButtons, ReviewButtonType } from './SM2GradeButtons';
import { AlertTriangle, BookOpen, CheckCircle, HelpCircle } from 'lucide-react';

export interface DueReviewItem {
  vocabItemId: string;
  lemma: string;
  displayTerm: string;
  partOfSpeech: string;
  phonetic: string | null;
  definition: string;
  personalNote: string | null;
  tags: string[];
  sm2State: {
    repetition: number;
    easinessFactor: number;
    interval: number;
    lapseCount: number;
    isLeech: boolean;
    masteryStage: string;
  };
  intervalPreview: {
    AGAIN: string;
    HARD: string;
    GOOD: string;
    EASY: string;
  };
  contexts: Array<{
    contextId: string;
    articleTitle: string;
    surfaceForm: string;
    fullSentence: string;
    clozeSentence: string;
    firstLetterHint: string;
    isPrimary: boolean;
  }>;
}

export interface ClozeCardProps {
  card: DueReviewItem;
  isFlipped: boolean;
  onFlip: () => void;
  onGrade: (button: ReviewButtonType) => void;
  grading?: boolean;
}

export const ClozeCard: React.FC<ClozeCardProps> = ({
  card,
  isFlipped,
  onFlip,
  onGrade,
  grading = false,
}) => {
  const [contextIndex, setContextIndex] = useState(0);
  const [showFirstLetter, setShowFirstLetter] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typeFeedback, setTypeFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Reset local state when active card changes
  useEffect(() => {
    setContextIndex(0);
    setShowFirstLetter(false);
    setTypedAnswer('');
    setTypeFeedback(null);
  }, [card.vocabItemId]);

  // Shortcut: Space to show answer if not flipped
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space' && !isFlipped) {
        e.preventDefault();
        onFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, onFlip]);

  const activeContext =
    card.contexts && card.contexts.length > 0
      ? card.contexts[contextIndex % card.contexts.length]
      : {
          contextId: 'default',
          articleTitle: 'Reading Vault',
          surfaceForm: card.lemma,
          fullSentence: `Example sentence for ${card.lemma}.`,
          clozeSentence: `Example sentence for [ ${card.lemma} ].`,
          firstLetterHint: `${card.lemma[0]}___`,
          isPrimary: true,
        };

  const handleNextContext = () => {
    setContextIndex((prev) => (prev + 1) % card.contexts.length);
  };

  const handleCheckTypedAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTyped = typedAnswer.trim().toLowerCase();
    const targetLemma = card.lemma.trim().toLowerCase();
    const targetSurface = activeContext.surfaceForm.trim().toLowerCase();

    if (cleanTyped === targetLemma || cleanTyped === targetSurface) {
      setTypeFeedback('correct');
    } else {
      setTypeFeedback('incorrect');
    }

    if (!isFlipped) {
      onFlip();
    }
  };

  // Helper to format cloze sentence with highlighted blank or term
  const renderSentenceContent = () => {
    if (isFlipped) {
      // In flipped state, display full sentence with the target surface form highlighted
      const parts = activeContext.fullSentence.split(new RegExp(`(${activeContext.surfaceForm})`, 'i'));
      return (
        <span className="leading-relaxed">
          {parts.map((p, i) =>
            p.toLowerCase() === activeContext.surfaceForm.toLowerCase() ? (
              <strong
                key={i}
                className="bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 px-1.5 py-0.5 rounded underline decoration-editorial-rust decoration-2"
              >
                {p}
              </strong>
            ) : (
              <span key={i}>{p}</span>
            )
          )}
        </span>
      );
    }

    // In cloze prompt state, replace [ ... ] with styled blank placeholder
    const parts = activeContext.clozeSentence.split(/(\[.*?\])/g);
    return (
      <span className="leading-relaxed">
        {parts.map((p, i) => {
          if (p.startsWith('[') && p.endsWith(']')) {
            return (
              <span
                key={i}
                className="inline-block px-3 py-0.5 mx-1 border-b-2 border-editorial-rust font-mono text-editorial-rust font-bold bg-paper-cream dark:bg-ink-elevated rounded-xs"
              >
                [ • • • • • • • ]
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark shadow-xl overflow-hidden transition-all duration-200">
      {/* CARD HEADER */}
      <div className="px-6 py-4 border-b border-[#E7E2D8] dark:border-[#262930] flex flex-wrap items-center justify-between gap-3 bg-paper-cream/40 dark:bg-ink-elevated/40">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter border border-[#D9D3C7] dark:border-[#2E323B]">
            {card.partOfSpeech || 'term'}
          </span>
          {card.phonetic && (
            <span className="font-mono text-xs text-ink-graphite dark:text-ink-pewter">
              {card.phonetic}
            </span>
          )}
          {card.sm2State.isLeech && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-900 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Leech ({card.sm2State.lapseCount} Lapses)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* CLOZE SENTENCE PROMPT */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="text-xs font-mono uppercase tracking-wider text-editorial-rust dark:text-editorial-orange font-semibold flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>Sentence Context • Cloze Prompt</span>
        </div>

        <div className="font-serif text-xl sm:text-2xl text-ink-charcoal dark:text-ink-ivory leading-relaxed min-h-[90px] flex items-center">
          {renderSentenceContent()}
        </div>

        {/* MULTI CONTEXT SWITCHER & FIRST-LETTER HINT */}
        <MultiContextHint
          contextsCount={card.contexts.length}
          currentIndex={contextIndex}
          onNextContext={handleNextContext}
          showFirstLetter={showFirstLetter}
          onToggleFirstLetter={() => setShowFirstLetter((prev) => !prev)}
          firstLetterHint={activeContext.firstLetterHint}
          disabled={grading}
        />

        {/* OPTIONAL TYPING RECALL INPUT */}
        {!isFlipped && (
          <form onSubmit={handleCheckTypedAnswer} className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your answer to practice (optional)..."
                className="flex-1 px-3.5 py-2 rounded-lg border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface text-ink-charcoal dark:text-ink-ivory placeholder:text-ink-graphite/60 dark:placeholder:text-ink-pewter/60 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-editorial-rust"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold font-mono bg-paper-cream dark:bg-ink-elevated border border-[#D9D3C7] dark:border-[#2E323B] hover:border-editorial-rust"
              >
                Check
              </button>
            </div>
          </form>
        )}

        {/* FLIPPED ANSWER SECTION */}
        {isFlipped ? (
          <div className="space-y-5 pt-4 border-t border-[#E7E2D8] dark:border-[#262930] animate-in fade-in duration-200">
            {typeFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  typeFeedback === 'correct'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200'
                }`}
              >
                {typeFeedback === 'correct' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                )}
                <span>
                  {typeFeedback === 'correct'
                    ? 'Tepat! Jawaban Anda sesuai.'
                    : `Anda mengetik "${typedAnswer}". Target: "${card.lemma}".`}
                </span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#E7E2D8] dark:border-[#262930] space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-serif text-3xl font-bold text-ink-charcoal dark:text-ink-ivory">
                  {card.displayTerm || card.lemma}
                </h3>
                <span className="text-xs font-mono text-ink-graphite dark:text-ink-pewter">
                  From: {activeContext.articleTitle}
                </span>
              </div>

              <p className="text-sm font-sans text-ink-charcoal dark:text-ink-ivory leading-relaxed pt-1">
                {card.definition}
              </p>

              {card.personalNote && (
                <div className="pt-2 text-xs text-editorial-rust dark:text-editorial-orange font-mono flex items-start gap-1">
                  <span>Catatan:</span>
                  <span>{card.personalNote}</span>
                </div>
              )}
            </div>

            <SM2GradeButtons
              intervalPreview={card.intervalPreview}
              onGrade={onGrade}
              disabled={grading}
            />
          </div>
        ) : (
          <div className="pt-4 flex flex-col items-center">
            <button
              type="button"
              onClick={onFlip}
              className="w-full py-3.5 rounded-xl font-bold font-serif text-base bg-editorial-rust text-white hover:bg-editorial-rust/90 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Show Answer</span>
              <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono font-normal">
                Space
              </kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

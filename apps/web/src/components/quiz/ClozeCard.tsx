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

  useEffect(() => {
    setContextIndex(0);
    setShowFirstLetter(false);
    setTypedAnswer('');
    setTypeFeedback(null);
  }, [card.vocabItemId]);

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

  const renderSentenceContent = () => {
    if (isFlipped) {
      const escapedSurface = activeContext.surfaceForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const parts = activeContext.fullSentence.split(new RegExp(`(${escapedSurface})`, 'i'));
      return (
        <span className="leading-relaxed">
          {parts.map((p, i) =>
            p.toLowerCase() === activeContext.surfaceForm.toLowerCase() ? (
              <strong
                key={i}
                className="bg-marker-learning text-[#141413] px-2 py-0.5 rounded border-b-2 border-marker-learningBorder"
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

    const parts = activeContext.clozeSentence.split(/(\[.*?\])/g);
    return (
      <span className="leading-relaxed">
        {parts.map((p, i) => {
          if (p.startsWith('[') && p.endsWith(']')) {
            return (
              <span
                key={i}
                className="inline-block px-2 sm:px-3.5 py-0.5 mx-1 border-2 border-[#141413] bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright font-mono text-[0.85em] sm:text-[0.92em] font-extrabold rounded-xl shadow-brutal-xs whitespace-nowrap"
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
    <div className="w-full max-w-2xl mx-auto brutal-card rounded-3xl border-t-4 border-t-violet-brand overflow-hidden">
      {/* CARD HEADER */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-[#141413] dark:border-[#3A3E4C] flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-canvas-cream dark:bg-ink-surface">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright">
            {card.partOfSpeech || 'term'}
          </span>
          {card.phonetic && (
            <span className="font-mono text-xs font-semibold text-ink-muted dark:text-ink-pewter">
              {card.phonetic}
            </span>
          )}
          {card.sm2State.isLeech && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-marker-leech text-[#4C0519] border border-marker-leechBorder font-extrabold">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Leech ({card.sm2State.lapseCount} Lapses)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full border border-[#141413]/20 dark:border-[#3A3E4C] text-[11px] font-mono font-bold bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* CLOZE SENTENCE PROMPT */}
      <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 bg-white dark:bg-ink-elevated">
        <div className="text-xs font-extrabold uppercase tracking-wider text-violet-brand dark:text-violet-bright flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          <span>Sentence Context • Cloze Prompt</span>
        </div>

        <div className="font-serif text-lg sm:text-2xl text-[#141413] dark:text-ink-ivory leading-relaxed min-h-[72px] sm:min-h-[90px] flex items-center">
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
          <form onSubmit={handleCheckTypedAnswer} className="space-y-3 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type answer (optional)..."
                aria-label="Type your answer"
                className="brutal-input flex-1 min-w-0 w-full px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-mono"
              />
              <button
                type="submit"
                className="brutal-pill-btn shrink-0 px-4 sm:px-5 py-2.5 text-xs font-extrabold bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory hover:bg-violet-tint"
              >
                Check
              </button>
            </div>
          </form>
        )}

        {/* FLIPPED ANSWER SECTION */}
        {isFlipped ? (
          <div className="space-y-5 pt-4 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C]">
            {typeFeedback && (
              <div
                className={`p-3 rounded-2xl border-2 border-[#141413] text-xs font-mono font-bold flex items-center gap-2 ${
                  typeFeedback === 'correct'
                    ? 'bg-emerald-100 text-emerald-950'
                    : 'bg-amber-100 text-amber-950'
                }`}
              >
                {typeFeedback === 'correct' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-amber-700" aria-hidden="true" />
                )}
                <span>
                  {typeFeedback === 'correct'
                    ? 'Correct! Your answer matches.'
                    : `You typed "${typedAnswer}". Target: "${card.lemma}".`}
                </span>
              </div>
            )}

            <div className="p-5 rounded-2xl bg-violet-tint dark:bg-ink-surface border-2 border-[#141413] dark:border-[#3A3E4C] shadow-brutal-xs space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-[#141413] dark:text-ink-ivory">
                  {card.displayTerm || card.lemma}
                </h2>
                <span className="text-xs font-mono font-bold text-violet-brand dark:text-violet-bright">
                  From: {activeContext.articleTitle}
                </span>
              </div>

              <p className="text-sm font-sans font-medium text-[#141413] dark:text-ink-ivory leading-relaxed pt-1">
                {card.definition}
              </p>

              {card.personalNote && (
                <div className="pt-2 text-xs text-violet-brand dark:text-violet-bright font-mono font-semibold flex items-start gap-1">
                  <span>Note:</span>
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
          <div className="pt-2 flex flex-col items-center">
            <button
              type="button"
              onClick={onFlip}
              className="brutal-pill-btn w-full py-3.5 font-extrabold text-base bg-violet-brand hover:bg-violet-hover text-white flex items-center justify-center gap-2"
            >
              <span>Show Answer</span>
              <kbd className="px-2 py-0.5 rounded-full bg-black/25 text-xs font-mono font-semibold">
                Space
              </kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

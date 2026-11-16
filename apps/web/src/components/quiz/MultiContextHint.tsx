import React, { useEffect } from 'react';
import { Layers, Lightbulb } from 'lucide-react';

export interface MultiContextHintProps {
  contextsCount: number;
  currentIndex: number;
  onNextContext: () => void;
  showFirstLetter: boolean;
  onToggleFirstLetter: () => void;
  firstLetterHint?: string;
  disabled?: boolean;
}

export const MultiContextHint: React.FC<MultiContextHintProps> = ({
  contextsCount,
  currentIndex,
  onNextContext,
  showFirstLetter,
  onToggleFirstLetter,
  firstLetterHint,
  disabled = false,
}) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        if (contextsCount > 1) {
          e.preventDefault();
          onNextContext();
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        onToggleFirstLetter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextsCount, onNextContext, onToggleFirstLetter, disabled]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] text-xs font-mono">
      <div className="flex flex-wrap items-center gap-2.5">
        {contextsCount > 1 && (
          <button
            type="button"
            onClick={onNextContext}
            disabled={disabled}
            className="brutal-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory font-bold hover:bg-violet-tint"
            title="Press H to switch sentence context"
          >
            <Layers className="w-3.5 h-3.5 text-violet-brand dark:text-violet-bright" aria-hidden="true" />
            <span>
              Switch Context ({currentIndex + 1}/{contextsCount})
            </span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded-full bg-canvas-cream dark:bg-ink-dark border border-[#141413]/20 text-[10px]">
              H
            </kbd>
          </button>
        )}

        {firstLetterHint && (
          <button
            type="button"
            onClick={onToggleFirstLetter}
            disabled={disabled}
            aria-pressed={showFirstLetter}
            className={`brutal-pill-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold ${
              showFirstLetter
                ? 'bg-marker-learning text-[#141413]'
                : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
            }`}
            title="Press L to reveal first-letter hint"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>First-Letter Hint</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded-full bg-canvas-cream dark:bg-ink-dark border border-[#141413]/20 text-[10px]">
              L
            </kbd>
          </button>
        )}
      </div>

      {showFirstLetter && firstLetterHint && (
        <div className="px-3.5 py-1 rounded-full border-2 border-[#141413] bg-marker-learning text-[#141413] font-mono font-extrabold tracking-widest text-sm shadow-brutal-xs">
          {firstLetterHint}
        </div>
      )}
    </div>
  );
};

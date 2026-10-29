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
  // Shortcut: 'H' for next context, 'L' for first-letter hint
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into an input field
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
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E7E2D8] dark:border-[#262930] text-xs font-mono">
      <div className="flex items-center gap-2">
        {contextsCount > 1 && (
          <button
            type="button"
            onClick={onNextContext}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-paper-cream dark:bg-ink-elevated border border-[#D9D3C7] dark:border-[#2E323B] text-ink-charcoal dark:text-ink-ivory hover:border-editorial-rust dark:hover:border-editorial-orange transition-colors"
            title="Press H to switch sentence context"
          >
            <Layers className="w-3.5 h-3.5 text-editorial-rust dark:text-editorial-orange" />
            <span>
              Lihat Kalimat Lain ({currentIndex + 1}/{contextsCount})
            </span>
            <kbd className="ml-1 px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[10px]">
              H
            </kbd>
          </button>
        )}

        {firstLetterHint && (
          <button
            type="button"
            onClick={onToggleFirstLetter}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${
              showFirstLetter
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-paper-cream dark:bg-ink-elevated border-[#D9D3C7] dark:border-[#2E323B] text-ink-graphite dark:text-ink-pewter hover:text-ink-charcoal'
            }`}
            title="Press L to reveal first-letter hint"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Hint Huruf Awal</span>
            <kbd className="ml-1 px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[10px]">
              L
            </kbd>
          </button>
        )}
      </div>

      {showFirstLetter && firstLetterHint && (
        <div className="px-3 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 font-mono tracking-widest text-sm animate-in fade-in">
          {firstLetterHint}
        </div>
      )}
    </div>
  );
};

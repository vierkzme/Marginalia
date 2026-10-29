import React, { useEffect } from 'react';

export type ReviewButtonType = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface SM2GradeButtonsProps {
  intervalPreview: {
    AGAIN: string;
    HARD: string;
    GOOD: string;
    EASY: string;
  };
  onGrade: (button: ReviewButtonType) => void;
  disabled?: boolean;
}

export const SM2GradeButtons: React.FC<SM2GradeButtonsProps> = ({
  intervalPreview,
  onGrade,
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

      switch (e.key) {
        case '1':
          e.preventDefault();
          onGrade('AGAIN');
          break;
        case '2':
          e.preventDefault();
          onGrade('HARD');
          break;
        case '3':
          e.preventDefault();
          onGrade('GOOD');
          break;
        case '4':
          e.preventDefault();
          onGrade('EASY');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onGrade]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* AGAIN BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('AGAIN')}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-900 dark:text-rose-200 transition-all focus:outline-hidden focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
        >
          <span className="text-sm font-bold flex items-center gap-1.5">
            <span>Again</span>
            <kbd className="px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900/60 text-[10px] font-mono">
              1
            </kbd>
          </span>
          <span className="text-xs font-mono text-rose-700 dark:text-rose-400 mt-0.5">
            {intervalPreview.AGAIN}
          </span>
        </button>

        {/* HARD BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('HARD')}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-900 dark:text-amber-200 transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
        >
          <span className="text-sm font-bold flex items-center gap-1.5">
            <span>Hard</span>
            <kbd className="px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/60 text-[10px] font-mono">
              2
            </kbd>
          </span>
          <span className="text-xs font-mono text-amber-700 dark:text-amber-400 mt-0.5">
            {intervalPreview.HARD}
          </span>
        </button>

        {/* GOOD BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('GOOD')}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-sky-300 dark:border-sky-900 bg-sky-50/70 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 text-sky-900 dark:text-sky-200 transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        >
          <span className="text-sm font-bold flex items-center gap-1.5">
            <span>Good</span>
            <kbd className="px-1.5 py-0.2 rounded bg-sky-200/60 dark:bg-sky-900/60 text-[10px] font-mono">
              3
            </kbd>
          </span>
          <span className="text-xs font-mono text-sky-700 dark:text-sky-400 mt-0.5">
            {intervalPreview.GOOD}
          </span>
        </button>

        {/* EASY BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('EASY')}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 transition-all focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        >
          <span className="text-sm font-bold flex items-center gap-1.5">
            <span>Easy</span>
            <kbd className="px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-[10px] font-mono">
              4
            </kbd>
          </span>
          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
            {intervalPreview.EASY}
          </span>
        </button>
      </div>
      <p className="text-center font-mono text-[11px] text-ink-graphite dark:text-ink-pewter mt-2">
        Shortcut: Tekan tombol 1, 2, 3, atau 4 pada keyboard.
      </p>
    </div>
  );
};

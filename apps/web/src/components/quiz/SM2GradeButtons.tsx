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

  const btnBase =
    'flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] shadow-brutal-xs dark:shadow-brutal-dark-xs transition-all duration-100 active:translate-y-[2px] active:shadow-none disabled:opacity-50';

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* AGAIN BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('AGAIN')}
          disabled={disabled}
          className={`${btnBase} bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-950 text-rose-950 dark:text-rose-200`}
        >
          <span className="text-sm font-extrabold flex items-center gap-1.5">
            <span>Again</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-[#141413]/20 text-[10px] font-mono">
              1
            </kbd>
          </span>
          <span className="text-xs font-mono font-bold mt-0.5">{intervalPreview.AGAIN}</span>
        </button>

        {/* HARD BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('HARD')}
          disabled={disabled}
          className={`${btnBase} bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-950 text-amber-950 dark:text-amber-200`}
        >
          <span className="text-sm font-extrabold flex items-center gap-1.5">
            <span>Hard</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-[#141413]/20 text-[10px] font-mono">
              2
            </kbd>
          </span>
          <span className="text-xs font-mono font-bold mt-0.5">{intervalPreview.HARD}</span>
        </button>

        {/* GOOD BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('GOOD')}
          disabled={disabled}
          className={`${btnBase} bg-violet-soft hover:bg-violet-progress dark:bg-violet-darkSoft dark:hover:bg-violet-brand text-violet-brand dark:text-violet-bright`}
        >
          <span className="text-sm font-extrabold flex items-center gap-1.5">
            <span>Good</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-[#141413]/20 text-[10px] font-mono">
              3
            </kbd>
          </span>
          <span className="text-xs font-mono font-bold mt-0.5">{intervalPreview.GOOD}</span>
        </button>

        {/* EASY BUTTON */}
        <button
          type="button"
          onClick={() => onGrade('EASY')}
          disabled={disabled}
          className={`${btnBase} bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-950 text-emerald-950 dark:text-emerald-200`}
        >
          <span className="text-sm font-extrabold flex items-center gap-1.5">
            <span>Easy</span>
            <kbd className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-black/40 border border-[#141413]/20 text-[10px] font-mono">
              4
            </kbd>
          </span>
          <span className="text-xs font-mono font-bold mt-0.5">{intervalPreview.EASY}</span>
        </button>
      </div>
      <p className="text-center font-mono text-[11px] font-semibold text-ink-muted dark:text-ink-pewter mt-2.5">
        Shortcut: Press keys 1, 2, 3, or 4 on your keyboard.
      </p>
    </div>
  );
};

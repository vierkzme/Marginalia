import React from 'react';
import { AlertOctagon, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface LeechItem {
  vocabItemId: string;
  lemma: string;
  displayTerm: string;
  lapseCount: number;
  easinessFactor: number;
  masteryStage: string;
  contextsCount: number;
}

export interface LeechWatchlistProps {
  items: LeechItem[];
}

export const LeechWatchlist: React.FC<LeechWatchlistProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="w-full brutal-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertOctagon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          <h2 className="font-sans font-extrabold text-lg">Leech Watchlist</h2>
        </div>
        <p className="text-xs text-ink-muted dark:text-ink-pewter font-mono font-semibold">
          Zero words currently identified as leeches. High retention efficiency across all decks!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full brutal-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <h2 className="font-sans font-extrabold text-lg text-[#141413] dark:text-ink-ivory">
              Leech Watchlist (High Lapses)
            </h2>
          </div>
          <p className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-0.5">
            Words that have caused ≥ 3 memory lapses and need alternate reading contexts
          </p>
        </div>
        <span className="px-3 py-1 rounded-full font-mono text-xs bg-marker-leech text-[#4C0519] border border-marker-leechBorder font-extrabold">
          {items.length} Target Items
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={item.vocabItemId}
            className="brutal-card-sm p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4 border-t-4 border-t-rose-500"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="font-mono text-base font-extrabold text-rose-600 dark:text-rose-400 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans font-extrabold text-base text-[#141413] dark:text-ink-ivory truncate">
                    {item.displayTerm || item.lemma}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-marker-leech text-[#4C0519] border border-marker-leechBorder font-extrabold">
                    {item.lapseCount} lapses
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-0.5">
                  <span>EF: {item.easinessFactor.toFixed(2)}</span>
                  <span>•</span>
                  <span>{item.contextsCount} contexts recorded</span>
                </div>
              </div>
            </div>

            <Link
              to="/vault"
              className="brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-ink-surface hover:bg-violet-brand hover:text-white text-xs font-extrabold shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Inspect</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

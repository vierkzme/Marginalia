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
      <div className="w-full rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertOctagon className="w-5 h-5 text-emerald-600" />
          <h3 className="font-serif font-bold text-lg">Leech Watchlist</h3>
        </div>
        <p className="text-xs text-ink-graphite dark:text-ink-pewter font-mono">
          Zero words currently identified as leeches. High retention efficiency across all decks!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-serif font-bold text-lg">Leech Watchlist (High Lapses)</h3>
          </div>
          <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-0.5">
            Words that have caused $\ge 3$ memory lapses and need alternate reading contexts
          </p>
        </div>
        <span className="px-2 py-0.5 rounded font-mono text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
          {items.length} Target Items
        </span>
      </div>

      <div className="divide-y divide-[#E7E2D8] dark:divide-[#262930] -mx-6 px-6 max-h-80 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.vocabItemId}
            className="py-3 flex items-center justify-between gap-4 hover:bg-paper-cream/40 dark:hover:bg-ink-elevated/40 px-2 rounded-lg transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-ink-charcoal dark:text-ink-ivory">
                  {item.displayTerm || item.lemma}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 font-semibold">
                  {item.lapseCount} lapses
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-0.5">
                <span>EF: {item.easinessFactor.toFixed(2)}</span>
                <span>•</span>
                <span>{item.contextsCount} contexts recorded</span>
              </div>
            </div>

            <Link
              to="/vault"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-cream dark:bg-ink-elevated hover:border-editorial-rust text-xs font-mono transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-editorial-rust" />
              <span>Inspect</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

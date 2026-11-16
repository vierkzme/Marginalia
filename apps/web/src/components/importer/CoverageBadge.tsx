import React from 'react';
import { Star } from 'lucide-react';

export interface CoverageProps {
  percentage: number;
  knownLemmasCount?: number;
  learningLemmasCount?: number;
  leechLemmasCount?: number;
  unknownLemmasCount?: number;
  difficultyTier?: 'OPTIMAL' | 'CHALLENGING' | 'HEAVY';
  summaryMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CoverageBadge: React.FC<CoverageProps> = ({
  percentage,
  knownLemmasCount,
  learningLemmasCount,
  leechLemmasCount,
  unknownLemmasCount,
  difficultyTier = percentage >= 95 ? 'OPTIMAL' : percentage >= 90 ? 'CHALLENGING' : 'HEAVY',
  summaryMessage,
  size = 'md',
}) => {
  const rounded = Math.round(percentage);

  const getTierDetails = () => {
    switch (difficultyTier) {
      case 'OPTIMAL':
        return {
          pillBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-[#141413]/20 dark:border-emerald-700',
          starColor: 'text-emerald-600 fill-emerald-500',
          tierLabel: 'Optimal Input',
        };
      case 'CHALLENGING':
        return {
          pillBg: 'bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright border-[#141413]/15 dark:border-violet-brand/40',
          starColor: 'text-amber-500 fill-amber-400',
          tierLabel: 'Challenging',
        };
      case 'HEAVY':
      default:
        return {
          pillBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-[#141413]/20 dark:border-rose-800',
          starColor: 'text-rose-500 fill-rose-400',
          tierLabel: 'Heavy Load',
        };
    }
  };

  const { pillBg, starColor, tierLabel } = getTierDetails();

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#141413] dark:text-ink-ivory font-mono">
        <Star className={`w-3.5 h-3.5 ${starColor}`} aria-hidden="true" />
        <span>{rounded}%</span>
      </span>
    );
  }

  return (
    <div className="brutal-card-sm bg-violet-tint dark:bg-ink-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full border ${pillBg}`}>
            {tierLabel}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-sm font-extrabold text-[#141413] dark:text-ink-ivory">
            <Star className={`w-4 h-4 ${starColor}`} aria-hidden="true" />
            {percentage.toFixed(1)}%
          </span>
        </div>
        <span className="text-[11px] text-ink-muted dark:text-ink-pewter font-mono font-semibold uppercase tracking-wider">
          95%+ Sweet Spot
        </span>
      </div>

      <div className="w-full bg-white dark:bg-ink-dark h-3 rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] overflow-hidden flex mb-3">
        <div
          className="bg-violet-brand dark:bg-violet-bright h-full transition-all duration-300"
          style={{ width: `${Math.min(100, percentage)}%` }}
          aria-label={`Coverage gauge: ${percentage}%`}
        />
      </div>

      {summaryMessage && (
        <p className="text-xs text-[#141413] dark:text-ink-ivory font-semibold mb-3">
          {summaryMessage}
        </p>
      )}

      {(knownLemmasCount !== undefined || learningLemmasCount !== undefined) && (
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#141413]/15 dark:border-[#3A3E4C] text-xs font-mono">
          {knownLemmasCount !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-white dark:bg-ink-surface border border-[#141413]/20 text-[#141413] dark:text-ink-ivory">
              <strong>{knownLemmasCount}</strong> Known
            </span>
          )}
          {learningLemmasCount !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-marker-learning text-[#141413] border border-marker-learningBorder inline-flex items-center gap-1 font-bold">
              <strong>{learningLemmasCount}</strong> Learning
            </span>
          )}
          {leechLemmasCount !== undefined && leechLemmasCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-marker-leech text-[#4C0519] border border-marker-leechBorder inline-flex items-center gap-1 font-bold">
              <strong>{leechLemmasCount}</strong> Leech
            </span>
          )}
          {unknownLemmasCount !== undefined && (
            <span className="text-ink-muted dark:text-ink-pewter font-semibold">
              <strong>{unknownLemmasCount}</strong> New Target
            </span>
          )}
        </div>
      )}
    </div>
  );
};

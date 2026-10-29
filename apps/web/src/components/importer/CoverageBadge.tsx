import React from 'react';

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
          pillBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
          dotBg: 'bg-emerald-600 dark:bg-emerald-400',
          tierLabel: 'Optimal for Mining',
        };
      case 'CHALLENGING':
        return {
          pillBg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          dotBg: 'bg-amber-600 dark:bg-amber-400',
          tierLabel: 'Challenging Read',
        };
      case 'HEAVY':
      default:
        return {
          pillBg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800',
          dotBg: 'bg-rose-600 dark:bg-rose-400',
          tierLabel: 'Heavy Lexical Load',
        };
    }
  };

  const { pillBg, dotBg, tierLabel } = getTierDetails();

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono font-medium rounded border ${pillBg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`} aria-hidden="true" />
        {rounded}% Coverage
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-[#E7E2D8] dark:border-[#262930] bg-paper-cream/60 dark:bg-ink-elevated/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border ${pillBg}`}>
            <span className={`w-2 h-2 rounded-full ${dotBg}`} aria-hidden="true" />
            {tierLabel}
          </span>
          <span className="font-mono text-sm font-semibold">{percentage.toFixed(1)}%</span>
        </div>
        <span className="text-xs text-ink-graphite dark:text-ink-pewter font-mono">
          95%+ target for flow state
        </span>
      </div>

      <div className="w-full bg-[#E7E2D8] dark:bg-[#262930] h-2.5 rounded-full overflow-hidden flex mb-2">
        <div
          className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${Math.min(100, percentage)}%` }}
          aria-label={`Coverage gauge: ${percentage}%`}
        />
      </div>

      {summaryMessage && (
        <p className="text-xs text-ink-graphite dark:text-ink-pewter font-medium mb-3">
          {summaryMessage}
        </p>
      )}

      {(knownLemmasCount !== undefined || learningLemmasCount !== undefined) && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E7E2D8] dark:border-[#262930] text-xs font-mono">
          {knownLemmasCount !== undefined && (
            <span className="text-ink-charcoal dark:text-ink-ivory">
              <strong>{knownLemmasCount}</strong> Dikuasai
            </span>
          )}
          {learningLemmasCount !== undefined && (
            <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
              <strong>{learningLemmasCount}</strong> Learning
            </span>
          )}
          {leechLemmasCount !== undefined && leechLemmasCount > 0 && (
            <span className="text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />
              <strong>{leechLemmasCount}</strong> Leech
            </span>
          )}
          {unknownLemmasCount !== undefined && (
            <span className="text-ink-graphite dark:text-ink-pewter">
              <strong>{unknownLemmasCount}</strong> New / Target
            </span>
          )}
        </div>
      )}
    </div>
  );
};

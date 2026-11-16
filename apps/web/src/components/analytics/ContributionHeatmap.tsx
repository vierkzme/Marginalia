import React, { useState } from 'react';

export interface HeatmapDay {
  date: string;
  wordsMined: number;
  reviewsCompleted: number;
  totalScore: number;
  intensityLevel: number;
}

export interface ContributionHeatmapProps {
  days: HeatmapDay[];
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({ days }) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  days.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || idx === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-violet-soft dark:bg-violet-darkSoft border-[#141413]/30 dark:border-violet-brand/40';
      case 2:
        return 'bg-violet-progress dark:bg-[#4C1D95] border-[#141413]/40 dark:border-violet-brand/60';
      case 3:
        return 'bg-violet-brand dark:bg-violet-bright border-[#141413] text-white';
      case 4:
        return 'bg-[#2E1065] dark:bg-white border-[#141413] text-white';
      case 0:
      default:
        return 'bg-canvas-cream dark:bg-ink-surface border-[#141413]/15 dark:border-[#3A3E4C]';
    }
  };

  const totalReviewsYear = days.reduce((acc, d) => acc + d.reviewsCompleted, 0);
  const totalMinedYear = days.reduce((acc, d) => acc + d.wordsMined, 0);

  return (
    <div className="w-full brutal-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-sans font-extrabold text-lg text-[#141413] dark:text-ink-ivory">
            365-Day Reading &amp; Vault Activity
          </h2>
          <p className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-0.5">
            {totalReviewsYear} reviews completed • {totalMinedYear} idioms &amp; words mined past year
          </p>
        </div>

        <div className="min-h-[30px] flex items-center">
          {hoveredDay ? (
            <div className="px-3.5 py-1 rounded-full bg-violet-tint dark:bg-ink-surface border-2 border-[#141413] dark:border-[#3A3E4C] text-xs font-mono font-bold text-[#141413] dark:text-ink-ivory shadow-brutal-xs">
              <span className="font-extrabold text-violet-brand dark:text-violet-bright mr-1.5">
                {hoveredDay.date}:
              </span>
              <span>{hoveredDay.reviewsCompleted} reviews</span>
              <span className="mx-1">•</span>
              <span>{hoveredDay.wordsMined} mined</span>
            </div>
          ) : (
            <span className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter">
              Hover over a square for details
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1 min-w-[720px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-colors cursor-pointer ${getCellColor(
                    day.intensityLevel
                  )} hover:ring-2 hover:ring-[#141413]`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter">
        <span>Less active</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-[3px] bg-canvas-cream dark:bg-ink-surface border border-[#141413]/20" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-violet-soft border border-[#141413]/30" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-violet-progress border border-[#141413]/40" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-violet-brand border border-[#141413]" />
          <div className="w-3.5 h-3.5 rounded-[3px] bg-[#2E1065] border border-[#141413]" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
};

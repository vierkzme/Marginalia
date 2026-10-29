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

  // Split 365 days into columns of 7 days (weeks)
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
        return 'bg-amber-200 dark:bg-amber-900/60 border-amber-300 dark:border-amber-800';
      case 2:
        return 'bg-orange-400 dark:bg-orange-700 border-orange-500 dark:border-orange-600';
      case 3:
        return 'bg-editorial-rust dark:bg-editorial-orange border-[#842A0F] text-white';
      case 4:
        return 'bg-red-900 dark:bg-orange-500 border-red-950 text-white';
      case 0:
      default:
        return 'bg-paper-cream/80 dark:bg-ink-elevated/80 border-[#E7E2D8] dark:border-[#262930]';
    }
  };

  const totalReviewsYear = days.reduce((acc, d) => acc + d.reviewsCompleted, 0);
  const totalMinedYear = days.reduce((acc, d) => acc + d.wordsMined, 0);

  return (
    <div className="w-full rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-serif font-bold text-lg text-ink-charcoal dark:text-ink-ivory">
            365-Day Reading & Vault Activity
          </h3>
          <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-0.5">
            {totalReviewsYear} reviews completed • {totalMinedYear} idioms & words mined past year
          </p>
        </div>

        {/* HOVER TOOLTIP / SUMMARY */}
        <div className="min-h-[28px] flex items-center">
          {hoveredDay ? (
            <div className="px-3 py-1 rounded bg-paper-cream dark:bg-ink-elevated border border-[#D9D3C7] dark:border-[#2E323B] text-xs font-mono text-ink-charcoal dark:text-ink-ivory animate-in fade-in">
              <span className="font-semibold text-editorial-rust dark:text-editorial-orange mr-1.5">
                {hoveredDay.date}:
              </span>
              <span>{hoveredDay.reviewsCompleted} reviews</span>
              <span className="mx-1">•</span>
              <span>{hoveredDay.wordsMined} words mined</span>
            </div>
          ) : (
            <span className="text-xs font-mono text-ink-graphite dark:text-ink-pewter">
              Hover over a square for details
            </span>
          )}
        </div>
      </div>

      {/* HEATMAP GRID */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="inline-flex gap-1 min-w-[720px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-xs border transition-colors cursor-pointer ${getCellColor(
                    day.intensityLevel
                  )} hover:ring-2 hover:ring-editorial-rust`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E7E2D8] dark:border-[#262930] text-xs font-mono text-ink-graphite dark:text-ink-pewter">
        <span>Less active</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-xs bg-paper-cream/80 dark:bg-ink-elevated/80 border border-[#E7E2D8] dark:border-[#262930]" />
          <div className="w-3 h-3 rounded-xs bg-amber-200 dark:bg-amber-900/60 border border-amber-300" />
          <div className="w-3 h-3 rounded-xs bg-orange-400 dark:bg-orange-700 border border-orange-500" />
          <div className="w-3 h-3 rounded-xs bg-editorial-rust border border-[#842A0F]" />
          <div className="w-3 h-3 rounded-xs bg-red-900 border border-red-950" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
};

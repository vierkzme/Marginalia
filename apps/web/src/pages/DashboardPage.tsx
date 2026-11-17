import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ContributionHeatmap } from '../components/analytics/ContributionHeatmap';
import { RetentionChart } from '../components/analytics/RetentionChart';
import { LeechWatchlist } from '../components/analytics/LeechWatchlist';
import { Flame, Target, BookMarked, Trophy, Loader2, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any | null>(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    api.analytics
      .getDashboard()
      .then((res: any) => {
        const data = res?.data || res;
        if (data && data.streak && data.retentionDistribution) {
          setDashboardData(data);
        } else {
          setError(res?.error || 'Failed to load dashboard metrics.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error while loading metrics.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
        <p className="font-mono font-semibold text-sm text-ink-muted dark:text-ink-pewter">
          Calculating 365-day heatmaps and retention analytics...
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-canvas-cream dark:bg-ink-dark text-center">
        <div className="brutal-card p-8 max-w-md space-y-4">
          <h1 className="font-sans text-2xl font-extrabold">Metrics Unavailable</h1>
          <p className="text-sm text-ink-muted dark:text-ink-pewter">
            {error || 'Unable to fetch activity metrics.'}
          </p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-sm font-extrabold bg-violet-brand text-white"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    streak,
    xp,
    retentionDistribution,
    contributionHeatmap,
    leechWatchlist,
    tagDistribution,
  } = dashboardData;

  const xpInfo = xp || { todayXp: 0, totalXp: 0, level: 1, levelProgressPct: 0, xpToNextLevel: 250 };

  const goalPercent = Math.min(
    100,
    Math.round((streak.todayCompletedReviews / Math.max(1, streak.dailyGoal)) * 100)
  );

  const totalVaultCount = retentionDistribution.reduce(
    (sum: number, item: any) => sum + (item.count || 0),
    0
  );
  const retainedCount = retentionDistribution
    .filter((item: any) => item.stage === 'YOUNG' || item.stage === 'MATURE')
    .reduce((sum: number, item: any) => sum + (item.count || 0), 0);
  const retentionRate =
    totalVaultCount > 0 ? ((retainedCount / totalVaultCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas-cream dark:bg-ink-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter block mb-1">
              SPACED REPETITION TELEMETRY
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
              Mastery &amp; Retention Analytics
            </h1>
            <p className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-1">
              Tracking your long-term reading memory, idiom vault expansion, and SuperMemo-2 stability.
            </p>
          </div>

          <div className="brutal-card-sm px-4 py-2.5 bg-violet-tint dark:bg-ink-surface flex items-center gap-3 self-start sm:self-auto">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-brand text-white text-xs font-mono font-extrabold">
              LVL {xpInfo.level}
            </span>
            <div className="text-xs font-mono">
              <div className="font-extrabold text-[#141413] dark:text-ink-ivory">
                {xpInfo.totalXp} Total XP
              </div>
              <div className="text-[11px] text-violet-brand dark:text-violet-bright font-bold">
                +{xpInfo.todayXp} XP today
              </div>
            </div>
          </div>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CURRENT STREAK */}
          <div className="brutal-card p-5 border-t-4 border-t-violet-brand">
            <div className="flex items-center justify-between text-violet-brand dark:text-violet-bright mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
                Active Streak
              </span>
              <span className="w-8 h-8 rounded-full border-2 border-[#141413] bg-amber-100 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" aria-hidden="true" />
              </span>
            </div>
            <div className="font-sans text-3xl font-extrabold text-[#141413] dark:text-ink-ivory">
              {streak.currentStreak} Days
            </div>
            <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter mt-1">
              Longest streak: {streak.longestStreak} days
            </p>
          </div>

          {/* DAILY REVIEW GOAL */}
          <div className="brutal-card p-5">
            <div className="flex items-center justify-between text-ink-muted dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
                Daily Goal
              </span>
              <span className="w-8 h-8 rounded-full border-2 border-[#141413] bg-violet-soft flex items-center justify-center">
                <Target className="w-4 h-4 text-violet-brand" aria-hidden="true" />
              </span>
            </div>
            <div className="font-sans text-3xl font-extrabold text-[#141413] dark:text-ink-ivory">
              {streak.todayCompletedReviews} / {streak.dailyGoal}
            </div>
            <div className="w-full h-2.5 rounded-full bg-canvas-cream dark:bg-ink-dark border border-[#141413] mt-2.5 overflow-hidden">
              <div
                className="h-full bg-violet-brand dark:bg-violet-bright"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* MINED TODAY */}
          <div className="brutal-card p-5">
            <div className="flex items-center justify-between text-ink-muted dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
                Mined Today
              </span>
              <span className="w-8 h-8 rounded-full border-2 border-[#141413] bg-sky-100 flex items-center justify-center">
                <BookMarked className="w-4 h-4 text-sky-700" aria-hidden="true" />
              </span>
            </div>
            <div className="font-sans text-3xl font-extrabold text-[#141413] dark:text-ink-ivory">
              {streak.todayWordsMined} Words
            </div>
            <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter mt-1">
              Mined with context sentences
            </p>
          </div>

          {/* TOTAL IN VAULT */}
          <div className="brutal-card p-5">
            <div className="flex items-center justify-between text-ink-muted dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-extrabold">
                Young &amp; Mature
              </span>
              <span className="w-8 h-8 rounded-full border-2 border-[#141413] bg-emerald-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              </span>
            </div>
            <div className="font-sans text-3xl font-extrabold text-[#141413] dark:text-ink-ivory">
              {retentionRate}%
            </div>
            <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter mt-1">
              {retainedCount} of {totalVaultCount} vault terms retained
            </p>
          </div>
        </div>

        {/* 365-DAY HEATMAP */}
        <ContributionHeatmap days={contributionHeatmap} />

        {/* RETENTION DISTRIBUTION & TAG PILLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 min-w-0">
            <RetentionChart distribution={retentionDistribution} />
          </div>

          <div className="brutal-card p-6 flex flex-col justify-between">
            <div>
              <h2 className="font-sans font-extrabold text-lg text-[#141413] dark:text-ink-ivory mb-1">
                Vault Categorization
              </h2>
              <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter mb-4">
                Distribution across idioms, phrasal verbs, and academic lexicons
              </p>

              <div className="space-y-3">
                {tagDistribution.map((t: { tag: string; count: number }, idx: number) => (
                  <div
                    key={t.tag}
                    className="flex items-center justify-between p-3 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream/70 dark:bg-ink-surface shadow-brutal-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-extrabold text-ink-muted">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-sans text-xs font-extrabold text-[#141413] dark:text-ink-ivory">
                        {t.tag}
                      </span>
                    </div>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft font-extrabold text-violet-brand dark:text-violet-bright">
                      {t.count} items
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] text-[11px] font-mono font-semibold text-ink-muted dark:text-ink-pewter">
              Context-first mining anchors vocabulary into real articles.
            </div>
          </div>
        </div>

        {/* LEECH WATCHLIST */}
        <LeechWatchlist items={leechWatchlist} />
      </div>
    </div>
  );
};

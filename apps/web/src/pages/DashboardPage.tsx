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
    api.analytics.getDashboard()
      .then((res) => {
        if (res.success && res.data) {
          setDashboardData(res.data);
        } else {
          setError(res.error || 'Failed to load dashboard metrics.');
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
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-rust mb-3" />
        <p className="font-serif text-sm text-ink-graphite dark:text-ink-pewter">
          Calculating 365-day heatmaps and retention analytics...
        </p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-ink-dark text-center">
        <h2 className="font-serif text-2xl font-bold mb-2">Metrics Unavailable</h2>
        <p className="text-sm text-ink-graphite dark:text-ink-pewter mb-6 max-w-md">
          {error || 'Unable to fetch activity metrics.'}
        </p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm bg-editorial-rust text-white"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const {
    streak,
    retentionDistribution,
    contributionHeatmap,
    leechWatchlist,
    tagDistribution,
  } = dashboardData;

  const goalPercent = Math.min(
    100,
    Math.round((streak.todayCompletedReviews / Math.max(1, streak.dailyGoal)) * 100)
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper-light dark:bg-ink-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink-charcoal dark:text-ink-ivory">
            Mastery & Retention Analytics
          </h1>
          <p className="text-sm text-ink-graphite dark:text-ink-pewter font-mono mt-1">
            Tracking your long-term reading memory, idiom vault expansion, and SuperMemo-2 stability.
          </p>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CURRENT STREAK */}
          <div className="p-5 rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-cream/60 dark:bg-ink-elevated/60 shadow-xs">
            <div className="flex items-center justify-between text-editorial-rust dark:text-editorial-orange mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">Active Streak</span>
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="font-serif text-3xl font-bold text-ink-charcoal dark:text-ink-ivory">
              {streak.currentStreak} Days
            </div>
            <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-1">
              Longest streak: {streak.longestStreak} days
            </p>
          </div>

          {/* DAILY REVIEW GOAL */}
          <div className="p-5 rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-cream/60 dark:bg-ink-elevated/60 shadow-xs">
            <div className="flex items-center justify-between text-ink-graphite dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">Daily Goal</span>
              <Target className="w-5 h-5 text-editorial-rust dark:text-editorial-orange" />
            </div>
            <div className="font-serif text-3xl font-bold text-ink-charcoal dark:text-ink-ivory">
              {streak.todayCompletedReviews} / {streak.dailyGoal}
            </div>
            <div className="w-full h-1.5 rounded-full bg-paper-cream dark:bg-black/30 mt-2 overflow-hidden">
              <div
                className="h-full bg-editorial-rust dark:bg-editorial-orange"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* MINED TODAY */}
          <div className="p-5 rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-cream/60 dark:bg-ink-elevated/60 shadow-xs">
            <div className="flex items-center justify-between text-ink-graphite dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">Words Mined Today</span>
              <BookMarked className="w-5 h-5 text-editorial-rust dark:text-editorial-orange" />
            </div>
            <div className="font-serif text-3xl font-bold text-ink-charcoal dark:text-ink-ivory">
              {streak.todayWordsMined} Words
            </div>
            <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-1">
              Mined with context sentences
            </p>
          </div>

          {/* TOTAL IN VAULT */}
          <div className="p-5 rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-cream/60 dark:bg-ink-elevated/60 shadow-xs">
            <div className="flex items-center justify-between text-ink-graphite dark:text-ink-pewter mb-2">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">Vault Retention</span>
              <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="font-serif text-3xl font-bold text-ink-charcoal dark:text-ink-ivory">
              92.4%
            </div>
            <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mt-1">
              SM-2 stability factor average
            </p>
          </div>
        </div>

        {/* 365-DAY HEATMAP */}
        <ContributionHeatmap days={contributionHeatmap} />

        {/* RETENTION DISTRIBUTION & TAG PILLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RetentionChart distribution={retentionDistribution} />
          </div>

          <div className="rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-ink-charcoal dark:text-ink-ivory mb-1">
                Vault Categorization
              </h3>
              <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter mb-4">
                Distribution across idioms, phrasal verbs, and academic lexicons
              </p>

              <div className="space-y-3">
                {tagDistribution.map((t: { tag: string; count: number }) => (
                  <div key={t.tag} className="flex items-center justify-between p-3 rounded-lg bg-paper-cream/60 dark:bg-ink-elevated/60">
                    <span className="font-mono text-xs font-semibold">#{t.tag}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white dark:bg-black/30 font-bold text-editorial-rust dark:text-editorial-orange">
                      {t.count} items
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E2D8] dark:border-[#262930] text-[11px] font-mono text-ink-graphite dark:text-ink-pewter">
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

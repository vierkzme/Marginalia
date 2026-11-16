import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Play,
  Search,
  Check,
  PenLine,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArticleImporterModal } from '../components/importer/ArticleImporterModal';
import { CoverageBadge } from '../components/importer/CoverageBadge';
import { BauhausHeaderArt, getBauhausVariant } from '../components/common/BauhausHeaderArt';

type LibraryFilter = 'ALL' | 'OPTIMAL' | 'URL' | 'RAW_TEXT' | 'FILE';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const userFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Reader';
  const [dailyStats, setDailyStats] = useState({
    todayCompletedReviews: 0,
    todayWordsMined: 0,
    dueCardsCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchLibraryData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [articlesRes, dashRes, dueRes]: any[] = await Promise.allSettled([
        api.articles.list(),
        api.analytics.getDashboard(),
        api.reviews.getDue(),
      ]);

      if (articlesRes.status === 'fulfilled') {
        const res = articlesRes.value;
        const list = Array.isArray(res) ? res : res?.data || [];
        setArticles(list);
      } else {
        throw new Error(articlesRes.reason?.message || 'Failed to load library.');
      }

      const nextStats = {
        todayCompletedReviews: 0,
        todayWordsMined: 0,
        dueCardsCount: 0,
      };

      if (dashRes.status === 'fulfilled') {
        const dash = dashRes.value?.data || dashRes.value;
        if (dash?.streak) {
          nextStats.todayCompletedReviews = dash.streak.todayCompletedReviews || 0;
          nextStats.todayWordsMined = dash.streak.todayWordsMined || 0;
        }
      }

      if (dueRes.status === 'fulfilled') {
        const due = dueRes.value?.data || dueRes.value;
        nextStats.dueCardsCount =
          typeof due?.totalDueCount === 'number'
            ? due.totalDueCount
            : Array.isArray(due?.cards)
              ? due.cards.length
              : 0;
      }

      setDailyStats(nextStats);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const handleArticleImported = (articleId: string) => {
    navigate(`/reader/${articleId}`);
  };

  const todayFormatted = useMemo(() => {
    return new Date()
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
      .toUpperCase();
  }, []);

  const heroArticle = articles[0] || null;

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(article.title || '').toLowerCase().includes(q) ||
        String(article.sourceUrl || '').toLowerCase().includes(q) ||
        String(article.sourceType || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'OPTIMAL') {
        return (article.initialCoveragePct || 0) >= 95;
      }
      if (activeFilter === 'URL') {
        return article.sourceType === 'URL';
      }
      if (activeFilter === 'RAW_TEXT') {
        return article.sourceType === 'RAW_TEXT';
      }
      if (activeFilter === 'FILE') {
        return article.sourceType === 'SRT_FILE' || article.sourceType === 'TXT_FILE';
      }
      return true;
    });
  }, [articles, searchQuery, activeFilter]);

  const goal1Done = articles.length > 0 && (heroArticle?.readingProgressPct || 0) > 0;
  const goal2Done = dailyStats.todayCompletedReviews > 0;
  const goal3Done = dailyStats.todayWordsMined >= 3;
  const completedGoalsCount = [goal1Done, goal2Done, goal3Done].filter(Boolean).length;

  const filterOptions: Array<{ key: LibraryFilter; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'OPTIMAL', label: 'Optimal 95%+' },
    { key: 'URL', label: 'Web URL' },
    { key: 'RAW_TEXT', label: 'Text Notes' },
    { key: 'FILE', label: 'Subtitles & Files' },
  ];

  const formatSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'URL':
        return 'WEB ARTICLE';
      case 'SRT_FILE':
        return 'SUBTITLE';
      case 'TXT_FILE':
        return 'TEXT FILE';
      case 'RAW_TEXT':
      default:
        return 'EDITORIAL';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* GREETING HEADER (Screen 1) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter block mb-1">
            {todayFormatted}
          </span>
          <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
            Back to it, {userFirstName}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold bg-violet-brand hover:bg-violet-hover text-white self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Import Material</span>
        </button>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted dark:text-ink-pewter">
          <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
          <p className="text-sm font-mono font-semibold">Loading reading workspace...</p>
        </div>
      )}

      {errorMsg && (
        <div className="brutal-card-sm p-4 bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 text-sm font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={fetchLibraryData}
            className="brutal-pill-btn px-4 py-1 text-xs bg-white text-[#141413]"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !errorMsg && (
        <>
          {/* HERO SECTION: UP NEXT + DAILY GOALS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: UP NEXT HERO CARD */}
            <section className="lg:col-span-7 space-y-3" aria-labelledby="up-next-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="up-next-heading"
                  className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter"
                >
                  UP NEXT
                </h2>
                {heroArticle && (
                  <span className="text-xs font-mono font-bold text-violet-brand dark:text-violet-bright">
                    {Math.round(heroArticle.initialCoveragePct || 0)}% Lexical Coverage
                  </span>
                )}
              </div>

              {heroArticle ? (
                <div className="brutal-card overflow-hidden">
                  <div className="border-b-2 border-[#141413] dark:border-[#3A3E4C] overflow-hidden">
                    <BauhausHeaderArt variant="folk" className="w-full h-44 sm:h-52" />
                  </div>

                  <div className="p-5 sm:p-6 bg-white dark:bg-ink-elevated">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <span className="px-3 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright text-[11px] font-extrabold uppercase tracking-wider">
                        {formatSourceBadge(heroArticle.sourceType)}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted dark:text-ink-pewter">
                        {heroArticle.totalWordCount} Words • {heroArticle.uniqueLemmaCount} Lemmas
                      </span>
                    </div>

                    <h3 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory mb-5">
                      {heroArticle.title}
                    </h3>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter">
                        <CoverageBadge percentage={heroArticle.initialCoveragePct || 0} size="sm" />
                        <span>•</span>
                        <span>{heroArticle.totalWordCount} words</span>
                        <span>•</span>
                        <span>{heroArticle.uniqueLemmaCount} lemmas</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/reader/${heroArticle.id}`)}
                        className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-sm font-extrabold bg-violet-brand hover:bg-violet-hover text-white"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="brutal-card p-8 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-violet-brand mx-auto" />
                  <h3 className="font-sans text-lg font-extrabold">No Articles Yet</h3>
                  <p className="text-xs text-ink-muted dark:text-ink-pewter">
                    Import an article, webpage URL, or subtitle file to start sentence mining.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="brutal-pill-btn px-5 py-2 text-xs font-extrabold bg-violet-brand text-white"
                  >
                    Import First Article
                  </button>
                </div>
              )}
            </section>

            {/* RIGHT: DAILY GOALS CHECKLIST */}
            <section className="lg:col-span-5 space-y-3" aria-labelledby="daily-goals-heading">
              <div className="flex items-center justify-between">
                <h2
                  id="daily-goals-heading"
                  className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter"
                >
                  DAILY GOALS
                </h2>
                <span className="text-xs font-extrabold text-violet-brand dark:text-violet-bright">
                  {completedGoalsCount} / 3 Complete
                </span>
              </div>

              <div className="space-y-3">
                {/* Goal 1: Read 1 Article */}
                <button
                  type="button"
                  onClick={() => {
                    if (heroArticle) navigate(`/reader/${heroArticle.id}`);
                    else setIsModalOpen(true);
                  }}
                  className="w-full text-left brutal-card-sm p-3.5 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        goal1Done
                          ? 'bg-violet-brand text-white'
                          : 'bg-paper-cream dark:bg-ink-surface border border-[#141413]/20 text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {goal1Done ? (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      ) : (
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory truncate">
                        Read 1 Article
                      </div>
                      <div className="text-xs text-ink-muted dark:text-ink-pewter truncate">
                        {heroArticle ? heroArticle.title : 'Import reading material'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-violet-brand dark:text-violet-bright shrink-0 font-mono">
                    +50 XP
                  </span>
                </button>

                {/* Goal 2: Review Cloze Flashcards */}
                <Link
                  to="/review"
                  className="w-full brutal-card-sm p-3.5 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        goal2Done
                          ? 'bg-violet-brand text-white'
                          : 'bg-paper-cream dark:bg-ink-surface border border-[#141413]/20 text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {goal2Done ? (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      ) : (
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory truncate">
                        Review Flashcards
                      </div>
                      <div className="text-xs text-ink-muted dark:text-ink-pewter truncate">
                        {dailyStats.dueCardsCount > 0
                          ? `${dailyStats.dueCardsCount} Cloze cards due today`
                          : 'SM-2 spaced repetition deck'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-violet-brand dark:text-violet-bright shrink-0 font-mono">
                    +20 XP
                  </span>
                </Link>

                {/* Goal 3: Mine New Idioms */}
                <Link
                  to="/vault"
                  className="w-full brutal-card-sm p-3.5 flex items-center justify-between gap-3 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        goal3Done
                          ? 'bg-violet-brand text-white'
                          : 'bg-paper-cream dark:bg-ink-surface border border-[#141413]/20 text-[#141413] dark:text-ink-ivory'
                      }`}
                    >
                      {goal3Done ? (
                        <Check className="w-4 h-4 stroke-[3]" aria-hidden="true" />
                      ) : (
                        <PenLine className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory truncate">
                        Mine 3 Idioms
                      </div>
                      <div className="text-xs text-ink-muted dark:text-ink-pewter truncate">
                        {dailyStats.todayWordsMined} / 3 mined in context today
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-violet-brand dark:text-violet-bright shrink-0 font-mono">
                    +100 XP
                  </span>
                </Link>
              </div>
            </section>
          </div>

          {/* DISCOVER CATALOG SECTION (Screen 2) */}
          <section className="space-y-5 pt-2" aria-labelledby="discover-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2
                id="discover-heading"
                className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory"
              >
                Discover
              </h2>

              {/* Pill Search Bar */}
              <div className="relative w-full sm:w-80">
                <label htmlFor="library-search" className="sr-only">
                  Search articles, topics, or sources
                </label>
                <Search
                  className="w-4 h-4 text-[#141413] dark:text-ink-pewter absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="library-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, topics, sources..."
                  className="brutal-input w-full rounded-full pl-11 pr-4 py-2.5 text-sm font-medium"
                />
              </div>
            </div>

            {/* Horizontal Filter Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2" role="group" aria-label="Filter articles">
              {filterOptions.map((opt) => {
                const isSelected = activeFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setActiveFilter(opt.key)}
                    aria-pressed={isSelected}
                    className={`brutal-pill-btn px-4 py-1.5 text-xs font-extrabold whitespace-nowrap ${
                      isSelected
                        ? 'bg-violet-brand text-white'
                        : 'bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Article Cards Grid */}
            {filteredArticles.length === 0 ? (
              <div className="brutal-card p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-ink-muted mx-auto" />
                <h3 className="font-sans text-lg font-extrabold">No Matching Articles</h3>
                <p className="text-xs text-ink-muted dark:text-ink-pewter">
                  Try clearing your search filter or import new reading material.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, idx) => {
                  const coverage = article.initialCoveragePct || 0;
                  const variant = getBauhausVariant(idx + 1, article.sourceType);

                  return (
                    <article
                      key={article.id}
                      className="brutal-card overflow-hidden flex flex-col group"
                    >
                      <Link
                        to={`/reader/${article.id}`}
                        className="block border-b-2 border-[#141413] dark:border-[#3A3E4C] overflow-hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <BauhausHeaderArt
                          variant={variant}
                          className="w-full h-40 group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </Link>

                      <div className="p-5 flex-1 flex flex-col justify-between bg-white dark:bg-ink-elevated">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright text-[10px] font-extrabold uppercase tracking-wider">
                              {formatSourceBadge(article.sourceType)}
                            </span>
                            <CoverageBadge percentage={coverage} size="sm" />
                          </div>

                          <Link to={`/reader/${article.id}`} className="block mb-4">
                            <h3 className="font-sans text-lg font-extrabold leading-snug text-[#141413] dark:text-ink-ivory group-hover:text-violet-brand dark:group-hover:text-violet-bright transition-colors">
                              {article.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#141413]/10 dark:border-[#3A3E4C]">
                          <span className="text-xs font-semibold text-ink-muted dark:text-ink-pewter font-mono">
                            {article.totalWordCount} words • {article.uniqueLemmaCount} lemmas
                          </span>

                          <button
                            type="button"
                            onClick={() => navigate(`/reader/${article.id}`)}
                            className="brutal-pill-btn px-4 py-1.5 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white"
                          >
                            Read
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <ArticleImporterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onArticleImported={handleArticleImported}
      />
    </div>
  );
};

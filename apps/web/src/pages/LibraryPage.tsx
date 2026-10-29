import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Clock, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { ArticleImporterModal } from '../components/importer/ArticleImporterModal';
import { CoverageBadge } from '../components/importer/CoverageBadge';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchArticles = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.articles.list();
      setArticles(data || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleArticleImported = (articleId: string) => {
    navigate(`/reader/${articleId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E2D8] dark:border-[#262930] mb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-editorial-rust dark:text-editorial-orange font-semibold block mb-1">
            Archival Reading Room
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink-charcoal dark:text-ink-ivory">
            Reading Library
          </h1>
          <p className="text-sm text-ink-graphite dark:text-ink-pewter mt-1">
            Import real-world English articles, tech blogs, or subtitles to mine sentence contexts and track lexical coverage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded bg-editorial-rust hover:bg-editorial-rust/90 dark:bg-editorial-orange dark:hover:bg-editorial-orange/90 text-white shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Import Material
        </button>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-ink-graphite dark:text-ink-pewter">
          <Loader2 className="w-8 h-8 animate-spin text-editorial-rust dark:text-editorial-orange mb-3" />
          <p className="text-sm font-mono">Loading library catalog...</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm mb-6">
          {errorMsg}
          <button
            type="button"
            onClick={fetchArticles}
            className="ml-4 underline font-medium hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !errorMsg && articles.length === 0 && (
        <div className="py-16 px-6 text-center rounded-lg border-2 border-dashed border-[#E7E2D8] dark:border-[#262930] bg-paper-cream/30 dark:bg-ink-elevated/30 max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-ink-graphite dark:text-ink-pewter mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg font-bold mb-1">Your Library is Empty</h3>
          <p className="text-sm text-ink-graphite dark:text-ink-pewter mb-5">
            Import your first reading material from text, a blog link, or a subtitle file to start one-click sentence mining.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded bg-editorial-rust hover:bg-editorial-rust/90 dark:bg-editorial-orange dark:hover:bg-editorial-orange/90 text-white transition-colors"
          >
            Import Article Now
          </button>
        </div>
      )}

      {!isLoading && articles.length > 0 && (
        <div className="space-y-4">
          {articles.map((article, idx) => {
            const indexStr = String(idx + 1).padStart(2, '0');
            const coverage = article.initialCoveragePct || 0;

            return (
              <article
                key={article.id}
                className="group p-5 rounded-lg border border-[#E7E2D8] dark:border-[#262930] bg-paper-light dark:bg-ink-elevated hover:border-editorial-rust/50 dark:hover:border-editorial-orange/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <span className="font-mono text-sm font-semibold text-ink-graphite/60 dark:text-ink-pewter/60 group-hover:text-editorial-rust dark:group-hover:text-editorial-orange transition-colors pt-1">
                    {indexStr}
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-paper-cream dark:bg-ink-dark border border-[#E7E2D8] dark:border-[#262930] text-ink-graphite dark:text-ink-pewter">
                        {article.sourceType}
                      </span>
                      <CoverageBadge percentage={coverage} size="sm" />
                    </div>

                    <h2
                      onClick={() => navigate(`/reader/${article.id}`)}
                      className="font-serif text-xl font-bold tracking-tight text-ink-charcoal dark:text-ink-ivory group-hover:text-editorial-rust dark:group-hover:text-editorial-orange transition-colors cursor-pointer"
                    >
                      {article.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-ink-graphite dark:text-ink-pewter pt-1">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {article.totalWordCount} Words
                      </span>
                      <span>•</span>
                      <span>{article.uniqueLemmaCount} Unique Lemmas</span>
                      {article.createdAt && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E7E2D8] dark:border-[#262930]">
                  <button
                    type="button"
                    onClick={() => navigate(`/reader/${article.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded border border-[#E7E2D8] dark:border-[#262930] bg-paper-cream/60 dark:bg-ink-dark hover:bg-editorial-rust hover:text-white dark:hover:bg-editorial-orange dark:hover:text-white transition-colors"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ArticleImporterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onArticleImported={handleArticleImported}
      />
    </div>
  );
};

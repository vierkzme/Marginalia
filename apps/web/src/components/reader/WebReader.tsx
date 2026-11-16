import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ExternalLink,
  BookMarked,
  X,
  Star,
  Check,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SmartHighlightedSentence, SentenceHighlight } from './SmartHighlightedSentence';
import { useTextSelection } from '../../hooks/useTextSelection';
import { SelectionPopover } from './SelectionPopover';
import { BauhausHeaderArt } from '../common/BauhausHeaderArt';
import { api, getReaderPreferences, setReaderPreferences } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export interface WebReaderProps {
  article: {
    id: string;
    title: string;
    sourceType: string;
    sourceUrl?: string | null;
    totalWordCount: number;
    uniqueLemmaCount: number;
    coveragePercentage: number;
    readingProgressPct?: number;
    isCompleted?: boolean;
    summaryMessage?: string;
  };
  paragraphs: Array<{
    paragraphIndex: number;
    sentences: Array<{
      sentenceId: string;
      sentenceIndex: number;
      sentenceText: string;
      highlights: SentenceHighlight[];
    }>;
  }>;
  onMineSuccess?: () => void;
  children?: React.ReactNode;
}

export const WebReader: React.FC<WebReaderProps> = ({
  article,
  paragraphs,
  onMineSuccess,
  children,
}) => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const readerContentRef = useRef<HTMLDivElement>(null);
  const { selectionData, clearSelection } = useTextSelection(readerContentRef);
  const initialPrefs = getReaderPreferences();
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(initialPrefs.fontSize);
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>(initialPrefs.readingTheme);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [inspectedWord, setInspectedWord] = useState<SentenceHighlight | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(Boolean(article.isCompleted));
  const [completing, setCompleting] = useState<boolean>(false);

  useEffect(() => {
    setIsCompleted(Boolean(article.isCompleted));
    if (article.id && (article.readingProgressPct || 0) === 0 && !article.isCompleted) {
      api.articles.updateProgress(article.id, { progressPct: 25 }).catch(() => {});
    }
  }, [article.id, article.isCompleted, article.readingProgressPct]);

  const handleCompleteReading = async () => {
    if (isCompleted || completing) return;
    setCompleting(true);
    try {
      await api.articles.updateProgress(article.id, {
        progressPct: 100,
        isCompleted: true,
      });
      setIsCompleted(true);
      await refreshProfile();
    } catch {
      // Ignore silent failure
    } finally {
      setCompleting(false);
    }
  };

  const handleChangeFontSize = (sz: 'sm' | 'base' | 'lg' | 'xl') => {
    setFontSize(sz);
    setReaderPreferences({ fontSize: sz, readingTheme });
  };

  const handleChangeTheme = (theme: 'light' | 'sepia' | 'dark') => {
    setReadingTheme(theme);
    setReaderPreferences({ fontSize, readingTheme: theme });
  };

  const allHighlights = paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.highlights));
  const uniqueHighlights = Array.from(
    new Map(allHighlights.map((h) => [h.vocabItemId, h])).values()
  );

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectedWord) {
        setInspectedWord(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [inspectedWord]);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-base leading-relaxed';
      case 'base':
        return 'text-lg leading-[1.8]';
      case 'lg':
        return 'text-xl leading-[1.85]';
      case 'xl':
        return 'text-2xl leading-[1.9]';
    }
  };

  const getSheetThemeClass = () => {
    switch (readingTheme) {
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#1C1917]';
      case 'dark':
        return 'bg-[#16181F] text-[#F6F3EB]';
      case 'light':
      default:
        return 'bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory';
    }
  };

  const coverageTierLabel =
    article.coveragePercentage >= 95
      ? 'OPTIMAL INPUT'
      : article.coveragePercentage >= 90
        ? 'CHALLENGING'
        : 'HEAVY LOAD';

  const sourceDomain = article.sourceUrl
    ? (() => {
        try {
          return new URL(article.sourceUrl).hostname.replace(/^www\./, '');
        } catch {
          return article.sourceType;
        }
      })()
    : article.sourceType === 'RAW_TEXT'
      ? 'Personal Text Note'
      : article.sourceType;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas-cream dark:bg-ink-dark pb-12">
      {/* HERO BAUHAUS BANNER + FLOATING READER TOOLBAR (Screen 3 inspiration) */}
      <div className="relative border-b-2 border-[#141413] dark:border-[#3A3E4C] overflow-hidden bg-[#FDFBF7]">
        <BauhausHeaderArt variant="mondrian" className="w-full h-44 sm:h-56" />

        <div className="absolute inset-x-0 top-3 sm:top-4 px-3 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex items-start sm:items-center justify-between gap-2">
            {/* Circular Back Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Back to Library"
              className="brutal-pill-btn w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory flex items-center justify-center hover:bg-violet-tint"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>

            {/* Reader Controls Dock */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <div
                className="flex items-center rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated p-0.5 shadow-brutal-xs text-[11px] sm:text-xs font-mono"
                role="group"
                aria-label="Font size"
              >
                {(['sm', 'base', 'lg', 'xl'] as const).map((sz) => {
                  const labelMap = { sm: 'S', base: 'M', lg: 'L', xl: 'XL' };
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleChangeFontSize(sz)}
                      aria-pressed={fontSize === sz}
                      className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-bold transition-colors ${
                        fontSize === sz
                          ? 'bg-violet-brand text-white'
                          : 'text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                      }`}
                    >
                      {labelMap[sz]}
                    </button>
                  );
                })}
              </div>

              <div
                className="flex items-center rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated p-0.5 shadow-brutal-xs text-[11px] sm:text-xs"
                role="group"
                aria-label="Reading theme"
              >
                {(['light', 'sepia', 'dark'] as const).map((theme) => {
                  const labelMap = { light: 'Paper', sepia: 'Sepia', dark: 'Dark' };
                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => handleChangeTheme(theme)}
                      aria-pressed={readingTheme === theme}
                      className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold transition-colors ${
                        readingTheme === theme
                          ? 'bg-[#141413] dark:bg-violet-brand text-white'
                          : 'text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                      }`}
                    >
                      {labelMap[theme]}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsLedgerOpen((prev) => !prev)}
                aria-label="Toggle Vault Ledger"
                aria-expanded={isLedgerOpen}
                className={`brutal-pill-btn px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-extrabold inline-flex items-center gap-1.5 ${
                  isLedgerOpen
                    ? 'bg-violet-brand text-white'
                    : 'bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Vault ({uniqueHighlights.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OVERLAPPING EDITORIAL SHEET & MARGIN SYLLABUS */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-10 flex flex-col lg:flex-row gap-8 items-start">
        <article
          className={`flex-1 w-full rounded-3xl border-2 border-[#141413] dark:border-[#3A3E4C] shadow-brutal-lg dark:shadow-brutal-dark p-6 sm:p-10 transition-colors duration-200 ${getSheetThemeClass()}`}
        >
          {/* Sheet Header matching Screen 3 Overlapping Card */}
          <header className="mb-8 pb-6 border-b-2 border-[#141413]/15 dark:border-[#3A3E4C]">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="px-3 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright text-[11px] font-extrabold uppercase tracking-wider">
                {coverageTierLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold font-mono">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" aria-hidden="true" />
                <span>{article.coveragePercentage.toFixed(1)}%</span>
                <span className="opacity-70 font-medium">({article.uniqueLemmaCount} unique lemmas)</span>
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-5">
              {article.title}
            </h1>

            {/* Instructor / Source Metadata Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#141413] dark:border-[#3A3E4C] bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright font-extrabold text-sm flex items-center justify-center shrink-0">
                  {article.sourceType.slice(0, 2)}
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest opacity-60">
                    SOURCE MATERIAL
                  </span>
                  <div className="text-xs sm:text-sm font-bold flex flex-wrap items-center gap-2">
                    <span>{sourceDomain}</span>
                    <span className="opacity-40">•</span>
                    <span className="font-mono text-xs opacity-75">{article.totalWordCount} words</span>
                    {article.sourceUrl && (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-brand dark:text-violet-bright hover:underline"
                      >
                        Open Link <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="px-2.5 py-1 rounded-full bg-marker-learning text-[#141413] border border-marker-learningBorder">
                  Learning ({allHighlights.filter((h) => h.highlightColor === 'YELLOW').length})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-marker-leech text-[#4C0519] border border-marker-leechBorder">
                  Leech ({allHighlights.filter((h) => h.highlightColor === 'PINK').length})
                </span>
              </div>
            </div>
          </header>

          {/* Distraction-Free Reading Paragraphs */}
          <div
            ref={readerContentRef}
            className={`max-w-reader mx-auto font-serif ${getFontSizeClass()} space-y-6 select-text`}
          >
            {paragraphs.map((para) => (
              <p key={para.paragraphIndex} className="leading-relaxed">
                {para.sentences.map((sent) => (
                  <SmartHighlightedSentence
                    key={sent.sentenceId}
                    sentenceId={sent.sentenceId}
                    sentenceText={sent.sentenceText}
                    highlights={sent.highlights}
                    onInspectHighlight={(hl) => setInspectedWord(hl)}
                  />
                ))}
              </p>
            ))}
          </div>

          {selectionData && (
            <SelectionPopover
              articleId={article.id}
              selectionData={selectionData}
              onClose={clearSelection}
              onSaved={(_item) => {
                if (onMineSuccess) onMineSuccess();
              }}
            />
          )}

          <footer className="max-w-reader mx-auto mt-14 pt-6 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] space-y-5 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream/70 dark:bg-ink-surface">
              <div className="text-left">
                <div className="text-xs font-extrabold uppercase tracking-wider text-violet-brand dark:text-violet-bright">
                  Daily Reading Goal
                </div>
                <div className="text-xs font-medium opacity-80">
                  {isCompleted
                    ? 'Article marked as finished for today.'
                    : 'Finished reading? Claim your daily reading XP.'}
                </div>
              </div>

              {isCompleted ? (
                <span className="brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold bg-emerald-100 text-emerald-950 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Completed (+50 XP)</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteReading}
                  disabled={completing}
                  className="brutal-pill-btn inline-flex items-center gap-2 px-5 py-2 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white shrink-0 disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Complete Reading (+50 XP)</span>
                </button>
              )}
            </div>

            <p className="text-xs font-mono font-semibold opacity-70">
              One-Click Sentence Mining: Highlight any word or phrase with your cursor to save it to your Vault.
            </p>
          </footer>
        </article>

        {/* NUMBERED VAULT LEDGER SIDEBAR (Screen 3 Syllabus Motif: 01, 02, 03) */}
        {isLedgerOpen && (
          <aside className="w-full lg:w-80 shrink-0 space-y-3" aria-label="Article vocabulary ledger">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter">
                VAULT SYLLABUS ({uniqueHighlights.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsLedgerOpen(false)}
                aria-label="Close Vault Ledger"
                className="p-1 rounded-full text-ink-muted hover:text-[#141413] dark:hover:text-ink-ivory"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {uniqueHighlights.length === 0 ? (
              <div className="brutal-card-sm p-5 text-xs text-ink-muted dark:text-ink-pewter font-medium">
                No tracked Vault words detected in this article yet. Select any word in the text to mine it!
              </div>
            ) : (
              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {uniqueHighlights.map((hl, idx) => {
                  const indexStr = String(idx + 1).padStart(2, '0');
                  const isActive = inspectedWord?.vocabItemId === hl.vocabItemId;
                  const isLeech = hl.highlightColor === 'PINK';

                  return (
                    <button
                      key={hl.vocabItemId}
                      type="button"
                      onClick={() => setInspectedWord(hl)}
                      className={`w-full text-left brutal-card-sm p-4 flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5 ${
                        isActive ? 'border-t-4 border-t-violet-brand' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`font-mono text-base font-extrabold shrink-0 ${
                            isActive ? 'text-violet-brand' : 'text-ink-muted/60 dark:text-ink-pewter/60'
                          }`}
                        >
                          {indexStr}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#141413] dark:text-ink-ivory truncate">
                            {hl.lemma}
                          </div>
                          <div className="text-xs text-ink-muted dark:text-ink-pewter truncate">
                            {hl.definition || `Found as "${hl.surfaceForm}"`}
                          </div>
                        </div>
                      </div>

                      {isLeech ? (
                        <span className="w-7 h-7 rounded-full bg-marker-leech border border-marker-leechBorder text-[#4C0519] flex items-center justify-center shrink-0" title="Leech Word">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-violet-brand text-white flex items-center justify-center shrink-0" title="Learning in Vault">
                          <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* WORD INSPECTION MODAL */}
      {inspectedWord &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspected-word-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#141413]/55 backdrop-blur-xs"
            onClick={() => setInspectedWord(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated p-6 shadow-brutal-lg dark:shadow-brutal-dark"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full border ${
                    inspectedWord.highlightColor === 'PINK'
                      ? 'bg-marker-leech text-[#4C0519] border-marker-leechBorder'
                      : 'bg-violet-soft text-violet-brand border-violet-brand/20'
                  }`}
                >
                  {inspectedWord.highlightColor === 'PINK' ? 'Leech Word' : 'Learning Stage'}
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedWord(null)}
                  aria-label="Close inspection dialog"
                  className="brutal-pill-btn p-1.5 bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <h3 id="inspected-word-title" className="font-sans text-2xl font-extrabold text-[#141413] dark:text-ink-ivory mb-1">
                {inspectedWord.lemma}
              </h3>
              <p className="text-xs text-ink-muted dark:text-ink-pewter font-mono mb-4">
                Surface form: "{inspectedWord.surfaceForm}"
              </p>

              <div className="p-4 rounded-2xl bg-violet-tint dark:bg-ink-surface border-2 border-[#141413] dark:border-[#3A3E4C] text-sm mb-5">
                <span className="font-mono text-[11px] uppercase tracking-wider text-violet-brand dark:text-violet-bright font-extrabold block mb-1">
                  Definition
                </span>
                <p className="text-[#141413] dark:text-ink-ivory font-medium leading-relaxed">
                  {inspectedWord.definition || 'No definition recorded yet.'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedWord(null)}
                  className="brutal-pill-btn px-5 py-2 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {children}
    </div>
  );
};

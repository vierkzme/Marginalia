import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, BookMarked, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SmartHighlightedSentence, SentenceHighlight } from './SmartHighlightedSentence';
import { CoverageBadge } from '../importer/CoverageBadge';

export interface WebReaderProps {
  article: {
    id: string;
    title: string;
    sourceType: string;
    sourceUrl?: string | null;
    totalWordCount: number;
    uniqueLemmaCount: number;
    coveragePercentage: number;
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
  children?: React.ReactNode;
}

export const WebReader: React.FC<WebReaderProps> = ({
  article,
  paragraphs,
  children,
}) => {
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [inspectedWord, setInspectedWord] = useState<SentenceHighlight | null>(null);

  const allHighlights = paragraphs.flatMap((p) => p.sentences.flatMap((s) => s.highlights));
  const uniqueHighlights = Array.from(
    new Map(allHighlights.map((h) => [h.vocabItemId, h])).values()
  );

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

  const getThemeBgClass = () => {
    switch (readingTheme) {
      case 'sepia':
        return 'bg-[#F4ECD8] text-[#1C1917]';
      case 'dark':
        return 'bg-ink-dark text-ink-ivory';
      case 'light':
      default:
        return 'bg-paper-light dark:bg-ink-dark text-ink-charcoal dark:text-ink-ivory';
    }
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${getThemeBgClass()} transition-colors duration-200`}>
      <div className="sticky top-16 z-30 border-b border-[#E7E2D8] dark:border-[#262930] bg-inherit/95 backdrop-blur-sm px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="p-1.5 rounded hover:bg-paper-cream dark:hover:bg-ink-elevated text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory transition-colors"
              aria-label="Back to Library"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-serif font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
              {article.title}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <CoverageBadge percentage={article.coveragePercentage} size="sm" />
            </div>

            <div className="flex items-center border border-[#E7E2D8] dark:border-[#262930] rounded p-0.5 bg-paper-cream/60 dark:bg-ink-elevated/60 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-editorial-rust text-white font-bold' : 'hover:bg-paper-cream'}`}
              >
                S
              </button>
              <button
                type="button"
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-editorial-rust text-white font-bold' : 'hover:bg-paper-cream'}`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-editorial-rust text-white font-bold' : 'hover:bg-paper-cream'}`}
              >
                L
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xl')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'xl' ? 'bg-editorial-rust text-white font-bold' : 'hover:bg-paper-cream'}`}
              >
                XL
              </button>
            </div>

            <div className="flex items-center border border-[#E7E2D8] dark:border-[#262930] rounded p-0.5 bg-paper-cream/60 dark:bg-ink-elevated/60 text-xs">
              <button
                type="button"
                onClick={() => setReadingTheme('light')}
                className={`px-2 py-0.5 rounded ${readingTheme === 'light' ? 'bg-white text-ink-charcoal font-semibold shadow-xs' : 'text-ink-graphite'}`}
              >
                Paper
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('sepia')}
                className={`px-2 py-0.5 rounded ${readingTheme === 'sepia' ? 'bg-[#EBDDC0] text-[#1C1917] font-semibold shadow-xs' : 'text-ink-graphite'}`}
              >
                Sepia
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('dark')}
                className={`px-2 py-0.5 rounded ${readingTheme === 'dark' ? 'bg-ink-dark text-white font-semibold shadow-xs' : 'text-ink-graphite'}`}
              >
                Dark
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsLedgerOpen((prev) => !prev)}
              aria-label="Toggle Vault Ledger"
              className="p-1.5 rounded border border-[#E7E2D8] dark:border-[#262930] hover:bg-paper-cream dark:hover:bg-ink-elevated text-editorial-rust dark:text-editorial-orange"
            >
              <BookMarked className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative flex gap-8">
        <article className="flex-1 max-w-reader mx-auto">
          <header className="mb-10 pb-6 border-b border-[#E7E2D8] dark:border-[#262930]">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded bg-paper-cream dark:bg-ink-elevated border border-[#E7E2D8] dark:border-[#262930] text-ink-graphite dark:text-ink-pewter">
                {article.sourceType}
              </span>
              <span className="text-xs font-mono text-ink-graphite dark:text-ink-pewter">
                {article.totalWordCount} Words • {article.uniqueLemmaCount} Unique Lemmas
              </span>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-editorial-rust dark:text-editorial-orange hover:underline ml-auto"
                >
                  Source Link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink-charcoal dark:text-ink-ivory leading-tight">
              {article.title}
            </h1>

            <div className="mt-4 p-3 rounded-lg bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#E7E2D8] dark:border-[#262930] flex flex-wrap items-center justify-between text-xs font-mono">
              <span>Text Coverage: <strong>{article.coveragePercentage}%</strong></span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm inline-block" />
                  Kuning: Learning ({allHighlights.filter((h) => h.highlightColor === 'YELLOW').length})
                </span>
                <span className="flex items-center gap-1 text-rose-800 dark:text-rose-300">
                  <span className="w-2.5 h-2.5 bg-rose-400 rounded-sm inline-block" />
                  Merah Muda: Leech ({allHighlights.filter((h) => h.highlightColor === 'PINK').length})
                </span>
              </div>
            </div>
          </header>

          <div className={`font-serif ${getFontSizeClass()} text-ink-charcoal dark:text-ink-ivory space-y-6 select-text`}>
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

          <footer className="mt-16 pt-8 border-t border-[#E7E2D8] dark:border-[#262930] text-center text-xs text-ink-graphite dark:text-ink-pewter font-mono">
            Sentence Mining: Select any word or phrase with your cursor to save it to your Vault.
          </footer>
        </article>

        {isLedgerOpen && (
          <aside className="hidden lg:block w-72 shrink-0 border-l border-[#E7E2D8] dark:border-[#262930] pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">Margin Vault Ledger</h3>
              <button
                type="button"
                onClick={() => setIsLedgerOpen(false)}
                className="p-1 rounded text-ink-graphite hover:text-ink-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-ink-graphite dark:text-ink-pewter">
              {uniqueHighlights.length} target items detected in this text.
            </p>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {uniqueHighlights.map((hl) => (
                <div
                  key={hl.vocabItemId}
                  onClick={() => setInspectedWord(hl)}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                    hl.highlightColor === 'PINK'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200 hover:bg-rose-100'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{hl.lemma}</span>
                    <span className="text-[10px] uppercase font-mono px-1 rounded bg-white/60 dark:bg-black/30">
                      {hl.highlightColor === 'PINK' ? 'Leech' : 'Learning'}
                    </span>
                  </div>
                  {hl.definition && (
                    <p className="text-[11px] text-ink-graphite dark:text-ink-pewter mt-1 line-clamp-2">
                      {hl.definition}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {inspectedWord && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setInspectedWord(null)}
        >
          <div
            className="w-full max-w-md bg-paper-light dark:bg-ink-dark rounded-lg border border-[#E7E2D8] dark:border-[#262930] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-0.5 text-xs font-mono uppercase rounded ${
                inspectedWord.highlightColor === 'PINK'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {inspectedWord.highlightColor === 'PINK' ? 'Leech Word' : 'Learning Stage'}
              </span>
              <button
                type="button"
                onClick={() => setInspectedWord(null)}
                className="text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="font-serif text-2xl font-bold mb-1">{inspectedWord.lemma}</h3>
            <p className="text-xs text-ink-graphite dark:text-ink-pewter font-mono mb-4">
              Found as: "{inspectedWord.surfaceForm}"
            </p>

            <div className="p-3 rounded bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#E7E2D8] dark:border-[#262930] text-sm mb-4">
              <span className="font-mono text-xs uppercase tracking-wider text-editorial-rust dark:text-editorial-orange font-semibold block mb-1">
                Definition
              </span>
              {inspectedWord.definition || 'No definition recorded yet.'}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedWord(null)}
                className="px-4 py-2 text-sm font-semibold rounded bg-editorial-rust text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
};

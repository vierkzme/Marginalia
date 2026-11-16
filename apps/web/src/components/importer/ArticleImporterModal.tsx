import React, { useState, useEffect } from 'react';
import { X, FileText, Link as LinkIcon, UploadCloud, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { CoverageBadge } from './CoverageBadge';

interface ArticleImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleImported: (articleId: string) => void;
}

export const ArticleImporterModal: React.FC<ArticleImporterModalProps> = ({
  isOpen,
  onClose,
  onArticleImported,
}) => {
  const [activeTab, setActiveTab] = useState<'RAW_TEXT' | 'URL' | 'FILE'>('RAW_TEXT');
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<any | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleReset = () => {
    setTitle('');
    setRawText('');
    setSourceUrl('');
    setSelectedFile(null);
    setErrorMsg(null);
    setImportedData(null);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let result: any = null;

      if (activeTab === 'RAW_TEXT') {
        if (!rawText.trim()) throw new Error('Please enter article text.');
        result = await api.articles.import({
          sourceType: 'RAW_TEXT',
          title: title.trim() || undefined,
          rawContent: rawText.trim(),
        });
      } else if (activeTab === 'URL') {
        if (!sourceUrl.trim()) throw new Error('Please enter a valid URL.');
        result = await api.articles.import({
          sourceType: 'URL',
          title: title.trim() || undefined,
          sourceUrl: sourceUrl.trim(),
        });
      } else if (activeTab === 'FILE') {
        if (!selectedFile) throw new Error('Please choose a .txt or .srt file to upload.');
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (title.trim()) formData.append('title', title.trim());
        result = await api.articles.import(formData);
      }

      setImportedData(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabClass = (isActive: boolean) =>
    `brutal-pill-btn px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 ${
      isActive
        ? 'bg-violet-brand text-white'
        : 'bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory hover:bg-violet-tint dark:hover:bg-ink-elevated'
    }`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="importer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141413]/50 backdrop-blur-xs"
      onClick={() => {
        handleReset();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated shadow-brutal-lg dark:shadow-brutal-dark overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream dark:bg-ink-surface">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-brand dark:text-violet-bright block">
              Sentence Mining Importer
            </span>
            <h2 id="importer-modal-title" className="font-sans text-xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
              Import Reading Material
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            aria-label="Close dialog"
            className="brutal-pill-btn p-2 bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-rose-50"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-3 border-b border-[#141413]/15 dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated">
          <div className="flex flex-wrap items-center gap-2.5" role="tablist" aria-label="Import source type">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'RAW_TEXT'}
              onClick={() => {
                setActiveTab('RAW_TEXT');
                setErrorMsg(null);
              }}
              className={tabClass(activeTab === 'RAW_TEXT')}
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'URL'}
              onClick={() => {
                setActiveTab('URL');
                setErrorMsg(null);
              }}
              className={tabClass(activeTab === 'URL')}
            >
              <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Extract from URL</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'FILE'}
              onClick={() => {
                setActiveTab('FILE');
                setErrorMsg(null);
              }}
              className={tabClass(activeTab === 'FILE')}
            >
              <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Upload .txt / .srt</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border-2 border-[#141413] dark:border-rose-700 text-rose-950 dark:text-rose-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {!importedData ? (
            <form id="importer-form" onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label htmlFor="import-title" className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
                  Article Title (Optional)
                </label>
                <input
                  id="import-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Architecture & Failures"
                  className="brutal-input w-full px-4 py-2.5 text-sm rounded-2xl"
                />
              </div>

              {activeTab === 'RAW_TEXT' && (
                <div>
                  <label htmlFor="import-raw-text" className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
                    Article Text *
                  </label>
                  <textarea
                    id="import-raw-text"
                    required
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your English article paragraphs here..."
                    className="brutal-input w-full px-4 py-3 text-sm font-serif leading-relaxed rounded-2xl"
                  />
                </div>
              )}

              {activeTab === 'URL' && (
                <div>
                  <label htmlFor="import-url" className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
                    Public Web Article URL *
                  </label>
                  <input
                    id="import-url"
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://engineering.example.com/blog/distributed-consensus"
                    className="brutal-input w-full px-4 py-2.5 text-sm rounded-2xl"
                  />
                  <p className="text-xs text-ink-muted dark:text-ink-pewter mt-2 font-medium">
                    Uses Mozilla Readability to strip ads, navigation headers, and sidebars automatically.
                  </p>
                </div>
              )}

              {activeTab === 'FILE' && (
                <div>
                  <label htmlFor="import-file" className="block text-xs font-extrabold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
                    Select .txt or .srt file *
                  </label>
                  <div className="border-2 border-dashed border-[#141413] dark:border-[#3A3E4C] rounded-2xl p-6 text-center bg-canvas-cream/70 dark:bg-ink-surface">
                    <input
                      id="import-file"
                      type="file"
                      accept=".txt,.srt"
                      required
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-[#141413] dark:text-ink-ivory file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-[#141413] file:text-xs file:font-bold file:bg-white file:text-[#141413] hover:file:bg-violet-brand hover:file:text-white file:transition-colors cursor-pointer"
                    />
                    <p className="text-xs text-ink-muted dark:text-ink-pewter mt-3 font-medium">
                      SRT files automatically have timestamps, line numbers, and HTML tags stripped.
                    </p>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="brutal-card-sm p-4 bg-violet-tint dark:bg-ink-surface">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-violet-soft text-violet-brand text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
                  {importedData.sourceType}
                </span>
                <h3 className="font-sans text-lg font-extrabold text-[#141413] dark:text-ink-ivory">
                  {importedData.title}
                </h3>
                <p className="text-xs text-ink-muted dark:text-ink-pewter font-mono mt-1">
                  {importedData.totalWordCount} Words • {importedData.uniqueLemmaCount} Unique Lemmas
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-ink-muted dark:text-ink-pewter">
                  Pre-Reading Text Coverage Analysis
                </h4>
                <CoverageBadge
                  percentage={importedData.coverage.percentage}
                  knownLemmasCount={importedData.coverage.knownLemmasCount}
                  learningLemmasCount={importedData.coverage.learningLemmasCount}
                  leechLemmasCount={importedData.coverage.leechLemmasCount}
                  unknownLemmasCount={importedData.coverage.unknownLemmasCount}
                  difficultyTier={importedData.coverage.difficultyTier}
                  summaryMessage={importedData.coverage.summaryMessage}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-[#141413] dark:border-[#3A3E4C] bg-canvas-cream dark:bg-ink-surface">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="brutal-pill-btn px-5 py-2 text-xs font-bold bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-paper-cream"
          >
            Cancel
          </button>

          {!importedData ? (
            <button
              type="submit"
              form="importer-form"
              disabled={isLoading}
              className="brutal-pill-btn px-5 py-2 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              <span>Analyze &amp; Import</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const id = importedData.articleId;
                handleReset();
                onClose();
                onArticleImported(id);
              }}
              className="brutal-pill-btn px-5 py-2 text-xs font-extrabold bg-violet-brand hover:bg-violet-hover text-white"
            >
              Open in Web Reader
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

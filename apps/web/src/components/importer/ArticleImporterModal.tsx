import React, { useState, useEffect } from 'react';
import { X, FileText, Link, UploadCloud, Loader2 } from 'lucide-react';
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="importer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-paper-light dark:bg-ink-dark rounded-lg border border-[#E7E2D8] dark:border-[#262930] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2D8] dark:border-[#262930]">
          <h2 id="importer-modal-title" className="font-serif text-xl font-bold text-ink-charcoal dark:text-ink-ivory">
            Import New Reading Material
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E7E2D8] dark:border-[#262930]" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'RAW_TEXT'}
              onClick={() => { setActiveTab('RAW_TEXT'); setErrorMsg(null); }}
              className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'RAW_TEXT'
                  ? 'border-editorial-rust text-editorial-rust dark:border-editorial-orange dark:text-editorial-orange font-semibold'
                  : 'border-transparent text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory'
              }`}
            >
              <FileText className="w-4 h-4" />
              Paste Text
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'URL'}
              onClick={() => { setActiveTab('URL'); setErrorMsg(null); }}
              className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'URL'
                  ? 'border-editorial-rust text-editorial-rust dark:border-editorial-orange dark:text-editorial-orange font-semibold'
                  : 'border-transparent text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory'
              }`}
            >
              <Link className="w-4 h-4" />
              Extract from URL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'FILE'}
              onClick={() => { setActiveTab('FILE'); setErrorMsg(null); }}
              className={`pb-3 px-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'FILE'
                  ? 'border-editorial-rust text-editorial-rust dark:border-editorial-orange dark:text-editorial-orange font-semibold'
                  : 'border-transparent text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Upload .txt / .srt
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3 rounded bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm">
              {errorMsg}
            </div>
          )}

          {!importedData ? (
            <form id="importer-form" onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label htmlFor="import-title" className="block text-xs font-mono uppercase tracking-wider text-ink-graphite dark:text-ink-pewter mb-1">
                  Article Title (Optional)
                </label>
                <input
                  id="import-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Architecture & Failures"
                  className="w-full px-3 py-2 text-sm rounded border border-[#E7E2D8] dark:border-[#262930] bg-white dark:bg-ink-elevated text-ink-charcoal dark:text-ink-ivory focus:ring-1 focus:ring-editorial-rust"
                />
              </div>

              {activeTab === 'RAW_TEXT' && (
                <div>
                  <label htmlFor="import-raw-text" className="block text-xs font-mono uppercase tracking-wider text-ink-graphite dark:text-ink-pewter mb-1">
                    Article Text *
                  </label>
                  <textarea
                    id="import-raw-text"
                    required
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your English article paragraphs here..."
                    className="w-full px-3 py-2 text-sm font-serif leading-relaxed rounded border border-[#E7E2D8] dark:border-[#262930] bg-white dark:bg-ink-elevated text-ink-charcoal dark:text-ink-ivory focus:ring-1 focus:ring-editorial-rust"
                  />
                </div>
              )}

              {activeTab === 'URL' && (
                <div>
                  <label htmlFor="import-url" className="block text-xs font-mono uppercase tracking-wider text-ink-graphite dark:text-ink-pewter mb-1">
                    Public Web Article URL *
                  </label>
                  <input
                    id="import-url"
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://engineering.example.com/blog/distributed-consensus"
                    className="w-full px-3 py-2 text-sm rounded border border-[#E7E2D8] dark:border-[#262930] bg-white dark:bg-ink-elevated text-ink-charcoal dark:text-ink-ivory focus:ring-1 focus:ring-editorial-rust"
                  />
                  <p className="text-xs text-ink-graphite dark:text-ink-pewter mt-1">
                    Uses Mozilla Readability to strip ads, navigation headers, and sidebars automatically.
                  </p>
                </div>
              )}

              {activeTab === 'FILE' && (
                <div>
                  <label htmlFor="import-file" className="block text-xs font-mono uppercase tracking-wider text-ink-graphite dark:text-ink-pewter mb-1">
                    Select .txt or .srt file *
                  </label>
                  <div className="border-2 border-dashed border-[#E7E2D8] dark:border-[#262930] rounded-lg p-6 text-center hover:bg-paper-cream/50 dark:hover:bg-ink-elevated/50 transition-colors">
                    <input
                      id="import-file"
                      type="file"
                      accept=".txt,.srt"
                      required
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-ink-graphite dark:text-ink-pewter file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-paper-cream dark:file:bg-ink-elevated file:text-ink-charcoal dark:file:text-ink-ivory hover:file:bg-editorial-rust hover:file:text-white file:transition-colors cursor-pointer"
                    />
                    <p className="text-xs text-ink-graphite dark:text-ink-pewter mt-2">
                      SRT files automatically have timestamps, line numbers, and HTML tags stripped.
                    </p>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-serif text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  {importedData.title}
                </h3>
                <p className="text-xs text-ink-graphite dark:text-ink-pewter font-mono mt-1">
                  Source: {importedData.sourceType} • {importedData.totalWordCount} Words • {importedData.uniqueLemmaCount} Unique Lemmas
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-mono uppercase tracking-wider text-ink-graphite dark:text-ink-pewter">
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

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7E2D8] dark:border-[#262930] bg-paper-cream/30 dark:bg-ink-elevated/30">
          <button
            type="button"
            onClick={() => { handleReset(); onClose(); }}
            className="px-4 py-2 text-sm font-medium rounded border border-[#E7E2D8] dark:border-[#262930] text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory hover:bg-paper-cream dark:hover:bg-ink-elevated transition-colors"
          >
            Cancel
          </button>

          {!importedData ? (
            <button
              type="submit"
              form="importer-form"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded bg-editorial-rust hover:bg-editorial-rust/90 dark:bg-editorial-orange dark:hover:bg-editorial-orange/90 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Analyze &amp; Import
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
              className="px-4 py-2 text-sm font-semibold rounded bg-editorial-rust hover:bg-editorial-rust/90 dark:bg-editorial-orange dark:hover:bg-editorial-orange/90 text-white transition-colors"
            >
              Open in Web Reader
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

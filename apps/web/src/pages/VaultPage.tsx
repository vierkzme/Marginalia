import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Search,
  BookMarked,
  Tag,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';

export const VaultPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [inspectItem, setInspectItem] = useState<any | null>(null);

  const fetchVault = () => {
    setLoading(true);
    setError(null);

    const params: { tag?: string; stage?: string; q?: string } = {};
    if (selectedTag !== 'all') params.tag = selectedTag;
    if (selectedStage !== 'all') params.stage = selectedStage;
    if (searchQuery.trim()) params.q = searchQuery.trim();

    api.vocab.listVault(params)
      .then((res: any) => {
        const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (Array.isArray(items)) {
          setItems(items);
        } else {
          setError(res?.error || 'Failed to load vault items.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Network error while loading vault.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVault();
  }, [selectedTag, selectedStage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVault();
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'MATURE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'YOUNG':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'LEARNING':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'NEW':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300 border-gray-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-paper-light dark:bg-ink-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink-charcoal dark:text-ink-ivory">
              Idiom & Vocabulary Vault
            </h1>
            <p className="text-sm text-ink-graphite dark:text-ink-pewter font-mono mt-1">
              {items.length} mined terms anchored with full real-world sentences
            </p>
          </div>

          {/* SEARCH FORM */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lemma or meaning..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-editorial-rust"
            />
            <Search className="w-4 h-4 text-ink-graphite absolute left-3 top-2.5" />
          </form>
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#E7E2D8] dark:border-[#262930] text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-ink-graphite dark:text-ink-pewter mr-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Tag:
            </span>
            {['all', 'Idiom', 'Phrasal Verb', 'Academic', 'Slang'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedTag === tag
                    ? 'bg-editorial-rust text-white font-bold'
                    : 'bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter hover:bg-paper-cream/80'
                }`}
              >
                {tag === 'all' ? 'All Tags' : tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-ink-graphite dark:text-ink-pewter mr-1">Stage:</span>
            {['all', 'NEW', 'LEARNING', 'YOUNG', 'MATURE'].map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setSelectedStage(stage)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedStage === stage
                    ? 'bg-editorial-rust text-white font-bold'
                    : 'bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter hover:bg-paper-cream/80'
                }`}
              >
                {stage === 'all' ? 'All Stages' : stage}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-ink-graphite dark:text-ink-pewter">
            <Loader2 className="w-8 h-8 animate-spin text-editorial-rust mb-3" />
            <p className="font-serif text-sm">Searching your personal lexical vault...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 font-mono text-sm">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <BookMarked className="w-12 h-12 text-ink-pewter mx-auto" />
            <h3 className="font-serif text-xl font-bold">No Items Match Your Filter</h3>
            <p className="text-xs font-mono text-ink-graphite dark:text-ink-pewter">
              Try selecting another tag or import new articles to mine sentences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const tags = item.tags?.map((t: any) => t.tag?.name || t.name) || [];
              const contexts = item.contexts || [];
              const primaryContext = contexts.find((c: any) => c.isPrimary) || contexts[0];

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark p-5 shadow-xs flex flex-col justify-between hover:border-editorial-rust dark:hover:border-editorial-orange transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-ink-charcoal dark:text-ink-ivory">
                          {item.displayTerm || item.lemma}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-ink-graphite dark:text-ink-pewter">
                          <span className="uppercase">{item.partOfSpeech}</span>
                          {item.phonetic && <span>• {item.phonetic}</span>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getStageBadgeClass(
                            item.masteryStage
                          )}`}
                        >
                          {item.masteryStage}
                        </span>
                        {item.isLeech && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold">
                            <AlertTriangle className="w-3 h-3" /> Leech
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-sans text-ink-charcoal dark:text-ink-ivory leading-relaxed mb-3 line-clamp-3">
                      {item.definition}
                    </p>

                    {primaryContext && (
                      <div className="p-2.5 rounded-lg bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#E7E2D8] dark:border-[#262930] text-xs font-serif italic text-ink-graphite dark:text-ink-pewter mb-3 line-clamp-2">
                        "{primaryContext.sentenceText}"
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#E7E2D8] dark:border-[#262930] flex items-center justify-between text-xs font-mono">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tagName: string) => (
                        <span
                          key={tagName}
                          className="px-1.5 py-0.2 rounded bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter text-[10px]"
                        >
                          #{tagName}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectItem(item)}
                      className="inline-flex items-center gap-1 text-editorial-rust dark:text-editorial-orange font-semibold hover:underline"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{contexts.length} contexts</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MULTI-CONTEXT INSPECTION MODAL */}
      {inspectItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setInspectItem(null)}
        >
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-paper-light dark:bg-ink-dark rounded-2xl border border-[#D9D3C7] dark:border-[#2E323B] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E7E2D8] dark:border-[#262930] pb-3 mb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold">{inspectItem.displayTerm || inspectItem.lemma}</h2>
                <span className="font-mono text-xs text-ink-graphite dark:text-ink-pewter">
                  {inspectItem.partOfSpeech} {inspectItem.phonetic && `• ${inspectItem.phonetic}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-paper-cream/60 dark:bg-ink-elevated/60 border border-[#E7E2D8] dark:border-[#262930]">
                <div className="text-xs font-mono uppercase tracking-wider text-editorial-rust font-semibold mb-1">
                  Definition
                </div>
                <p className="text-sm leading-relaxed">{inspectItem.definition}</p>
              </div>

              {inspectItem.personalNote && (
                <div className="text-xs font-mono text-ink-graphite dark:text-ink-pewter">
                  <strong>Personal Note:</strong> {inspectItem.personalNote}
                </div>
              )}

              <div className="space-y-2">
                <div className="font-mono text-xs uppercase tracking-wider text-ink-graphite dark:text-ink-pewter font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sentence Context Occurrences ({inspectItem.contexts?.length || 0})</span>
                </div>

                <div className="space-y-2.5">
                  {(inspectItem.contexts || []).map((ctx: any, i: number) => (
                    <div
                      key={ctx.id || i}
                      className="p-3.5 rounded-xl border border-[#E7E2D8] dark:border-[#262930] bg-white dark:bg-ink-surface text-xs font-serif leading-relaxed"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-graphite mb-1.5">
                        <span className="font-semibold text-editorial-rust">
                          {ctx.isPrimary ? 'Primary Context' : `Context #${i + 1}`}
                        </span>
                        <span>Surface: "{ctx.surfaceForm}"</span>
                      </div>
                      <p className="text-ink-charcoal dark:text-ink-ivory italic">
                        "{ctx.sentenceText}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E2D8] dark:border-[#262930] flex items-center justify-between text-xs font-mono text-ink-graphite">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Interval: {inspectItem.interval} days
                </span>
                <span>Repetition: {inspectItem.repetition}</span>
                <span>EF: {Number(inspectItem.easinessFactor).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import {
  Search,
  BookMarked,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Clock,
  Layers,
  Check,
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

    api.vocab
      .listVault(params)
      .then((res: any) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (Array.isArray(list)) {
          setItems(list);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectItem) {
        setInspectItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectItem]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVault();
  };

  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedTag !== 'all') {
        const itemTags: string[] = item.tags?.map((t: any) => t.tag?.name || t.name) || [];
        if (!itemTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }
      if (selectedStage !== 'all' && item.masteryStage !== selectedStage) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchLemma = String(item.lemma || '').toLowerCase().includes(q);
        const matchDef = String(item.definition || '').toLowerCase().includes(q);
        if (!matchLemma && !matchDef) return false;
      }
      return true;
    });
  }, [items, selectedTag, selectedStage, searchQuery]);

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'MATURE':
        return 'bg-emerald-100 text-emerald-950 border-emerald-700/30';
      case 'YOUNG':
        return 'bg-violet-soft text-violet-brand border-violet-brand/20';
      case 'LEARNING':
        return 'bg-marker-learning text-[#141413] border-marker-learningBorder';
      case 'NEW':
      default:
        return 'bg-paper-cream text-[#141413] border-[#141413]/20';
    }
  };

  const getStageProgressPct = (stage: string, interval: number) => {
    if (stage === 'MATURE' || interval > 21) return 100;
    if (stage === 'YOUNG' || interval >= 7) return 68;
    if (stage === 'LEARNING' || interval >= 1) return 35;
    return 12;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-canvas-cream dark:bg-ink-dark py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* HEADER & PILL SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter block mb-1">
              CONTEXTUAL KNOWLEDGE BASE
            </span>
            <h1 className="font-sans text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141413] dark:text-ink-ivory">
              Idiom &amp; Vocabulary Vault
            </h1>
            <p className="text-xs font-mono font-semibold text-ink-muted dark:text-ink-pewter mt-1">
              {displayedItems.length} mined terms anchored with real-world sentences
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <label htmlFor="vault-search" className="sr-only">
              Search lemma or meaning
            </label>
            <Search
              className="w-4 h-4 text-[#141413] dark:text-ink-pewter absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="vault-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lemma or meaning..."
              className="brutal-input w-full rounded-full pl-11 pr-4 py-2.5 text-sm font-medium"
            />
          </form>
        </div>

        {/* FILTER PILLS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by tag">
            {['all', 'Idiom', 'Phrasal Verb', 'Academic', 'Slang'].map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  aria-pressed={isSelected}
                  className={`brutal-pill-btn px-4 py-1.5 text-xs font-extrabold whitespace-nowrap ${
                    isSelected
                      ? 'bg-violet-brand text-white'
                      : 'bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                  }`}
                >
                  {tag === 'all' ? 'All' : tag}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by mastery stage">
            {['all', 'NEW', 'LEARNING', 'YOUNG', 'MATURE'].map((stage) => {
              const isSelected = selectedStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setSelectedStage(stage)}
                  aria-pressed={isSelected}
                  className={`brutal-pill-btn px-3.5 py-1.5 text-xs font-mono font-bold whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#141413] dark:bg-violet-brand text-white'
                      : 'bg-white dark:bg-ink-elevated text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                  }`}
                >
                  {stage === 'all' ? 'All Stages' : stage}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-ink-muted dark:text-ink-pewter">
            <Loader2 className="w-8 h-8 animate-spin text-violet-brand mb-3" />
            <p className="font-mono font-semibold text-sm">Searching your personal lexical vault...</p>
          </div>
        ) : error ? (
          <div className="brutal-card-sm p-6 text-center text-rose-700 font-mono font-bold text-sm">
            {error}
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="brutal-card p-14 text-center space-y-3">
            <BookMarked className="w-12 h-12 text-violet-brand mx-auto" />
            <h2 className="font-sans text-xl font-extrabold">No Items Match Your Filter</h2>
            <p className="text-xs font-mono text-ink-muted dark:text-ink-pewter">
              Try selecting another tag or import new articles to mine sentences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedItems.map((item, idx) => {
              const indexStr = String(idx + 1).padStart(2, '0');
              const tags = item.tags?.map((t: any) => t.tag?.name || t.name) || [];
              const contexts = item.contexts || [];
              const primaryContext = contexts.find((c: any) => c.isPrimary) || contexts[0];
              const progressPct = getStageProgressPct(item.masteryStage, item.interval || 0);

              return (
                <article
                  key={item.id}
                  className={`brutal-card p-5 flex flex-col justify-between ${
                    item.isLeech ? 'border-t-4 border-t-rose-600' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-sm font-extrabold text-ink-muted/60 dark:text-ink-pewter/60 pt-1">
                          {indexStr}
                        </span>
                        <div>
                          <h2 className="font-sans text-xl font-extrabold text-[#141413] dark:text-ink-ivory leading-tight">
                            {item.displayTerm || item.lemma}
                          </h2>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[11px] font-semibold text-ink-muted dark:text-ink-pewter">
                            <span className="uppercase">{item.partOfSpeech}</span>
                            {item.phonetic && <span>• {item.phonetic}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-extrabold border ${getStageBadgeClass(
                            item.masteryStage
                          )}`}
                        >
                          {item.masteryStage}
                        </span>
                        {item.isLeech && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-marker-leech text-[#4C0519] border border-marker-leechBorder font-extrabold">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            Leech
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm font-sans font-medium text-[#141413] dark:text-ink-ivory leading-relaxed mb-3 line-clamp-3">
                      {item.definition}
                    </p>

                    {primaryContext && (
                      <div className="p-3 rounded-xl bg-canvas-cream dark:bg-ink-surface border border-[#141413]/20 dark:border-[#3A3E4C] text-xs font-serif italic text-[#141413] dark:text-ink-ivory mb-4 line-clamp-2">
                        "{primaryContext.sentenceText}"
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t-2 border-[#141413]/10 dark:border-[#3A3E4C]">
                    {/* Mastery Progress Bar */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 rounded-full bg-violet-soft dark:bg-ink-surface border border-[#141413]/20 overflow-hidden">
                        <div
                          className="h-full bg-violet-brand dark:bg-violet-bright transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-ink-muted dark:text-ink-pewter">
                        {item.interval}d
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tagName: string) => (
                          <span
                            key={tagName}
                            className="px-2.5 py-0.5 rounded-full bg-violet-soft dark:bg-violet-darkSoft text-violet-brand dark:text-violet-bright text-[10px] font-extrabold"
                          >
                            {tagName}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setInspectItem(item)}
                        className="brutal-pill-btn inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory hover:bg-violet-brand hover:text-white font-extrabold text-[11px]"
                      >
                        <Layers className="w-3 h-3" aria-hidden="true" />
                        <span>{contexts.length} contexts</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* MULTI-CONTEXT INSPECTION MODAL (Screen 3 Syllabus Motif) */}
      {inspectItem &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-inspect-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#141413]/55 backdrop-blur-xs"
            onClick={() => setInspectItem(null)}
          >
          <div
            className="w-full max-w-xl max-h-[85vh] overflow-y-auto overscroll-contain bg-white dark:bg-ink-elevated rounded-3xl border-2 border-[#141413] dark:border-[#3A3E4C] p-6 shadow-brutal-lg dark:shadow-brutal-dark"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b-2 border-[#141413]/15 dark:border-[#3A3E4C] pb-4 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-soft text-violet-brand text-[10px] font-extrabold uppercase tracking-wider inline-block mb-1.5">
                  {inspectItem.partOfSpeech}
                </span>
                <h2 id="vault-inspect-title" className="font-sans text-2xl font-extrabold text-[#141413] dark:text-ink-ivory">
                  {inspectItem.displayTerm || inspectItem.lemma}
                </h2>
                {inspectItem.phonetic && (
                  <span className="font-mono text-xs text-ink-muted dark:text-ink-pewter">
                    {inspectItem.phonetic}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                aria-label="Close modal"
                className="brutal-pill-btn p-2 bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-violet-tint dark:bg-ink-surface border-2 border-[#141413] dark:border-[#3A3E4C]">
                <div className="text-[11px] font-mono uppercase tracking-wider text-violet-brand dark:text-violet-bright font-extrabold mb-1">
                  Definition
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#141413] dark:text-ink-ivory">
                  {inspectItem.definition}
                </p>
              </div>

              {inspectItem.personalNote && (
                <div className="text-xs font-mono text-[#141413] dark:text-ink-ivory bg-canvas-cream dark:bg-ink-surface p-3 rounded-xl border border-[#141413]/20">
                  <strong>Personal Note:</strong> {inspectItem.personalNote}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-extrabold uppercase tracking-widest text-ink-muted dark:text-ink-pewter flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>CONTEXT SYLLABUS ({inspectItem.contexts?.length || 0})</span>
                </div>

                <div className="space-y-3">
                  {(inspectItem.contexts || []).map((ctx: any, i: number) => {
                    const numStr = String(i + 1).padStart(2, '0');
                    return (
                      <div
                        key={ctx.id || i}
                        className={`brutal-card-sm p-4 flex items-start gap-3.5 ${
                          ctx.isPrimary ? 'border-t-4 border-t-violet-brand' : ''
                        }`}
                      >
                        <span
                          className={`font-mono text-base font-extrabold shrink-0 ${
                            ctx.isPrimary ? 'text-violet-brand' : 'text-ink-muted/60'
                          }`}
                        >
                          {numStr}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted dark:text-ink-pewter mb-1">
                            <span className="font-extrabold text-violet-brand dark:text-violet-bright">
                              {ctx.isPrimary ? 'Primary Context' : `Context #${i + 1}`}
                            </span>
                            <span>Surface: "{ctx.surfaceForm}"</span>
                          </div>
                          <p className="font-serif italic text-sm text-[#141413] dark:text-ink-ivory leading-relaxed">
                            "{ctx.sentenceText}"
                          </p>
                        </div>
                        {ctx.isPrimary && (
                          <span className="w-6 h-6 rounded-full bg-violet-brand text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#141413]/15 dark:border-[#3A3E4C] flex items-center justify-between text-xs font-mono font-bold text-ink-muted dark:text-ink-pewter">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Interval: {inspectItem.interval} days
                </span>
                <span>Repetition: {inspectItem.repetition}</span>
                <span>EF: {Number(inspectItem.easinessFactor).toFixed(2)}</span>
              </div>
            </div>
          </div>
          </div>,
          document.body
        )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { TextSelectionData } from '../../hooks/useTextSelection';
import { Loader2, X, PlusCircle, Check, Tag } from 'lucide-react';

export interface SelectionPopoverProps {
  articleId?: string;
  selectionData: TextSelectionData;
  onClose: () => void;
  onSaved: (vocabItem: any) => void;
}

const COMMON_TAGS = ['Idiom', 'Phrasal Verb', 'Academic', 'Slang', 'Collocation'];

export const SelectionPopover: React.FC<SelectionPopoverProps> = ({
  articleId,
  selectionData,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [surfaceForm, setSurfaceForm] = useState(selectionData.selectedText);
  const [lemma, setLemma] = useState(selectionData.selectedText.toLowerCase());
  const [partOfSpeech, setPartOfSpeech] = useState<string>('noun');
  const [phonetic, setPhonetic] = useState<string>('');
  const [definition, setDefinition] = useState<string>('');
  const [personalNote, setPersonalNote] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.vocab.previewSelection({
      articleId,
      sentenceId: selectionData.sentenceId,
      paragraphText: selectionData.sentenceText,
      selectedText: selectionData.selectedText,
      selectionStartInSentence: selectionData.startOffset,
      selectionEndInSentence: selectionData.endOffset,
    })
      .then((res: any) => {
        if (!isMounted) return;
        const d = res?.data || res;
        if (d && (d.lemma || d.surfaceForm || d.definition)) {
          setSurfaceForm(d.surfaceForm || selectionData.selectedText);
          setLemma(d.lemma || selectionData.selectedText.toLowerCase());
          setPartOfSpeech(d.partOfSpeech || 'expression');
          setPhonetic(d.phonetic || '');
          setDefinition(d.definition || '');
          if (Array.isArray(d.tagNames) && d.tagNames.length > 0) {
            setSelectedTags(d.tagNames);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setDefinition(`Expression mined from context: "${selectionData.selectedText}"`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectionData, articleId]);

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!definition.trim()) {
      setError('Please provide a definition.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await api.vocab.mine({
        articleId,
        sentenceId: selectionData.sentenceId,
        surfaceForm,
        lemma: lemma.trim().toLowerCase(),
        displayTerm: lemma.trim(),
        partOfSpeech,
        phonetic: phonetic.trim() || null,
        definition: definition.trim(),
        personalNote: personalNote.trim() || null,
        sentenceText: selectionData.sentenceText,
        startOffset: selectionData.startOffset,
        endOffset: selectionData.endOffset,
        tagNames: selectedTags,
      });

      const savedPayload = res?.data || res;
      if (savedPayload && (savedPayload.vocabItemId || savedPayload.id || savedPayload.lemma)) {
        setSavedSuccess(true);
        setTimeout(() => {
          onSaved(savedPayload);
          onClose();
        }, 600);
      } else {
        setError(res?.error || 'Failed to save mined vocabulary.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving to Vault.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Escape to close, Enter to save if not focused on textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Position popover safely relative to selection
  const topPos = Math.max(16, selectionData.rect.bottom + window.scrollY + 10);
  const leftPos = Math.max(
    16,
    Math.min(
      selectionData.rect.left + window.scrollX,
      window.innerWidth - 380
    )
  );

  return (
    <div
      style={{ top: `${topPos}px`, left: `${leftPos}px` }}
      className="absolute z-50 w-88 sm:w-96 rounded-xl border border-[#D9D3C7] dark:border-[#2E323B] bg-paper-light dark:bg-ink-dark shadow-2xl p-4 text-ink-charcoal dark:text-ink-ivory animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-[#E7E2D8] dark:border-[#262930] pb-2.5 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-editorial-rust dark:text-editorial-orange">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>One-Click Sentence Mining</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory p-0.5 rounded transition-colors"
          aria-label="Close popover"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-xs text-ink-graphite dark:text-ink-pewter">
          <Loader2 className="w-6 h-6 animate-spin text-editorial-rust mb-2" />
          <span>Analyzing context & dictionary lookup...</span>
        </div>
      ) : savedSuccess ? (
        <div className="py-6 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center mb-2">
            <Check className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-base">Saved to Vault!</span>
          <span className="text-xs text-ink-graphite dark:text-ink-pewter font-mono mt-1">
            Highlighted for future reading & SM-2 review.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {error && (
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter">
                Lemma (Base Form)
              </label>
              <span className="text-[10px] font-mono text-ink-graphite dark:text-ink-pewter">
                Surface: "{surfaceForm}"
              </span>
            </div>
            <input
              type="text"
              value={lemma}
              onChange={(e) => setLemma(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-editorial-rust"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter block mb-1">
                Part of Speech
              </label>
              <input
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full px-2 py-1 rounded border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter block mb-1">
                Phonetic IPA
              </label>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/.../"
                className="w-full px-2 py-1 rounded border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter block mb-1">
              Definition (Meaning in Context) *
            </label>
            <textarea
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface text-xs focus:outline-hidden focus:ring-2 focus:ring-editorial-rust"
              placeholder="Explain the meaning of this word or idiom..."
              required
            />
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter block mb-1">
              Personal Note / Mnemonic (Optional)
            </label>
            <input
              type="text"
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="e.g. Heard in episode 3, metaphor for risk"
              className="w-full px-2.5 py-1 rounded border border-[#D9D3C7] dark:border-[#2E323B] bg-white dark:bg-ink-surface text-xs"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-ink-graphite dark:text-ink-pewter mb-1.5">
              <Tag className="w-3 h-3" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      isSelected
                        ? 'bg-editorial-rust text-white font-semibold'
                        : 'bg-paper-cream dark:bg-ink-elevated text-ink-graphite dark:text-ink-pewter hover:bg-paper-cream/80'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#E7E2D8] dark:border-[#262930]">
            <span className="text-[10px] text-ink-graphite dark:text-ink-pewter font-mono">
              Press Enter to save
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs text-ink-graphite hover:text-ink-charcoal dark:text-ink-pewter dark:hover:text-ink-ivory transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded font-semibold text-xs bg-editorial-rust text-white hover:bg-editorial-rust/90 disabled:opacity-50 transition-colors shadow-xs"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Save to Vault</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

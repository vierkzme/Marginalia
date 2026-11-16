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

    api.vocab
      .previewSelection({
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
          setDefinition(d.definition || d.dictionary?.definition || '');
          const suggested = d.tagNames || d.dictionary?.suggestedTags;
          if (Array.isArray(suggested) && suggested.length > 0) {
            setSelectedTags(suggested);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const topPos = Math.max(16, selectionData.rect.bottom + window.scrollY + 12);
  const leftPos = Math.max(
    16,
    Math.min(selectionData.rect.left + window.scrollX, window.innerWidth - 390)
  );

  return (
    <div
      style={{ top: `${topPos}px`, left: `${leftPos}px` }}
      role="dialog"
      aria-label="One-Click Sentence Mining"
      className="absolute z-50 w-[340px] sm:w-96 rounded-3xl border-2 border-[#141413] dark:border-[#3A3E4C] bg-white dark:bg-ink-elevated shadow-brutal-lg dark:shadow-brutal-dark p-5 text-[#141413] dark:text-ink-ivory"
    >
      <div className="flex items-center justify-between border-b-2 border-[#141413]/15 dark:border-[#3A3E4C] pb-3 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-violet-brand dark:text-violet-bright">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>Sentence Mining</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="brutal-pill-btn p-1 bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory"
          aria-label="Close popover"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-xs text-ink-muted dark:text-ink-pewter">
          <Loader2 className="w-6 h-6 animate-spin text-violet-brand mb-2" />
          <span className="font-semibold">Analyzing context &amp; dictionary lookup...</span>
        </div>
      ) : savedSuccess ? (
        <div className="py-6 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400">
          <div className="w-11 h-11 rounded-full border-2 border-[#141413] bg-violet-brand text-white flex items-center justify-center mb-2 shadow-brutal-xs">
            <Check className="w-6 h-6 stroke-[3]" aria-hidden="true" />
          </div>
          <span className="font-sans font-extrabold text-base text-[#141413] dark:text-ink-ivory">
            Saved to Vault!
          </span>
          <span className="text-xs text-ink-muted dark:text-ink-pewter font-mono mt-1">
            Highlighted for future reading &amp; SM-2 review.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-400 font-bold text-xs">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="mining-lemma"
                className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter"
              >
                Lemma (Base Form)
              </label>
              <span className="text-[10px] font-mono text-ink-muted dark:text-ink-pewter">
                Surface: "{surfaceForm}"
              </span>
            </div>
            <input
              id="mining-lemma"
              type="text"
              value={lemma}
              onChange={(e) => setLemma(e.target.value)}
              className="brutal-input w-full px-3 py-1.5 rounded-xl font-bold text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="mining-pos"
                className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter block mb-1"
              >
                Part of Speech
              </label>
              <input
                id="mining-pos"
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="brutal-input w-full px-2.5 py-1.5 rounded-xl font-mono text-xs"
              />
            </div>
            <div>
              <label
                htmlFor="mining-phonetic"
                className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter block mb-1"
              >
                Phonetic IPA
              </label>
              <input
                id="mining-phonetic"
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/.../"
                className="brutal-input w-full px-2.5 py-1.5 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="mining-definition"
              className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter block mb-1"
            >
              Definition (Meaning in Context) *
            </label>
            <textarea
              id="mining-definition"
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="brutal-input w-full px-3 py-1.5 rounded-xl text-xs"
              placeholder="Explain the meaning of this word or idiom..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="mining-note"
              className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter block mb-1"
            >
              Personal Note / Mnemonic (Optional)
            </label>
            <input
              id="mining-note"
              type="text"
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="e.g. Heard in episode 3, metaphor for risk"
              className="brutal-input w-full px-3 py-1.5 rounded-xl text-xs"
            />
          </div>

          <div>
            <div className="flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-pewter mb-1.5">
              <Tag className="w-3 h-3" aria-hidden="true" />
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
                    aria-pressed={isSelected}
                    className={`px-2.5 py-0.5 rounded-full border border-[#141413] text-[11px] font-bold transition-colors ${
                      isSelected
                        ? 'bg-violet-brand text-white'
                        : 'bg-canvas-cream dark:bg-ink-surface text-[#141413] dark:text-ink-ivory hover:bg-violet-tint'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t-2 border-[#141413]/15 dark:border-[#3A3E4C]">
            <span className="text-[10px] text-ink-muted dark:text-ink-pewter font-mono font-semibold">
              Esc to close
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="brutal-pill-btn px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-ink-surface text-[#141413] dark:text-ink-ivory"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="brutal-pill-btn inline-flex items-center gap-1.5 px-4 py-1.5 font-extrabold text-xs bg-violet-brand hover:bg-violet-hover text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />}
                <span>Save to Vault</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

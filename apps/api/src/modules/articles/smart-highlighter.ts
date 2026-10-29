export interface TokenSpan {
  text: string;
  lemma: string;
  pos?: string;
  startChar: number;
  endChar: number;
}

export interface VaultLookupEntry {
  vocabItemId: string;
  lemma: string;
  masteryStage: 'NEW' | 'LEARNING' | 'YOUNG' | 'MATURE' | 'KNOWN';
  isLeech: boolean;
  definition: string;
  tags?: string[];
}

export interface HighlightAnnotation {
  vocabItemId: string;
  lemma: string;
  surfaceForm: string;
  startOffset: number;
  endOffset: number;
  highlightColor: 'YELLOW' | 'PINK';
  masteryStage: string;
  isLeech: boolean;
  definition: string;
  tags: string[];
}

export function annotateSentenceHighlights(
  sentenceText: string,
  tokens: TokenSpan[],
  vaultMap: Map<string, VaultLookupEntry>,
  maxPhraseWords = 6
): HighlightAnnotation[] {
  const annotations: HighlightAnnotation[] = [];
  const consumedTokenIndices = new Set<number>();

  for (let i = 0; i < tokens.length; i++) {
    if (consumedTokenIndices.has(i)) continue;

    const maxWindow = Math.min(maxPhraseWords, tokens.length - i);
    for (let windowSize = maxWindow; windowSize >= 1; windowSize--) {
      const slice = tokens.slice(i, i + windowSize);

      const allLemmaCandidate = slice.map((t) => t.lemma.toLowerCase()).join(' ');
      const headLemmaCandidate = [
        slice[0].lemma.toLowerCase(),
        ...slice.slice(1).map((t) => t.text.toLowerCase()),
      ].join(' ');

      const matchedEntry =
        vaultMap.get(allLemmaCandidate) ?? vaultMap.get(headLemmaCandidate);

      if (matchedEntry) {
        if (matchedEntry.masteryStage === 'MATURE' || matchedEntry.masteryStage === 'KNOWN') {
          for (let k = i; k < i + windowSize; k++) consumedTokenIndices.add(k);
          break;
        }

        const startOffset = slice[0].startChar;
        const endOffset = slice[slice.length - 1].endChar;

        annotations.push({
          vocabItemId: matchedEntry.vocabItemId,
          lemma: matchedEntry.lemma,
          surfaceForm: sentenceText.slice(startOffset, endOffset),
          startOffset,
          endOffset,
          highlightColor: matchedEntry.isLeech ? 'PINK' : 'YELLOW',
          masteryStage: matchedEntry.masteryStage,
          isLeech: matchedEntry.isLeech,
          definition: matchedEntry.definition,
          tags: matchedEntry.tags || [],
        });

        for (let k = i; k < i + windowSize; k++) {
          consumedTokenIndices.add(k);
        }
        break;
      }
    }
  }

  return annotations;
}

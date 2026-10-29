export interface ClozeRenderResult {
  clozeSentence: string;
  firstLetterHint: string;
  maskedTarget: string;
}

export function generateClozeDeletion(
  sentenceText: string,
  surfaceForm: string,
  startOffset?: number,
  endOffset?: number
): ClozeRenderResult {
  const placeholder = '[ ............... ]';
  let maskedSentence = sentenceText;
  let actualTarget = surfaceForm;

  if (
    typeof startOffset === 'number' &&
    typeof endOffset === 'number' &&
    startOffset >= 0 &&
    endOffset <= sentenceText.length &&
    startOffset < endOffset
  ) {
    actualTarget = sentenceText.slice(startOffset, endOffset);
    maskedSentence =
      sentenceText.slice(0, startOffset) +
      placeholder +
      sentenceText.slice(endOffset);
  } else {
    const escaped = surfaceForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    maskedSentence = sentenceText.replace(regex, placeholder);
  }

  const firstLetterHint = actualTarget
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0] + '_'.repeat(word.length - 1);
    })
    .join(' ');

  return {
    clozeSentence: maskedSentence,
    firstLetterHint,
    maskedTarget: actualTarget,
  };
}

import React from 'react';

export interface SentenceHighlight {
  vocabItemId: string;
  lemma: string;
  surfaceForm: string;
  startOffset: number;
  endOffset: number;
  highlightColor: 'YELLOW' | 'PINK';
  masteryStage?: string;
  isLeech?: boolean;
  definition?: string;
  tags?: string[];
}

interface SmartHighlightedSentenceProps {
  sentenceId: string;
  sentenceText: string;
  highlights: SentenceHighlight[];
  onInspectHighlight?: (highlight: SentenceHighlight, e: React.MouseEvent) => void;
}

export const SmartHighlightedSentence: React.FC<SmartHighlightedSentenceProps> = ({
  sentenceId,
  sentenceText,
  highlights = [],
  onInspectHighlight,
}) => {
  if (!highlights || highlights.length === 0) {
    return (
      <span data-sentence-id={sentenceId} className="inline">
        {sentenceText}{' '}
      </span>
    );
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sortedHighlights.forEach((hl, i) => {
    if (hl.startOffset > cursor && hl.startOffset <= sentenceText.length) {
      segments.push(sentenceText.slice(cursor, hl.startOffset));
    }

    if (hl.startOffset >= cursor && hl.endOffset <= sentenceText.length) {
      const isLeech = hl.highlightColor === 'PINK';
      const className = isLeech ? 'marker-highlight-pink' : 'marker-highlight-yellow';

      segments.push(
        <mark
          key={`${hl.vocabItemId}-${i}`}
          onClick={(e) => onInspectHighlight && onInspectHighlight(hl, e)}
          title={`${hl.lemma} (${isLeech ? 'Leech Word' : 'Learning Stage'}): ${hl.definition || 'Click to view'}`}
          className={`${className} cursor-pointer`}
        >
          {sentenceText.slice(hl.startOffset, hl.endOffset)}
        </mark>
      );
      cursor = hl.endOffset;
    }
  });

  if (cursor < sentenceText.length) {
    segments.push(sentenceText.slice(cursor));
  }

  return (
    <span data-sentence-id={sentenceId} className="inline">
      {segments}{' '}
    </span>
  );
};

import { useState, useEffect, useCallback, RefObject } from 'react';

export interface TextSelectionData {
  selectedText: string;
  sentenceId: string;
  sentenceText: string;
  startOffset: number;
  endOffset: number;
  rect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
  };
}

export function useTextSelection(containerRef: RefObject<HTMLElement | null>) {
  const [selectionData, setSelectionData] = useState<TextSelectionData | null>(null);

  const clearSelection = useCallback(() => {
    setSelectionData(null);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
    }
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 2) {
        return;
      }

      const range = selection.getRangeAt(0);
      let anchorNode: Node | null = selection.anchorNode;
      if (!anchorNode) return;

      // Find sentence span container with data-sentence-id
      let element: HTMLElement | null =
        anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as HTMLElement)
          : anchorNode.parentElement;

      const sentenceEl = element?.closest('[data-sentence-id]') as HTMLElement | null;
      if (!sentenceEl) {
        return;
      }

      const sentenceId = sentenceEl.getAttribute('data-sentence-id') || '';
      const sentenceText = sentenceEl.textContent || '';

      // Calculate start and end offset within this sentence
      const lowerSentence = sentenceText.toLowerCase();
      const lowerSelected = selectedText.toLowerCase();
      let startOffset = lowerSentence.indexOf(lowerSelected);
      let endOffset = startOffset !== -1 ? startOffset + selectedText.length : selectedText.length;
      if (startOffset === -1) {
        startOffset = 0;
        endOffset = selectedText.length;
      }

      const rect = range.getBoundingClientRect();

      setSelectionData({
        selectedText,
        sentenceId,
        sentenceText,
        startOffset,
        endOffset,
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          width: rect.width,
        },
      });
    };

    const container = containerRef.current || document;
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  return { selectionData, clearSelection };
}

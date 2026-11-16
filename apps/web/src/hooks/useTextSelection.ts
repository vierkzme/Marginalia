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
    let selectionTimer: number | null = null;

    const processSelection = () => {
      const container = containerRef.current;
      const selection = window.getSelection();
      if (!container || !selection || selection.isCollapsed || !selection.rangeCount) {
        return;
      }

      const rawFull = selection.toString();
      const selectedText = rawFull.trim();
      if (!selectedText || selectedText.length < 2) {
        return;
      }

      // Guard against accidental full-paragraph selection
      if (selectedText.split(/\s+/).length > 12) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        return;
      }

      const anchorNode = range.startContainer;
      const element: HTMLElement | null =
        anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as HTMLElement)
          : anchorNode.parentElement;

      const sentenceEl = element?.closest('[data-sentence-id]') as HTMLElement | null;
      if (!sentenceEl || !container.contains(sentenceEl)) {
        return;
      }

      const sentenceId = sentenceEl.getAttribute('data-sentence-id') || '';
      const sentenceText = (sentenceEl.textContent || '').trimEnd();

      // Calculate exact character offsets relative to this sentence element
      let startOffset = -1;
      try {
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(sentenceEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const leadingTrim = rawFull.length - rawFull.trimStart().length;
        startOffset = preSelectionRange.toString().length + leadingTrim;
      } catch {
        startOffset = -1;
      }

      if (startOffset < 0 || startOffset >= sentenceText.length) {
        startOffset = sentenceText.toLowerCase().indexOf(selectedText.toLowerCase());
      }

      let endOffset =
        startOffset !== -1
          ? Math.min(sentenceText.length, startOffset + selectedText.length)
          : selectedText.length;

      if (startOffset === -1) {
        startOffset = 0;
        endOffset = Math.min(sentenceText.length, selectedText.length);
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return;
      }

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

    const scheduleSelectionCheck = (delayMs: number) => {
      if (selectionTimer !== null) {
        window.clearTimeout(selectionTimer);
      }
      selectionTimer = window.setTimeout(() => {
        processSelection();
      }, delayMs);
    };

    const handleMouseUp = () => {
      scheduleSelectionCheck(15);
    };

    const handleTouchEnd = () => {
      scheduleSelectionCheck(180);
    };

    const handleSelectionChange = () => {
      const isCoarsePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;
      if (isCoarsePointer) {
        scheduleSelectionCheck(260);
      }
    };

    const container = containerRef.current || document;
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      if (selectionTimer !== null) {
        window.clearTimeout(selectionTimer);
      }
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [containerRef]);

  return { selectionData, clearSelection };
}

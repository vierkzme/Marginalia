import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClozeCard, DueReviewItem } from '../ClozeCard';

const mockCard: DueReviewItem = {
  vocabItemId: 'vocab-test-1',
  lemma: 'bite the bullet',
  displayTerm: 'bite the bullet',
  partOfSpeech: 'idiom',
  phonetic: '/baɪt ðə ˈbʊlɪt/',
  definition: 'Decide to do something difficult or unpleasant that has been delayed.',
  personalNote: 'Common engineering idiom.',
  tags: ['Idiom', 'Collocation'],
  sm2State: {
    repetition: 2,
    easinessFactor: 2.5,
    interval: 6,
    lapseCount: 0,
    isLeech: false,
    masteryStage: 'LEARNING',
  },
  intervalPreview: {
    AGAIN: '1d',
    HARD: '3d',
    GOOD: '6d',
    EASY: '14d',
  },
  contexts: [
    {
      contextId: 'ctx-1',
      articleTitle: 'Architecture Modernization',
      surfaceForm: 'bit the bullet',
      fullSentence: 'The engineering team bit the bullet and refactored the legacy monolith.',
      clozeSentence: 'The engineering team [ bit the bullet ] and refactored the legacy monolith.',
      firstLetterHint: 'b__ t__ b_____',
      isPrimary: true,
    },
    {
      contextId: 'ctx-2',
      articleTitle: 'Startup Chronicles',
      surfaceForm: 'bite the bullet',
      fullSentence: 'Founders must bite the bullet and pivot their core product.',
      clozeSentence: 'Founders must [ bite the bullet ] and pivot their core product.',
      firstLetterHint: 'b___ t__ b_____',
      isPrimary: false,
    },
  ],
};

describe('ClozeCard Component', () => {
  it('renders cloze prompt sentence with masked blank placeholder', () => {
    const handleFlip = vi.fn();
    const handleGrade = vi.fn();

    render(
      <ClozeCard
        card={mockCard}
        isFlipped={false}
        onFlip={handleFlip}
        onGrade={handleGrade}
      />
    );

    expect(screen.getByText(/The engineering team/i)).toBeInTheDocument();
    expect(screen.getByText(/\[ • • • • • • • \]/i)).toBeInTheDocument();
    expect(screen.getByText(/and refactored the legacy monolith/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show Answer/i })).toBeInTheDocument();
  });

  it('switches sentence context when clicking Lihat Kalimat Lain', () => {
    const handleFlip = vi.fn();
    const handleGrade = vi.fn();

    render(
      <ClozeCard
        card={mockCard}
        isFlipped={false}
        onFlip={handleFlip}
        onGrade={handleGrade}
      />
    );

    const switchBtn = screen.getByRole('button', { name: /Lihat Kalimat Lain/i });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);

    expect(screen.getByText(/Founders must/i)).toBeInTheDocument();
    expect(screen.getByText(/and pivot their core product/i)).toBeInTheDocument();
  });

  it('reveals first-letter hint when toggle button is clicked', () => {
    const handleFlip = vi.fn();
    const handleGrade = vi.fn();

    render(
      <ClozeCard
        card={mockCard}
        isFlipped={false}
        onFlip={handleFlip}
        onGrade={handleGrade}
      />
    );

    const hintBtn = screen.getByRole('button', { name: /Hint Huruf Awal/i });
    fireEvent.click(hintBtn);

    expect(screen.getByText('b__ t__ b_____')).toBeInTheDocument();
  });

  it('triggers onFlip when Show Answer is clicked', () => {
    const handleFlip = vi.fn();
    const handleGrade = vi.fn();

    render(
      <ClozeCard
        card={mockCard}
        isFlipped={false}
        onFlip={handleFlip}
        onGrade={handleGrade}
      />
    );

    const showAnswerBtn = screen.getByRole('button', { name: /Show Answer/i });
    fireEvent.click(showAnswerBtn);

    expect(handleFlip).toHaveBeenCalledTimes(1);
  });

  it('renders target word, definition, and fires onGrade when rating button is clicked in flipped state', () => {
    const handleFlip = vi.fn();
    const handleGrade = vi.fn();

    render(
      <ClozeCard
        card={mockCard}
        isFlipped={true}
        onFlip={handleFlip}
        onGrade={handleGrade}
      />
    );

    // Definition and word should be visible
    expect(screen.getByText('bite the bullet')).toBeInTheDocument();
    expect(screen.getByText(/Decide to do something difficult/i)).toBeInTheDocument();
    expect(screen.getByText(/From: Architecture Modernization/i)).toBeInTheDocument();

    // SM-2 rating buttons should be visible
    const goodBtn = screen.getByRole('button', { name: /Good/i });
    expect(goodBtn).toBeInTheDocument();

    fireEvent.click(goodBtn);

    expect(handleGrade).toHaveBeenCalledWith('GOOD');
  });
});

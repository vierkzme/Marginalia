export type ReviewButton = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export type MasteryStage = 'NEW' | 'LEARNING' | 'YOUNG' | 'MATURE' | 'KNOWN';

export interface SM2CardState {
  repetition: number;
  easinessFactor: number;
  interval: number;
  lapseCount: number;
  isLeech: boolean;
}

export interface SM2CalculationResult extends SM2CardState {
  qualityGrade: number;
  masteryStage: MasteryStage;
  nextReviewDate: Date;
}

export const BUTTON_TO_QUALITY: Record<ReviewButton, number> = {
  AGAIN: 1,
  HARD: 3,
  GOOD: 4,
  EASY: 5,
};

export const MIN_EASINESS_FACTOR = 1.3;
export const LEECH_LAPSE_THRESHOLD = 4;

export function calculateSM2(
  current: SM2CardState,
  buttonOrQuality: ReviewButton | number,
  now: Date = new Date()
): SM2CalculationResult {
  const q =
    typeof buttonOrQuality === 'number'
      ? buttonOrQuality
      : BUTTON_TO_QUALITY[buttonOrQuality];

  if (q < 0 || q > 5) {
    throw new Error(`Invalid SM-2 quality grade: ${q}. Expected 0..5.`);
  }

  const efDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const rawNewEf = current.easinessFactor + efDelta;
  const nextEf = Math.max(
    MIN_EASINESS_FACTOR,
    Math.round(rawNewEf * 100) / 100
  );

  let nextRepetition: number;
  let nextInterval: number;
  let nextLapseCount = current.lapseCount;
  let nextIsLeech = current.isLeech;

  if (q < 3) {
    nextRepetition = 0;
    nextInterval = 1;
    nextLapseCount += 1;

    if (nextLapseCount >= LEECH_LAPSE_THRESHOLD) {
      nextIsLeech = true;
    }
  } else {
    nextRepetition = current.repetition + 1;

    if (nextRepetition === 1) {
      nextInterval = 1;
    } else if (nextRepetition === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.max(1, Math.round(current.interval * nextEf));
    }

    if (nextIsLeech && nextRepetition >= 3) {
      nextIsLeech = false;
    }
  }

  let masteryStage: MasteryStage;
  if (nextInterval < 7) {
    masteryStage = 'LEARNING';
  } else if (nextInterval <= 21) {
    masteryStage = 'YOUNG';
  } else {
    masteryStage = 'MATURE';
  }

  const nextReviewDate = new Date(now.getTime());
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + nextInterval);

  return {
    qualityGrade: q,
    repetition: nextRepetition,
    easinessFactor: nextEf,
    interval: nextInterval,
    lapseCount: nextLapseCount,
    isLeech: nextIsLeech,
    masteryStage,
    nextReviewDate,
  };
}

export function previewNextIntervals(state: SM2CardState): Record<ReviewButton, string> {
  const againRes = calculateSM2(state, 'AGAIN');
  const hardRes = calculateSM2(state, 'HARD');
  const goodRes = calculateSM2(state, 'GOOD');
  const easyRes = calculateSM2(state, 'EASY');

  return {
    AGAIN: `${againRes.interval}d`,
    HARD: `${hardRes.interval}d`,
    GOOD: `${goodRes.interval}d`,
    EASY: `${easyRes.interval}d`,
  };
}

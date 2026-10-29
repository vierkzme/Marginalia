import { calculateSM2, SM2CardState } from '../modules/reviews/sm2.engine';
import { generateClozeDeletion } from '../modules/reviews/cloze.generator';

describe('SuperMemo-2 (SM-2) Scheduling Engine', () => {
  const baseDate = new Date('2026-10-29T00:00:00.000Z');

  const initialCard: SM2CardState = {
    repetition: 0,
    easinessFactor: 2.5,
    interval: 0,
    lapseCount: 0,
    isLeech: false,
  };

  test('1. Pengulangan ke-1 (n = 1) dengan jawaban GOOD (q = 4) menghasilkan I = 1 hari dan EF tetap 2.5', () => {
    const res = calculateSM2(initialCard, 'GOOD', baseDate);
    expect(res.repetition).toBe(1);
    expect(res.interval).toBe(1);
    expect(res.easinessFactor).toBe(2.5);
    expect(res.masteryStage).toBe('LEARNING');
  });

  test('2. Pengulangan ke-2 (n = 2) dengan jawaban GOOD (q = 4) menghasilkan I = 6 hari', () => {
    const step1 = calculateSM2(initialCard, 'GOOD', baseDate);
    const step2 = calculateSM2(step1, 'GOOD', baseDate);
    expect(step2.repetition).toBe(2);
    expect(step2.interval).toBe(6);
    expect(step2.easinessFactor).toBe(2.5);
    expect(step2.masteryStage).toBe('LEARNING');
  });

  test('3. Pengulangan ke-3 (n = 3) menghitung I = round(6 * 2.5) = 15 hari dan masuk kategori YOUNG', () => {
    const step1 = calculateSM2(initialCard, 'GOOD', baseDate);
    const step2 = calculateSM2(step1, 'GOOD', baseDate);
    const step3 = calculateSM2(step2, 'GOOD', baseDate);
    expect(step3.repetition).toBe(3);
    expect(step3.interval).toBe(15);
    expect(step3.masteryStage).toBe('YOUNG');
  });

  test('4. Pengulangan ke-4 (n = 4) menghitung I = round(15 * 2.5) = 38 hari dan masuk kategori MATURE', () => {
    let state = initialCard;
    state = calculateSM2(state, 'GOOD', baseDate);
    state = calculateSM2(state, 'GOOD', baseDate);
    state = calculateSM2(state, 'GOOD', baseDate);
    const step4 = calculateSM2(state, 'GOOD', baseDate);

    expect(step4.repetition).toBe(4);
    expect(step4.interval).toBe(38);
    expect(step4.masteryStage).toBe('MATURE');
  });

  test('5. Jawaban AGAIN (q = 1 / Lupa) me-reset repetition n = 0 dan interval I = 1 hari', () => {
    const matureCard: SM2CardState = {
      repetition: 4,
      easinessFactor: 2.5,
      interval: 38,
      lapseCount: 0,
      isLeech: false,
    };

    const afterLapse = calculateSM2(matureCard, 'AGAIN', baseDate);
    expect(afterLapse.repetition).toBe(0);
    expect(afterLapse.interval).toBe(1);
    expect(afterLapse.lapseCount).toBe(1);
    expect(afterLapse.easinessFactor).toBe(1.96);
    expect(afterLapse.masteryStage).toBe('LEARNING');
  });

  test('6. Nilai Easiness Factor (EF) tidak pernah turun di bawah batas bawah 1.30', () => {
    let state: SM2CardState = { ...initialCard, easinessFactor: 1.35 };
    state = calculateSM2(state, 'AGAIN', baseDate);
    expect(state.easinessFactor).toBe(1.3);
  });

  test('7. Kartu otomatis ditandai sebagai LEECH (Merah Muda) saat lapseCount mencapai 4', () => {
    let state = initialCard;
    for (let i = 0; i < 4; i++) {
      state = calculateSM2(state, 'AGAIN', baseDate);
    }
    expect(state.lapseCount).toBe(4);
    expect(state.isLeech).toBe(true);
  });
});

describe('Cloze Deletion Generator', () => {
  test('Mengganti frasa idiom tepat pada startOffset dan endOffset menjadi [ ............... ]', () => {
    const sentence =
      'Despite the tight deadline, the backend team decided to bite the bullet and migrate the database.';
    const res = generateClozeDeletion(sentence, 'bite the bullet', 56, 71);

    expect(res.clozeSentence).toBe(
      'Despite the tight deadline, the backend team decided to [ ............... ] and migrate the database.'
    );
    expect(res.firstLetterHint).toBe('b___ t__ b_____');
  });
});

import fs from 'fs';
import path from 'path';
import { prisma, isDatabaseConnected } from './db';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  dailyReviewGoal: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  createdAt: string;
}

export interface ArticleEntity {
  id: string;
  userId: string;
  title: string;
  sourceType: 'RAW_TEXT' | 'URL' | 'TXT_FILE' | 'SRT_FILE';
  sourceUrl: string | null;
  rawContent: string;
  totalWordCount: number;
  uniqueLemmaCount: number;
  initialCoveragePct: number;
  uniqueLemmasJson: string[];
  readingProgressPct: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface ArticleSentenceEntity {
  id: string;
  articleId: string;
  paragraphIndex: number;
  sentenceIndex: number;
  sentenceText: string;
  tokensJson: Array<{
    text: string;
    lemma: string;
    pos: string;
    isStop: boolean;
    startChar: number;
    endChar: number;
  }>;
}

export interface VocabItemEntity {
  id: string;
  userId: string;
  lemma: string;
  displayTerm: string;
  partOfSpeech: string;
  phonetic: string | null;
  definition: string;
  personalNote: string | null;
  masteryStage: 'NEW' | 'LEARNING' | 'YOUNG' | 'MATURE' | 'KNOWN';
  repetition: number;
  easinessFactor: number;
  interval: number;
  lapseCount: number;
  isLeech: boolean;
  nextReviewDate: string;
  lastReviewedAt: string | null;
  createdAt: string;
}

export interface VocabContextEntity {
  id: string;
  vocabItemId: string;
  articleId: string | null;
  sentenceId: string | null;
  surfaceForm: string;
  sentenceText: string;
  startOffset: number;
  endOffset: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface TagEntity {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  colorHex: string;
  isSystem: boolean;
}

export interface VocabTagEntity {
  vocabItemId: string;
  tagId: string;
}

export interface ReviewLogEntity {
  id: string;
  userId: string;
  vocabItemId: string;
  qualityGrade: number;
  prevRepetition: number;
  newRepetition: number;
  prevEf: number;
  newEf: number;
  prevInterval: number;
  newInterval: number;
  responseTimeMs: number;
  reviewedAt: string;
}

export interface DailyActivityEntity {
  id: string;
  userId: string;
  activityDate: string;
  wordsMinedCount: number;
  reviewsCompletedCount: number;
  articlesReadCount: number;
  totalActivityScore: number;
}

export interface DictionaryCacheEntity {
  lemma: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  source: string;
}

export interface SeedDataStore {
  users: UserEntity[];
  articles: ArticleEntity[];
  sentences: ArticleSentenceEntity[];
  vocabItems: VocabItemEntity[];
  contexts: VocabContextEntity[];
  tags: TagEntity[];
  vocabTags: VocabTagEntity[];
  reviewLogs: ReviewLogEntity[];
  dailyActivities: DailyActivityEntity[];
  dictionaryCache: DictionaryCacheEntity[];
}

const SEED_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'before', 'being',
  'but', 'by', 'do', 'for', 'from', 'had', 'have', 'if', 'in', 'into', 'is',
  'it', 'no', 'not', 'of', 'on', 'or', 'our', 'than', 'that', 'the', 'their',
  'then', 'they', 'this', 'to', 'under', 'up', 'was', 'we', 'were', 'when',
  'whenever', 'which', 'while', 'with', 'yet', 'you',
]);

const SEED_LEMMA_MAP: Record<string, string> = {
  ran: 'run',
  decided: 'decide',
  scaling: 'scale',
  distributed: 'distribute',
  systems: 'system',
  engineers: 'engineer',
  discovering: 'discover',
  bottlenecks: 'bottleneck',
  corners: 'corner',
  teams: 'team',
  forces: 'force',
  managers: 'manager',
  helps: 'help',
  spikes: 'spike',
  micro: 'micro',
  containers: 'container',
  platforms: 'platform',
  workloads: 'workload',
  boundaries: 'boundary',
  incidents: 'incident',
  abstractions: 'abstraction',
  slows: 'slow',
  increases: 'increase',
  endpoints: 'endpoint',
  comes: 'come',
  clients: 'client',
  warnings: 'warning',
  workflows: 'workflow',
  requires: 'require',
  letting: 'let',
  interfaces: 'interface',
  suggestions: 'suggestion',
  sessions: 'session',
  giving: 'give',
  surfacing: 'surface',
  actions: 'action',
  users: 'user',
};

/** Generates character-accurate token spans so Smart Highlighting matches phrases reliably. */
function buildTokenizedSentence(sentenceText: string): ArticleSentenceEntity['tokensJson'] {
  const tokens: ArticleSentenceEntity['tokensJson'] = [];
  const wordRegex = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(sentenceText)) !== null) {
    const text = match[0];
    const lower = text.toLowerCase();
    const lemma = SEED_LEMMA_MAP[lower] || lower;
    const isStop = SEED_STOP_WORDS.has(lower);
    tokens.push({
      text,
      lemma,
      pos: isStop ? 'ADP' : 'NOUN',
      isStop,
      startChar: match.index,
      endChar: match.index + text.length,
    });
  }

  return tokens;
}

/** Builds a tokenized sentence entity for seeded reading passages. */
function createSeedSentence(
  id: string,
  articleId: string,
  paragraphIndex: number,
  sentenceIndex: number,
  sentenceText: string
): ArticleSentenceEntity {
  return {
    id,
    articleId,
    paragraphIndex,
    sentenceIndex,
    sentenceText,
    tokensJson: buildTokenizedSentence(sentenceText),
  };
}

/** Creates a VocabContext with character offsets resolved directly from the sentence string. */
function createSeedContext(
  id: string,
  vocabItemId: string,
  articleId: string,
  sentenceId: string,
  sentenceText: string,
  surfaceForm: string,
  isPrimary: boolean,
  createdAt: string
): VocabContextEntity {
  const idx = sentenceText.indexOf(surfaceForm);
  const startOffset = idx >= 0 ? idx : 0;
  const endOffset = startOffset + surfaceForm.length;
  return {
    id,
    vocabItemId,
    articleId,
    sentenceId,
    surfaceForm,
    sentenceText,
    startOffset,
    endOffset,
    isPrimary,
    createdAt,
  };
}

/** Formats a Date into a YYYY-MM-DD key using the local calendar date. */
export function formatLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Shifts a Date by deltaDays in local calendar time without UTC drift. */
export function addLocalDays(date: Date, deltaDays: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + deltaDays);
}

/** Converts a YYYY-MM-DD key to a UTC midnight Date for Prisma @db.Date fields. */
export function toUtcDateOnly(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function extractActivityDateKey(activityDate: Date | string): string {
  return activityDate instanceof Date
    ? activityDate.toISOString().slice(0, 10)
    : String(activityDate).slice(0, 10);
}

/** Computes currentStreak, longestStreak, and lastActiveDate directly from daily activity rows. */
export function computeActivityStreaks(
  activities: Array<{
    activityDate: Date | string;
    wordsMinedCount?: number;
    reviewsCompletedCount?: number;
    articlesReadCount?: number;
    totalActivityScore?: number;
  }>,
  now: Date = new Date(),
  existingLongest: number = 0
): { currentStreak: number; longestStreak: number; lastActiveDate: string | null } {
  const activeDates = new Set<string>();
  for (const act of activities) {
    const hasActivity =
      (act.totalActivityScore || 0) > 0 ||
      (act.wordsMinedCount || 0) > 0 ||
      (act.reviewsCompletedCount || 0) > 0 ||
      (act.articlesReadCount || 0) > 0;
    if (hasActivity) {
      activeDates.add(extractActivityDateKey(act.activityDate));
    }
  }

  if (activeDates.size === 0) {
    return { currentStreak: 0, longestStreak: existingLongest, lastActiveDate: null };
  }

  const sortedDates = Array.from(activeDates).sort();
  const lastActiveDate = sortedDates[sortedDates.length - 1];

  let longestRun = 0;
  let running = 0;
  let prevKey: string | null = null;
  for (const key of sortedDates) {
    if (prevKey && formatLocalDateKey(addLocalDays(parseDateKey(prevKey), 1)) === key) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestRun) longestRun = running;
    prevKey = key;
  }

  const todayKey = formatLocalDateKey(now);
  const yesterdayKey = formatLocalDateKey(addLocalDays(now, -1));
  let offset = activeDates.has(todayKey) ? 0 : activeDates.has(yesterdayKey) ? -1 : null;

  let currentStreak = 0;
  if (offset !== null) {
    while (activeDates.has(formatLocalDateKey(addLocalDays(now, offset)))) {
      currentStreak += 1;
      offset -= 1;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestRun, currentStreak, existingLongest),
    lastActiveDate,
  };
}

/** Recomputes and applies streak counters on an in-memory user record. */
export function refreshStoreUserStreak(
  store: SeedDataStore,
  userId: string,
  now: Date = new Date()
): { currentStreak: number; longestStreak: number; lastActiveDate: string | null } {
  const user = store.users.find((u) => u.id === userId);
  const userActs = (store.dailyActivities || []).filter((d) => d.userId === userId);
  const computed = computeActivityStreaks(userActs, now, user?.longestStreak || 0);
  if (user) {
    user.currentStreak = computed.currentStreak;
    user.longestStreak = computed.longestStreak;
    user.lastActiveDate = computed.lastActiveDate;
  }
  return computed;
}

/** Recomputes and persists streak counters in PostgreSQL using DailyActivity history. */
export async function syncPrismaUserStreak(
  db: Pick<typeof prisma, 'dailyActivity' | 'user'>,
  userId: string,
  now: Date = new Date()
): Promise<{ currentStreak: number; longestStreak: number; lastActiveDate: string | null }> {
  const [user, activities] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { longestStreak: true, currentStreak: true, lastActiveDate: true } }),
    db.dailyActivity.findMany({ where: { userId } }),
  ]);
  const computed = computeActivityStreaks(activities, now, user?.longestStreak || 0);
  const prevLastStr = user?.lastActiveDate ? user.lastActiveDate.toISOString().slice(0, 10) : null;
  if (
    user &&
    (user.currentStreak !== computed.currentStreak ||
      user.longestStreak !== computed.longestStreak ||
      prevLastStr !== computed.lastActiveDate)
  ) {
    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: computed.currentStreak,
        longestStreak: computed.longestStreak,
        lastActiveDate: computed.lastActiveDate ? toUtcDateOnly(computed.lastActiveDate) : null,
      },
    });
  }
  return computed;
}

/** Computes realistic 365-day historical learning metrics spanning heatmap intensity levels 0..4. */
function generateYearActivities(now: Date, demoUserId: string): DailyActivityEntity[] {
  const dailyActivities: DailyActivityEntity[] = [];
  for (let i = 364; i >= 1; i--) {
    const d = addLocalDays(now, -i);
    const dateStr = formatLocalDateKey(d);

    const inCurrentStreak = i <= 14;
    const isRestDay = !inCurrentStreak && (i % 7 === 0 || (i > 180 && i % 4 === 0));
    if (isRestDay) {
      dailyActivities.push({
        id: `act-${dateStr}`,
        userId: demoUserId,
        activityDate: dateStr,
        wordsMinedCount: 0,
        reviewsCompletedCount: 0,
        articlesReadCount: 0,
        totalActivityScore: 0,
      });
      continue;
    }

    const deepStudyBoost = i % 11 === 0 ? 18 : i % 5 === 0 ? 8 : 0;
    const baseWords = i <= 90 ? (i % 4 === 0 ? 4 : (i % 3) + 1) : (i % 2) + 1;
    const baseReviews = (i <= 120 ? 10 : 4) + (i % 13) + deepStudyBoost;
    const articlesRead = i <= 60 && (i % 3 === 0 || i <= 5) ? 1 : i % 6 === 0 ? 1 : 0;

    dailyActivities.push({
      id: `act-${dateStr}`,
      userId: demoUserId,
      activityDate: dateStr,
      wordsMinedCount: baseWords,
      reviewsCompletedCount: baseReviews,
      articlesReadCount: articlesRead,
      totalActivityScore: baseWords + baseReviews,
    });
  }
  return dailyActivities;
}

export function generateSeedData(): SeedDataStore {
  const demoUserId = '00000000-0000-0000-0000-000000000001';
  const article1Id = '11111111-1111-1111-1111-111111111111';
  const article2Id = '22222222-2222-2222-2222-222222222222';
  const article3Id = '33333333-3333-3333-3333-333333333333';
  const article4Id = '44444444-4444-4444-4444-444444444444';
  const article5Id = '55555555-5555-5555-5555-555555555555';
  const article6Id = '66666666-6666-6666-6666-666666666666';

  const tags: TagEntity[] = [
    { id: 'tag-1', userId: null, name: 'Idiom', slug: 'idiom', colorHex: '#9333EA', isSystem: true },
    { id: 'tag-2', userId: null, name: 'Phrasal Verb', slug: 'phrasal-verb', colorHex: '#0284C7', isSystem: true },
    { id: 'tag-3', userId: null, name: 'Academic', slug: 'academic', colorHex: '#059669', isSystem: true },
    { id: 'tag-4', userId: null, name: 'Slang', slug: 'slang', colorHex: '#EA580C', isSystem: true },
  ];

  const now = new Date();
  const dailyActivities = generateYearActivities(now, demoUserId);
  const demoStreaks = computeActivityStreaks(dailyActivities, now, 29);

  const article1Raw =
    'Despite the tight deadline, the backend team decided to bite the bullet and migrate the legacy database. Earlier last month, they ran into a severe memory leak in production. To fix it permanently, they had to brush up on their memory profiling skills and sweep nothing under the rug.';

  const article2Raw =
    'When scaling high-throughput distributed systems, engineers often hit a wall before discovering architectural bottlenecks. After months of instability, the CTO finally decided to bite the bullet and rewrite the caching subsystem. The platform eventually managed to break new ground.';

  const sentences: ArticleSentenceEntity[] = [
    {
      id: 'sent-1',
      articleId: article1Id,
      paragraphIndex: 0,
      sentenceIndex: 0,
      sentenceText:
        'Despite the tight deadline, the backend team decided to bite the bullet and migrate the legacy database.',
      tokensJson: [
        { text: 'Despite', lemma: 'despite', pos: 'SCONJ', isStop: false, startChar: 0, endChar: 7 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 8, endChar: 11 },
        { text: 'tight', lemma: 'tight', pos: 'ADJ', isStop: false, startChar: 12, endChar: 17 },
        { text: 'deadline', lemma: 'deadline', pos: 'NOUN', isStop: false, startChar: 18, endChar: 26 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 28, endChar: 31 },
        { text: 'backend', lemma: 'backend', pos: 'NOUN', isStop: false, startChar: 32, endChar: 39 },
        { text: 'team', lemma: 'team', pos: 'NOUN', isStop: false, startChar: 40, endChar: 44 },
        { text: 'decided', lemma: 'decide', pos: 'VERB', isStop: false, startChar: 45, endChar: 52 },
        { text: 'to', lemma: 'to', pos: 'PART', isStop: true, startChar: 53, endChar: 55 },
        { text: 'bite', lemma: 'bite', pos: 'VERB', isStop: false, startChar: 56, endChar: 60 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 61, endChar: 64 },
        { text: 'bullet', lemma: 'bullet', pos: 'NOUN', isStop: false, startChar: 65, endChar: 71 },
        { text: 'and', lemma: 'and', pos: 'CCONJ', isStop: true, startChar: 72, endChar: 75 },
        { text: 'migrate', lemma: 'migrate', pos: 'VERB', isStop: false, startChar: 76, endChar: 83 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 84, endChar: 87 },
        { text: 'legacy', lemma: 'legacy', pos: 'NOUN', isStop: false, startChar: 88, endChar: 94 },
        { text: 'database', lemma: 'database', pos: 'NOUN', isStop: false, startChar: 95, endChar: 103 },
      ],
    },
    {
      id: 'sent-2',
      articleId: article1Id,
      paragraphIndex: 0,
      sentenceIndex: 1,
      sentenceText:
        'Earlier last month, they ran into a severe memory leak in production.',
      tokensJson: [
        { text: 'Earlier', lemma: 'early', pos: 'ADV', isStop: false, startChar: 0, endChar: 7 },
        { text: 'last', lemma: 'last', pos: 'ADJ', isStop: false, startChar: 8, endChar: 12 },
        { text: 'month', lemma: 'month', pos: 'NOUN', isStop: false, startChar: 13, endChar: 18 },
        { text: 'they', lemma: 'they', pos: 'PRON', isStop: true, startChar: 20, endChar: 24 },
        { text: 'ran', lemma: 'run', pos: 'VERB', isStop: false, startChar: 25, endChar: 28 },
        { text: 'into', lemma: 'into', pos: 'ADP', isStop: true, startChar: 29, endChar: 33 },
        { text: 'a', lemma: 'a', pos: 'DET', isStop: true, startChar: 34, endChar: 35 },
        { text: 'severe', lemma: 'severe', pos: 'ADJ', isStop: false, startChar: 36, endChar: 42 },
        { text: 'memory', lemma: 'memory', pos: 'NOUN', isStop: false, startChar: 43, endChar: 49 },
        { text: 'leak', lemma: 'leak', pos: 'NOUN', isStop: false, startChar: 50, endChar: 54 },
        { text: 'in', lemma: 'in', pos: 'ADP', isStop: true, startChar: 55, endChar: 57 },
        { text: 'production', lemma: 'production', pos: 'NOUN', isStop: false, startChar: 58, endChar: 68 },
      ],
    },
    {
      id: 'sent-3',
      articleId: article1Id,
      paragraphIndex: 0,
      sentenceIndex: 2,
      sentenceText:
        'To fix it permanently, they had to brush up on their memory profiling skills and sweep nothing under the rug.',
      tokensJson: [
        { text: 'To', lemma: 'to', pos: 'PART', isStop: true, startChar: 0, endChar: 2 },
        { text: 'fix', lemma: 'fix', pos: 'VERB', isStop: false, startChar: 3, endChar: 6 },
        { text: 'it', lemma: 'it', pos: 'PRON', isStop: true, startChar: 7, endChar: 9 },
        { text: 'permanently', lemma: 'permanently', pos: 'ADV', isStop: false, startChar: 10, endChar: 21 },
        { text: 'brush', lemma: 'brush', pos: 'VERB', isStop: false, startChar: 35, endChar: 40 },
        { text: 'up', lemma: 'up', pos: 'ADP', isStop: true, startChar: 41, endChar: 43 },
        { text: 'on', lemma: 'on', pos: 'ADP', isStop: true, startChar: 44, endChar: 46 },
        { text: 'memory', lemma: 'memory', pos: 'NOUN', isStop: false, startChar: 53, endChar: 59 },
        { text: 'sweep', lemma: 'sweep', pos: 'VERB', isStop: false, startChar: 81, endChar: 86 },
        { text: 'nothing', lemma: 'nothing', pos: 'PRON', isStop: true, startChar: 87, endChar: 94 },
        { text: 'under', lemma: 'under', pos: 'ADP', isStop: true, startChar: 95, endChar: 100 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 101, endChar: 104 },
        { text: 'rug', lemma: 'rug', pos: 'NOUN', isStop: false, startChar: 105, endChar: 108 },
      ],
    },
    {
      id: 'sent-4',
      articleId: article2Id,
      paragraphIndex: 0,
      sentenceIndex: 0,
      sentenceText:
        'When scaling high-throughput distributed systems, engineers often hit a wall before discovering architectural bottlenecks.',
      tokensJson: [
        { text: 'scaling', lemma: 'scale', pos: 'VERB', isStop: false, startChar: 5, endChar: 12 },
        { text: 'distributed', lemma: 'distribute', pos: 'VERB', isStop: false, startChar: 29, endChar: 40 },
        { text: 'systems', lemma: 'system', pos: 'NOUN', isStop: false, startChar: 41, endChar: 48 },
        { text: 'hit', lemma: 'hit', pos: 'VERB', isStop: false, startChar: 65, endChar: 68 },
        { text: 'a', lemma: 'a', pos: 'DET', isStop: true, startChar: 69, endChar: 70 },
        { text: 'wall', lemma: 'wall', pos: 'NOUN', isStop: false, startChar: 71, endChar: 75 },
        { text: 'bottlenecks', lemma: 'bottleneck', pos: 'NOUN', isStop: false, startChar: 108, endChar: 119 },
      ],
    },
    {
      id: 'sent-5',
      articleId: article2Id,
      paragraphIndex: 0,
      sentenceIndex: 1,
      sentenceText:
        'After months of instability, the CTO finally decided to bite the bullet and rewrite the caching subsystem.',
      tokensJson: [
        { text: 'instability', lemma: 'instability', pos: 'NOUN', isStop: false, startChar: 16, endChar: 27 },
        { text: 'decided', lemma: 'decide', pos: 'VERB', isStop: false, startChar: 45, endChar: 52 },
        { text: 'bite', lemma: 'bite', pos: 'VERB', isStop: false, startChar: 56, endChar: 60 },
        { text: 'the', lemma: 'the', pos: 'DET', isStop: true, startChar: 61, endChar: 64 },
        { text: 'bullet', lemma: 'bullet', pos: 'NOUN', isStop: false, startChar: 65, endChar: 71 },
        { text: 'rewrite', lemma: 'rewrite', pos: 'VERB', isStop: false, startChar: 76, endChar: 83 },
        { text: 'caching', lemma: 'caching', pos: 'NOUN', isStop: false, startChar: 88, endChar: 95 },
      ],
    },
    {
      id: 'sent-6',
      articleId: article2Id,
      paragraphIndex: 0,
      sentenceIndex: 2,
      sentenceText:
        'The platform eventually managed to break new ground.',
      tokensJson: [
        { text: 'platform', lemma: 'platform', pos: 'NOUN', isStop: false, startChar: 4, endChar: 12 },
        { text: 'eventually', lemma: 'eventually', pos: 'ADV', isStop: false, startChar: 13, endChar: 23 },
        { text: 'break', lemma: 'break', pos: 'VERB', isStop: false, startChar: 35, endChar: 40 },
        { text: 'new', lemma: 'new', pos: 'ADJ', isStop: false, startChar: 41, endChar: 44 },
        { text: 'ground', lemma: 'ground', pos: 'NOUN', isStop: false, startChar: 45, endChar: 51 },
      ],
    },
    createSeedSentence(
      'sent-7',
      article3Id,
      0,
      0,
      'Welcome back everyone. Today we are talking about why no architectural pattern is a silver bullet for every engineering bottleneck.'
    ),
    createSeedSentence(
      'sent-8',
      article3Id,
      0,
      1,
      'Early-stage teams often cut corners to ship fast, which eventually forces engineers to bite the bullet during scaling.'
    ),
    createSeedSentence(
      'sent-9',
      article3Id,
      1,
      2,
      'Even a rough ballpark estimate helps product managers zero in on low-hanging fruit first.'
    ),
    createSeedSentence(
      'sent-10',
      article3Id,
      1,
      3,
      'Before production launch, our infrastructure squad stayed late to iron out subtle latency spikes.'
    ),
    createSeedSentence(
      'sent-11',
      article4Id,
      0,
      0,
      'Microservice containers have become ubiquitous across modern cloud platforms because workloads remain ephemeral under autoscaling.'
    ),
    createSeedSentence(
      'sent-12',
      article4Id,
      0,
      1,
      'However, excessive indirection means developers run into confusing ownership boundaries whenever incidents occur.'
    ),
    createSeedSentence(
      'sent-13',
      article4Id,
      1,
      2,
      'High-performing teams zero in on simple abstractions and harvest low-hanging fruit before introducing heavy orchestration.'
    ),
    createSeedSentence(
      'sent-14',
      article4Id,
      1,
      3,
      'Ignoring this caveat steadily slows onboarding and increases team burnout.'
    ),
    createSeedSentence(
      'sent-15',
      article5Id,
      0,
      0,
      'Versioning public REST endpoints comes with one critical caveat regarding backward compatibility for older mobile clients.'
    ),
    createSeedSentence(
      'sent-16',
      article5Id,
      0,
      1,
      'Strict schema validation is no silver bullet, yet it helps catch serialization bottlenecks early.'
    ),
    createSeedSentence(
      'sent-17',
      article5Id,
      1,
      2,
      'Clear deprecation headers ensure teams never sweep breaking changes under the rug prior to a major release.'
    ),
    createSeedSentence(
      'sent-18',
      article6Id,
      0,
      0,
      'Building contextual workflows requires a deep dive into user intent rather than letting interfaces ship fast without guardrails.'
    ),
    createSeedSentence(
      'sent-19',
      article6Id,
      0,
      1,
      'If product teams cut corners on inline typography, even smart suggestions hit a wall during real reading sessions.'
    ),
    createSeedSentence(
      'sent-20',
      article6Id,
      1,
      2,
      'Giving a ballpark confidence score and surfacing low-hanging fruit actions helps users trust automated analysis.'
    ),
  ];

  const buildArticleMetrics = (targetArticleId: string) => {
    const artSents = sentences.filter((s) => s.articleId === targetArticleId);
    const rawContent = artSents.map((s) => s.sentenceText).join('\n\n');
    const allTokens = artSents.flatMap((s) => s.tokensJson);
    const uniqueLemmas = Array.from(
      new Set(allTokens.filter((t) => !t.isStop).map((t) => t.lemma.toLowerCase()))
    );
    return {
      rawContent,
      totalWordCount: allTokens.length,
      uniqueLemmaCount: uniqueLemmas.length,
      uniqueLemmasJson: uniqueLemmas,
    };
  };

  const art3Metrics = buildArticleMetrics(article3Id);
  const art4Metrics = buildArticleMetrics(article4Id);
  const art5Metrics = buildArticleMetrics(article5Id);
  const art6Metrics = buildArticleMetrics(article6Id);

  const articles: ArticleEntity[] = [
    {
      id: article1Id,
      userId: demoUserId,
      title: 'Why Distributed Systems Are Hard',
      sourceType: 'URL',
      sourceUrl: 'https://engineering.example.com/distributed-systems',
      rawContent: article1Raw,
      totalWordCount: 38,
      uniqueLemmaCount: 28,
      initialCoveragePct: 93.4,
      uniqueLemmasJson: [
        'despite', 'tight', 'deadline', 'backend', 'team', 'decide', 'bite the bullet',
        'migrate', 'legacy', 'database', 'early', 'last', 'month', 'run into', 'severe',
        'memory', 'leak', 'production', 'fix', 'permanently', 'brush up on', 'sweep under the rug'
      ],
      readingProgressPct: 60.0,
      isCompleted: false,
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: article2Id,
      userId: demoUserId,
      title: 'Scaling Cloud Infrastructure from Zero to Millions',
      sourceType: 'RAW_TEXT',
      sourceUrl: null,
      rawContent: article2Raw,
      totalWordCount: 36,
      uniqueLemmaCount: 26,
      initialCoveragePct: 89.2,
      uniqueLemmasJson: [
        'scale', 'distribute', 'system', 'engineer', 'hit a wall', 'discover',
        'architectural', 'bottleneck', 'month', 'instability', 'decide', 'bite the bullet',
        'rewrite', 'caching', 'subsystem', 'platform', 'manage', 'break new ground'
      ],
      readingProgressPct: 20.0,
      isCompleted: false,
      createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      id: article3Id,
      userId: demoUserId,
      title: 'The Pragmatic Tech Lead Podcast - Episode 42 (Subtitles)',
      sourceType: 'SRT_FILE',
      sourceUrl: null,
      ...art3Metrics,
      initialCoveragePct: 96.2,
      readingProgressPct: 45.0,
      isCompleted: false,
      createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    },
    {
      id: article4Id,
      userId: demoUserId,
      title: 'Cognitive Load and Deep Work in Software Architecture',
      sourceType: 'TXT_FILE',
      sourceUrl: null,
      ...art4Metrics,
      initialCoveragePct: 91.8,
      readingProgressPct: 0.0,
      isCompleted: false,
      createdAt: new Date(now.getTime() - 86400000 * 6).toISOString(),
    },
    {
      id: article5Id,
      userId: demoUserId,
      title: 'Writing Maintainable APIs for Long-Lived Products',
      sourceType: 'URL',
      sourceUrl: 'https://engineering.example.com/maintainable-apis',
      ...art5Metrics,
      initialCoveragePct: 97.4,
      readingProgressPct: 100.0,
      isCompleted: true,
      createdAt: new Date(now.getTime() - 86400000 * 8).toISOString(),
    },
    {
      id: article6Id,
      userId: demoUserId,
      title: 'Designing AI Interfaces Beyond Prompt Boxes',
      sourceType: 'RAW_TEXT',
      sourceUrl: null,
      ...art6Metrics,
      initialCoveragePct: 86.4,
      readingProgressPct: 15.0,
      isCompleted: false,
      createdAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
  ];

  const vocabItems: VocabItemEntity[] = [
    {
      id: 'vocab-1',
      userId: demoUserId,
      lemma: 'bite the bullet',
      displayTerm: 'bite the bullet',
      partOfSpeech: 'IDIOM',
      phonetic: '/baɪt ðə ˈbʊlɪt/',
      definition: 'To face a difficult or unpleasant situation with courage and get it over with.',
      personalNote: 'Often used when forced to refactor legacy database architecture.',
      masteryStage: 'LEARNING',
      repetition: 1,
      easinessFactor: 2.5,
      interval: 1,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
      id: 'vocab-2',
      userId: demoUserId,
      lemma: 'run into',
      displayTerm: 'run into',
      partOfSpeech: 'PHRASAL_VERB',
      phonetic: '/rʌn ˈɪntuː/',
      definition: 'To encounter unexpected problems or difficulties.',
      personalNote: 'Essential phrasal verb for unexpected bugs and technical blockers.',
      masteryStage: 'LEARNING',
      repetition: 0,
      easinessFactor: 1.46,
      interval: 1,
      lapseCount: 5,
      isLeech: true,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
      id: 'vocab-3',
      userId: demoUserId,
      lemma: 'sweep under the rug',
      displayTerm: 'sweep under the rug',
      partOfSpeech: 'IDIOM',
      phonetic: '/swiːp ˈʌndər ðə rʌɡ/',
      definition: 'To hide or ignore an embarrassing or difficult problem instead of dealing with it.',
      personalNote: 'Avoid hiding technical debt in the backlog.',
      masteryStage: 'LEARNING',
      repetition: 0,
      easinessFactor: 1.6,
      interval: 1,
      lapseCount: 4,
      isLeech: true,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 8).toISOString(),
    },
    {
      id: 'vocab-4',
      userId: demoUserId,
      lemma: 'brush up on',
      displayTerm: 'brush up on',
      partOfSpeech: 'PHRASAL_VERB',
      phonetic: '/brʌʃ ʌp ɒn/',
      definition: 'To refresh one\'s memory or knowledge of something previously learned.',
      personalNote: 'Used when revisiting algorithms or developer tooling concepts.',
      masteryStage: 'YOUNG',
      repetition: 3,
      easinessFactor: 2.5,
      interval: 15,
      lapseCount: 1,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 5).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 20).toISOString(),
    },
    {
      id: 'vocab-5',
      userId: demoUserId,
      lemma: 'hit a wall',
      displayTerm: 'hit a wall',
      partOfSpeech: 'IDIOM',
      phonetic: '/hɪt ə wɔːl/',
      definition: 'To reach a point where no more progress can be made due to exhaustion or barriers.',
      personalNote: 'Getting stuck while troubleshooting a system.',
      masteryStage: 'NEW',
      repetition: 0,
      easinessFactor: 2.5,
      interval: 0,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: null,
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'vocab-6',
      userId: demoUserId,
      lemma: 'break new ground',
      displayTerm: 'break new ground',
      partOfSpeech: 'IDIOM',
      phonetic: '/breɪk njuː ɡraʊnd/',
      definition: 'To discover or innovate something new that has never been done before.',
      personalNote: 'Achieving a breakthrough in research or innovation.',
      masteryStage: 'MATURE',
      repetition: 5,
      easinessFactor: 2.6,
      interval: 45,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 22).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 23).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 60).toISOString(),
    },
    {
      id: 'vocab-7',
      userId: demoUserId,
      lemma: 'bottleneck',
      displayTerm: 'bottleneck',
      partOfSpeech: 'NOUN',
      phonetic: '/ˈbɒtl.nek/',
      definition: 'A point of congestion in a system that stops or slows down performance.',
      personalNote: 'Systems architecture term.',
      masteryStage: 'MATURE',
      repetition: 4,
      easinessFactor: 2.5,
      interval: 32,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 14).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 18).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 50).toISOString(),
    },
    {
      id: 'vocab-8',
      userId: demoUserId,
      lemma: 'silver bullet',
      displayTerm: 'silver bullet',
      partOfSpeech: 'IDIOM',
      phonetic: '/ˈsɪlvər ˈbʊlɪt/',
      definition: 'A simple, seemingly magical solution to a complex or difficult technical problem.',
      personalNote: 'Often cited in distributed systems discussions about trade-offs.',
      masteryStage: 'LEARNING',
      repetition: 0,
      easinessFactor: 1.55,
      interval: 1,
      lapseCount: 4,
      isLeech: true,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 14).toISOString(),
    },
    {
      id: 'vocab-9',
      userId: demoUserId,
      lemma: 'cut corners',
      displayTerm: 'cut corners',
      partOfSpeech: 'PHRASAL_VERB',
      phonetic: '/kʌt ˈkɔːrnərz/',
      definition: 'To take shortcuts that sacrifice quality, safety, or thoroughness in order to save time or money.',
      personalNote: 'Skipping tests early creates regressions later.',
      masteryStage: 'LEARNING',
      repetition: 1,
      easinessFactor: 2.36,
      interval: 1,
      lapseCount: 1,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 9).toISOString(),
    },
    {
      id: 'vocab-10',
      userId: demoUserId,
      lemma: 'ballpark',
      displayTerm: 'ballpark',
      partOfSpeech: 'NOUN',
      phonetic: '/ˈbɔːlpɑːrk/',
      definition: 'A rough numerical estimate or approximate range used before exact figures are known.',
      personalNote: 'Common tech slang during sprint planning and sizing.',
      masteryStage: 'NEW',
      repetition: 0,
      easinessFactor: 2.5,
      interval: 0,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: null,
      createdAt: new Date(now.getTime() - 7200000).toISOString(),
    },
    {
      id: 'vocab-11',
      userId: demoUserId,
      lemma: 'low-hanging fruit',
      displayTerm: 'low-hanging fruit',
      partOfSpeech: 'IDIOM',
      phonetic: '/loʊ ˈhæŋɪŋ fruːt/',
      definition: 'Tasks or improvements that are easiest to achieve and deliver quick value with minimal effort.',
      personalNote: 'Great candidates for quick performance or DX wins.',
      masteryStage: 'YOUNG',
      repetition: 3,
      easinessFactor: 2.46,
      interval: 12,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 4).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 8).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 24).toISOString(),
    },
    {
      id: 'vocab-12',
      userId: demoUserId,
      lemma: 'iron out',
      displayTerm: 'iron out',
      partOfSpeech: 'PHRASAL_VERB',
      phonetic: '/ˈaɪərn aʊt/',
      definition: 'To resolve minor problems, bugs, or disagreements before a final release.',
      personalNote: 'Used during pre-release bug triage.',
      masteryStage: 'NEW',
      repetition: 0,
      easinessFactor: 2.5,
      interval: 0,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: null,
      createdAt: new Date(now.getTime() - 5400000).toISOString(),
    },
    {
      id: 'vocab-13',
      userId: demoUserId,
      lemma: 'ubiquitous',
      displayTerm: 'ubiquitous',
      partOfSpeech: 'ADJECTIVE',
      phonetic: '/juːˈbɪkwɪtəs/',
      definition: 'Present, appearing, or found everywhere across modern systems.',
      personalNote: 'Frequently appears in academic papers and architecture RFCs.',
      masteryStage: 'MATURE',
      repetition: 4,
      easinessFactor: 2.6,
      interval: 28,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 11).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 17).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 42).toISOString(),
    },
    {
      id: 'vocab-14',
      userId: demoUserId,
      lemma: 'ephemeral',
      displayTerm: 'ephemeral',
      partOfSpeech: 'ADJECTIVE',
      phonetic: '/ɪˈfɛmərəl/',
      definition: 'Lasting for a very short period of time, such as temporary containers or short-lived cache entries.',
      personalNote: 'Key term for stateless containers and TTL keys.',
      masteryStage: 'YOUNG',
      repetition: 3,
      easinessFactor: 2.5,
      interval: 14,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 7).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 22).toISOString(),
    },
    {
      id: 'vocab-15',
      userId: demoUserId,
      lemma: 'zero in on',
      displayTerm: 'zero in on',
      partOfSpeech: 'PHRASAL_VERB',
      phonetic: '/ˈzɪroʊ ɪn ɒn/',
      definition: 'To focus attention directly on a specific root cause, metric, or problem.',
      personalNote: 'Useful when narrowing down logs or flame graphs.',
      masteryStage: 'LEARNING',
      repetition: 1,
      easinessFactor: 2.4,
      interval: 1,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 6).toISOString(),
    },
    {
      id: 'vocab-16',
      userId: demoUserId,
      lemma: 'caveat',
      displayTerm: 'caveat',
      partOfSpeech: 'NOUN',
      phonetic: '/ˈkæviæt/',
      definition: 'An important warning, limitation, or condition to keep in mind when evaluating a claim.',
      personalNote: 'Common in API documentation and benchmark disclosures.',
      masteryStage: 'LEARNING',
      repetition: 1,
      easinessFactor: 1.72,
      interval: 1,
      lapseCount: 3,
      isLeech: false,
      nextReviewDate: now.toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 15).toISOString(),
    },
    {
      id: 'vocab-17',
      userId: demoUserId,
      lemma: 'ship fast',
      displayTerm: 'ship fast',
      partOfSpeech: 'SLANG',
      phonetic: '/ʃɪp fæst/',
      definition: 'To release working software updates quickly and iterate based on real user feedback.',
      personalNote: 'Startup product velocity idiom.',
      masteryStage: 'YOUNG',
      repetition: 3,
      easinessFactor: 2.55,
      interval: 10,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 3).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 18).toISOString(),
    },
    {
      id: 'vocab-18',
      userId: demoUserId,
      lemma: 'deep dive',
      displayTerm: 'deep dive',
      partOfSpeech: 'NOUN',
      phonetic: '/diːp daɪv/',
      definition: 'An intensive, thorough investigation or technical analysis of a specific subject.',
      personalNote: 'Used before writing technical RFCs or debugging incidents.',
      masteryStage: 'MATURE',
      repetition: 5,
      easinessFactor: 2.65,
      interval: 34,
      lapseCount: 0,
      isLeech: false,
      nextReviewDate: new Date(now.getTime() + 86400000 * 16).toISOString(),
      lastReviewedAt: new Date(now.getTime() - 86400000 * 18).toISOString(),
      createdAt: new Date(now.getTime() - 86400000 * 55).toISOString(),
    },
  ];

  const sentMap = new Map(sentences.map((s) => [s.id, s]));
  const linkCtx = (
    id: string,
    vocabItemId: string,
    articleId: string,
    sentenceId: string,
    surfaceForm: string,
    isPrimary: boolean,
    daysAgo: number
  ) => {
    const s = sentMap.get(sentenceId);
    return createSeedContext(
      id,
      vocabItemId,
      articleId,
      sentenceId,
      s ? s.sentenceText : surfaceForm,
      surfaceForm,
      isPrimary,
      new Date(now.getTime() - 86400000 * daysAgo).toISOString()
    );
  };

  const contexts: VocabContextEntity[] = [
    linkCtx('ctx-1', 'vocab-1', article1Id, 'sent-1', 'bite the bullet', true, 5),
    linkCtx('ctx-2', 'vocab-1', article2Id, 'sent-5', 'bite the bullet', false, 3),
    linkCtx('ctx-9', 'vocab-1', article3Id, 'sent-8', 'bite the bullet', false, 2),
    linkCtx('ctx-3', 'vocab-2', article1Id, 'sent-2', 'ran into', true, 10),
    linkCtx('ctx-10', 'vocab-2', article4Id, 'sent-12', 'run into', false, 6),
    linkCtx('ctx-4', 'vocab-3', article1Id, 'sent-3', 'sweep nothing under the rug', true, 8),
    linkCtx('ctx-5', 'vocab-4', article1Id, 'sent-3', 'brush up on', true, 20),
    linkCtx('ctx-6', 'vocab-5', article2Id, 'sent-4', 'hit a wall', true, 1),
    linkCtx('ctx-11', 'vocab-5', article6Id, 'sent-19', 'hit a wall', false, 0),
    linkCtx('ctx-7', 'vocab-6', article2Id, 'sent-6', 'break new ground', true, 60),
    linkCtx('ctx-8', 'vocab-7', article2Id, 'sent-4', 'bottlenecks', true, 50),
    linkCtx('ctx-12', 'vocab-7', article3Id, 'sent-7', 'bottleneck', false, 4),
    linkCtx('ctx-13', 'vocab-7', article5Id, 'sent-16', 'bottlenecks', false, 8),
    linkCtx('ctx-14', 'vocab-8', article3Id, 'sent-7', 'silver bullet', true, 14),
    linkCtx('ctx-15', 'vocab-8', article5Id, 'sent-16', 'silver bullet', false, 8),
    linkCtx('ctx-16', 'vocab-9', article3Id, 'sent-8', 'cut corners', true, 9),
    linkCtx('ctx-17', 'vocab-9', article6Id, 'sent-19', 'cut corners', false, 10),
    linkCtx('ctx-18', 'vocab-10', article3Id, 'sent-9', 'ballpark', true, 4),
    linkCtx('ctx-19', 'vocab-10', article6Id, 'sent-20', 'ballpark', false, 10),
    linkCtx('ctx-20', 'vocab-11', article3Id, 'sent-9', 'low-hanging fruit', true, 24),
    linkCtx('ctx-21', 'vocab-11', article4Id, 'sent-13', 'low-hanging fruit', false, 6),
    linkCtx('ctx-22', 'vocab-11', article6Id, 'sent-20', 'low-hanging fruit', false, 10),
    linkCtx('ctx-23', 'vocab-12', article3Id, 'sent-10', 'iron out', true, 4),
    linkCtx('ctx-24', 'vocab-13', article4Id, 'sent-11', 'ubiquitous', true, 42),
    linkCtx('ctx-25', 'vocab-14', article4Id, 'sent-11', 'ephemeral', true, 22),
    linkCtx('ctx-26', 'vocab-15', article4Id, 'sent-13', 'zero in on', true, 6),
    linkCtx('ctx-27', 'vocab-15', article3Id, 'sent-9', 'zero in on', false, 4),
    linkCtx('ctx-28', 'vocab-16', article5Id, 'sent-15', 'caveat', true, 15),
    linkCtx('ctx-29', 'vocab-16', article4Id, 'sent-14', 'caveat', false, 6),
    linkCtx('ctx-30', 'vocab-17', article3Id, 'sent-8', 'ship fast', true, 18),
    linkCtx('ctx-31', 'vocab-17', article6Id, 'sent-18', 'ship fast', false, 10),
    linkCtx('ctx-32', 'vocab-18', article6Id, 'sent-18', 'deep dive', true, 55),
  ];

  const vocabTags: VocabTagEntity[] = [
    { vocabItemId: 'vocab-1', tagId: 'tag-1' },
    { vocabItemId: 'vocab-2', tagId: 'tag-2' },
    { vocabItemId: 'vocab-3', tagId: 'tag-1' },
    { vocabItemId: 'vocab-4', tagId: 'tag-2' },
    { vocabItemId: 'vocab-5', tagId: 'tag-1' },
    { vocabItemId: 'vocab-6', tagId: 'tag-1' },
    { vocabItemId: 'vocab-7', tagId: 'tag-3' },
    { vocabItemId: 'vocab-8', tagId: 'tag-1' },
    { vocabItemId: 'vocab-9', tagId: 'tag-2' },
    { vocabItemId: 'vocab-10', tagId: 'tag-4' },
    { vocabItemId: 'vocab-11', tagId: 'tag-1' },
    { vocabItemId: 'vocab-12', tagId: 'tag-2' },
    { vocabItemId: 'vocab-13', tagId: 'tag-3' },
    { vocabItemId: 'vocab-14', tagId: 'tag-3' },
    { vocabItemId: 'vocab-15', tagId: 'tag-2' },
    { vocabItemId: 'vocab-16', tagId: 'tag-3' },
    { vocabItemId: 'vocab-17', tagId: 'tag-4' },
    { vocabItemId: 'vocab-18', tagId: 'tag-4' },
  ];

  const reviewLogs: ReviewLogEntity[] = [
    {
      id: 'rlog-1',
      userId: demoUserId,
      vocabItemId: 'vocab-1',
      qualityGrade: 4,
      prevRepetition: 0,
      newRepetition: 1,
      prevEf: 2.5,
      newEf: 2.5,
      prevInterval: 0,
      newInterval: 1,
      responseTimeMs: 3420,
      reviewedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'rlog-2',
      userId: demoUserId,
      vocabItemId: 'vocab-2',
      qualityGrade: 1,
      prevRepetition: 1,
      newRepetition: 0,
      prevEf: 2.0,
      newEf: 1.46,
      prevInterval: 1,
      newInterval: 1,
      responseTimeMs: 6150,
      reviewedAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'rlog-3',
      userId: demoUserId,
      vocabItemId: 'vocab-8',
      qualityGrade: 1,
      prevRepetition: 1,
      newRepetition: 0,
      prevEf: 2.09,
      newEf: 1.55,
      prevInterval: 1,
      newInterval: 1,
      responseTimeMs: 5300,
      reviewedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      id: 'rlog-4',
      userId: demoUserId,
      vocabItemId: 'vocab-11',
      qualityGrade: 4,
      prevRepetition: 2,
      newRepetition: 3,
      prevEf: 2.46,
      newEf: 2.46,
      prevInterval: 6,
      newInterval: 12,
      responseTimeMs: 2890,
      reviewedAt: new Date(now.getTime() - 86400000 * 8).toISOString(),
    },
    {
      id: 'rlog-5',
      userId: demoUserId,
      vocabItemId: 'vocab-13',
      qualityGrade: 5,
      prevRepetition: 3,
      newRepetition: 4,
      prevEf: 2.5,
      newEf: 2.6,
      prevInterval: 11,
      newInterval: 28,
      responseTimeMs: 1940,
      reviewedAt: new Date(now.getTime() - 86400000 * 17).toISOString(),
    },
    {
      id: 'rlog-6',
      userId: demoUserId,
      vocabItemId: 'vocab-17',
      qualityGrade: 4,
      prevRepetition: 2,
      newRepetition: 3,
      prevEf: 2.55,
      newEf: 2.55,
      prevInterval: 6,
      newInterval: 10,
      responseTimeMs: 2450,
      reviewedAt: new Date(now.getTime() - 86400000 * 7).toISOString(),
    },
  ];

  return {
    users: [
      {
        id: demoUserId,
        email: 'ardy@vierkzme.dev',
        passwordHash: '$2a$10$wK1k6H1UoWn6pQ.55tH85.eP3kQ86X2q3Y4f2LgK5d4n0R2jY2.zW',
        fullName: 'Ardy Developer',
        dailyReviewGoal: 20,
        currentStreak: demoStreaks.currentStreak,
        longestStreak: demoStreaks.longestStreak,
        lastActiveDate: demoStreaks.lastActiveDate,
        createdAt: new Date(now.getTime() - 86400000 * 90).toISOString(),
      },
    ],
    articles,
    sentences,
    vocabItems,
    contexts,
    tags,
    vocabTags,
    reviewLogs,
    dailyActivities,
    dictionaryCache: [
      {
        lemma: 'bite the bullet',
        phonetic: '/baɪt ðə ˈbʊlɪt/',
        partOfSpeech: 'IDIOM',
        definition: 'To face a difficult or unpleasant situation with courage and get it over with.',
        source: 'HYBRID_IDIOM_FALLBACK',
      },
      {
        lemma: 'run into',
        phonetic: '/rʌn ˈɪntuː/',
        partOfSpeech: 'PHRASAL_VERB',
        definition: 'To experience an unexpected difficulty or problem.',
        source: 'HYBRID_IDIOM_FALLBACK',
      },
      {
        lemma: 'silver bullet',
        phonetic: '/ˈsɪlvər ˈbʊlɪt/',
        partOfSpeech: 'IDIOM',
        definition: 'A simple, seemingly magical solution to a complex or difficult technical problem.',
        source: 'HYBRID_IDIOM_FALLBACK',
      },
      {
        lemma: 'cut corners',
        phonetic: '/kʌt ˈkɔːrnərz/',
        partOfSpeech: 'PHRASAL_VERB',
        definition: 'To take shortcuts that sacrifice quality, safety, or thoroughness in order to save time or money.',
        source: 'HYBRID_IDIOM_FALLBACK',
      },
      {
        lemma: 'low-hanging fruit',
        phonetic: '/loʊ ˈhæŋɪŋ fruːt/',
        partOfSpeech: 'IDIOM',
        definition: 'Tasks or improvements that are easiest to achieve and deliver quick value with minimal effort.',
        source: 'HYBRID_IDIOM_FALLBACK',
      },
      {
        lemma: 'ephemeral',
        phonetic: '/ɪˈfɛmərəl/',
        partOfSpeech: 'ADJECTIVE',
        definition: 'Lasting for a very short period of time, such as temporary containers or short-lived cache entries.',
        source: 'FREE_DICT_API',
      },
    ],
  };
}

/** Maps legacy Indonesian demo notes to English equivalents for seamless local migration. */
export const LEGACY_SEED_NOTE_MAP: Record<string, string> = {
  'Sering dipakai saat terpaksa refactor arsitektur database legacy.':
    'Often used when forced to refactor legacy database architecture.',
  'Kata kerja frasa penting untuk situasi bugs dan hambatan teknis.':
    'Essential phrasal verb for unexpected bugs and technical blockers.',
  'Jangan menyembunyikan technical debt di backlog.':
    'Avoid hiding technical debt in the backlog.',
  'Dipakai saat belajar kembali konsep algoritma atau tools.':
    'Used when revisiting algorithms or developer tooling concepts.',
  'Buntu saat troubleshooting sistem.':
    'Getting stuck while troubleshooting a system.',
  'Pencapaian inovasi atau riset baru.':
    'Achieving a breakthrough in research or innovation.',
  'Istilah arsitektur sistem.':
    'Systems architecture term.',
};

/** Replaces legacy Indonesian seeded notes with English equivalents in place. */
function normalizeLegacySeedNotes(store: SeedDataStore): boolean {
  let updated = false;
  for (const item of store.vocabItems || []) {
    if (item.personalNote && LEGACY_SEED_NOTE_MAP[item.personalNote]) {
      item.personalNote = LEGACY_SEED_NOTE_MAP[item.personalNote];
      updated = true;
    }
  }
  return updated;
}

/** Appends seeded records missing from a persisted store using a deterministic key. */
function mergeMissingByKey<T>(
  target: T[],
  source: T[],
  getKey: (item: T) => string
): boolean {
  const existingKeys = new Set(target.map(getKey));
  let added = false;
  for (const item of source) {
    const key = getKey(item);
    if (!existingKeys.has(key)) {
      target.push(item);
      existingKeys.add(key);
      added = true;
    }
  }
  return added;
}

/** Migrates legacy demo metadata and non-destructively merges expanded seed content. */
function syncStoreWithLatestSeed(store: SeedDataStore): boolean {
  let changed = normalizeLegacySeedNotes(store);
  const latestSeed = generateSeedData();
  const demoSeedUser = latestSeed.users[0];

  for (const user of store.users || []) {
    if (user.id === demoSeedUser.id || user.email === 'raka@engineering.dev') {
      if (user.email === 'raka@engineering.dev') {
        user.email = demoSeedUser.email;
        changed = true;
      }
      if (user.fullName && user.fullName.toLowerCase().includes('raka')) {
        user.fullName = demoSeedUser.fullName;
        changed = true;
      }
    }
  }

  store.tags ||= [];
  store.articles ||= [];
  store.sentences ||= [];
  store.vocabItems ||= [];
  store.contexts ||= [];
  store.vocabTags ||= [];
  store.reviewLogs ||= [];
  store.dailyActivities ||= [];
  store.dictionaryCache ||= [];

  changed = mergeMissingByKey(store.tags, latestSeed.tags, (t) => t.id) || changed;
  changed = mergeMissingByKey(store.articles, latestSeed.articles, (a) => a.id) || changed;
  changed = mergeMissingByKey(store.sentences, latestSeed.sentences, (s) => s.id) || changed;
  changed = mergeMissingByKey(store.vocabItems, latestSeed.vocabItems, (v) => v.id) || changed;
  changed = mergeMissingByKey(store.contexts, latestSeed.contexts, (c) => c.id) || changed;
  changed =
    mergeMissingByKey(
      store.vocabTags,
      latestSeed.vocabTags,
      (vt) => `${vt.vocabItemId}:${vt.tagId}`
    ) || changed;
  changed = mergeMissingByKey(store.reviewLogs, latestSeed.reviewLogs, (r) => r.id) || changed;
  changed =
    mergeMissingByKey(
      store.dailyActivities,
      latestSeed.dailyActivities,
      (d) => `${d.userId}:${d.activityDate}`
    ) || changed;
  changed =
    mergeMissingByKey(store.dictionaryCache, latestSeed.dictionaryCache, (c) => c.lemma) || changed;

  const now = new Date();
  for (const user of store.users || []) {
    const prevStreak = user.currentStreak;
    const prevLongest = user.longestStreak;
    const prevLast = user.lastActiveDate;
    const next = refreshStoreUserStreak(store, user.id, now);
    if (
      prevStreak !== next.currentStreak ||
      prevLongest !== next.longestStreak ||
      prevLast !== next.lastActiveDate
    ) {
      changed = true;
    }
  }

  return changed;
}

class MemoryStore {
  private data: SeedDataStore;
  private filePath: string;

  constructor() {
    this.filePath = path.resolve(__dirname, '../../../../.data/local-vault.json');
    this.data = this.loadOrInit();
  }

  private loadOrInit(): SeedDataStore {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as SeedDataStore;
        if (syncStoreWithLatestSeed(parsed)) {
          this.save(parsed);
        }
        return parsed;
      }
    } catch {
      // Fallback to fresh seed
    }
    const fresh = generateSeedData();
    this.save(fresh);
    return fresh;
  }

  public save(dataToSave?: SeedDataStore): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(dataToSave || this.data, null, 2));
    } catch {
      // Ignore write errors
    }
  }

  public getData(): SeedDataStore {
    return this.data;
  }
}

export const memoryStore = new MemoryStore();

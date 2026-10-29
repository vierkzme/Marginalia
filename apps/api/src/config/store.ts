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

export function generateSeedData(): SeedDataStore {
  const demoUserId = '00000000-0000-0000-0000-000000000001';
  const article1Id = '11111111-1111-1111-1111-111111111111';
  const article2Id = '22222222-2222-2222-2222-222222222222';

  const tags: TagEntity[] = [
    { id: 'tag-1', userId: null, name: 'Idiom', slug: 'idiom', colorHex: '#9333EA', isSystem: true },
    { id: 'tag-2', userId: null, name: 'Phrasal Verb', slug: 'phrasal-verb', colorHex: '#0284C7', isSystem: true },
    { id: 'tag-3', userId: null, name: 'Academic', slug: 'academic', colorHex: '#059669', isSystem: true },
    { id: 'tag-4', userId: null, name: 'Slang', slug: 'slang', colorHex: '#EA580C', isSystem: true },
  ];

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const dailyActivities: DailyActivityEntity[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseWords = isWeekend ? (i % 3 === 0 ? 3 : 1) : (i % 5 === 0 ? 5 : 2);
    const baseReviews = isWeekend ? (i % 2 === 0 ? 12 : 5) : 10 + (i % 15);
    dailyActivities.push({
      id: `act-${dateStr}`,
      userId: demoUserId,
      activityDate: dateStr,
      wordsMinedCount: baseWords,
      reviewsCompletedCount: baseReviews,
      articlesReadCount: baseWords > 2 ? 1 : 0,
      totalActivityScore: baseWords + baseReviews,
    });
  }

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
  ];

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
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
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
      personalNote: 'Sering dipakai saat terpaksa refactor arsitektur database legacy.',
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
      personalNote: 'Kata kerja frasa penting untuk situasi bugs dan hambatan teknis.',
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
      personalNote: 'Jangan menyembunyikan technical debt di backlog.',
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
      personalNote: 'Dipakai saat belajar kembali konsep algoritma atau tools.',
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
      personalNote: 'Buntu saat troubleshooting sistem.',
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
      personalNote: 'Pencapaian inovasi atau riset baru.',
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
      personalNote: 'Istilah arsitektur sistem.',
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
  ];

  const contexts: VocabContextEntity[] = [
    {
      id: 'ctx-1',
      vocabItemId: 'vocab-1',
      articleId: article1Id,
      sentenceId: 'sent-1',
      surfaceForm: 'bite the bullet',
      sentenceText:
        'Despite the tight deadline, the backend team decided to bite the bullet and migrate the legacy database.',
      startOffset: 56,
      endOffset: 71,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
      id: 'ctx-2',
      vocabItemId: 'vocab-1',
      articleId: article2Id,
      sentenceId: 'sent-5',
      surfaceForm: 'bite the bullet',
      sentenceText:
        'After months of instability, the CTO finally decided to bite the bullet and rewrite the caching subsystem.',
      startOffset: 56,
      endOffset: 71,
      isPrimary: false,
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      id: 'ctx-3',
      vocabItemId: 'vocab-2',
      articleId: article1Id,
      sentenceId: 'sent-2',
      surfaceForm: 'ran into',
      sentenceText:
        'Earlier last month, they ran into a severe memory leak in production.',
      startOffset: 25,
      endOffset: 33,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
    },
    {
      id: 'ctx-4',
      vocabItemId: 'vocab-3',
      articleId: article1Id,
      sentenceId: 'sent-3',
      surfaceForm: 'sweep nothing under the rug',
      sentenceText:
        'To fix it permanently, they had to brush up on their memory profiling skills and sweep nothing under the rug.',
      startOffset: 81,
      endOffset: 108,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 8).toISOString(),
    },
    {
      id: 'ctx-5',
      vocabItemId: 'vocab-4',
      articleId: article1Id,
      sentenceId: 'sent-3',
      surfaceForm: 'brush up on',
      sentenceText:
        'To fix it permanently, they had to brush up on their memory profiling skills and sweep nothing under the rug.',
      startOffset: 35,
      endOffset: 46,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 20).toISOString(),
    },
    {
      id: 'ctx-6',
      vocabItemId: 'vocab-5',
      articleId: article2Id,
      sentenceId: 'sent-4',
      surfaceForm: 'hit a wall',
      sentenceText:
        'When scaling high-throughput distributed systems, engineers often hit a wall before discovering architectural bottlenecks.',
      startOffset: 65,
      endOffset: 75,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 3600000).toISOString(),
    },
    {
      id: 'ctx-7',
      vocabItemId: 'vocab-6',
      articleId: article2Id,
      sentenceId: 'sent-6',
      surfaceForm: 'break new ground',
      sentenceText:
        'The platform eventually managed to break new ground.',
      startOffset: 35,
      endOffset: 51,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 60).toISOString(),
    },
    {
      id: 'ctx-8',
      vocabItemId: 'vocab-7',
      articleId: article2Id,
      sentenceId: 'sent-4',
      surfaceForm: 'bottlenecks',
      sentenceText:
        'When scaling high-throughput distributed systems, engineers often hit a wall before discovering architectural bottlenecks.',
      startOffset: 108,
      endOffset: 119,
      isPrimary: true,
      createdAt: new Date(now.getTime() - 86400000 * 50).toISOString(),
    },
  ];

  const vocabTags: VocabTagEntity[] = [
    { vocabItemId: 'vocab-1', tagId: 'tag-1' },
    { vocabItemId: 'vocab-2', tagId: 'tag-2' },
    { vocabItemId: 'vocab-3', tagId: 'tag-1' },
    { vocabItemId: 'vocab-4', tagId: 'tag-2' },
    { vocabItemId: 'vocab-5', tagId: 'tag-1' },
    { vocabItemId: 'vocab-6', tagId: 'tag-1' },
    { vocabItemId: 'vocab-7', tagId: 'tag-3' },
  ];

  return {
    users: [
      {
        id: demoUserId,
        email: 'raka@engineering.dev',
        passwordHash: '$2a$10$wK1k6H1UoWn6pQ.55tH85.eP3kQ86X2q3Y4f2LgK5d4n0R2jY2.zW',
        fullName: 'Raka Developer',
        dailyReviewGoal: 20,
        currentStreak: 14,
        longestStreak: 29,
        lastActiveDate: todayStr,
        createdAt: new Date(now.getTime() - 86400000 * 90).toISOString(),
      },
    ],
    articles,
    sentences,
    vocabItems,
    contexts,
    tags,
    vocabTags,
    reviewLogs: [],
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
    ],
  };
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
        return JSON.parse(raw);
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

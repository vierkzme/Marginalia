import { randomUUID } from 'crypto';
import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore, ReviewLogEntity } from '../../config/store';
import { calculateSM2, previewNextIntervals, ReviewButton } from './sm2.engine';
import { generateClozeDeletion } from './cloze.generator';

export async function getDueReviews(userId: string) {
  const dbConnected = await isDatabaseConnected();
  const now = new Date();

  if (dbConnected) {
    const dueItems = await prisma.vocabItem.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      include: {
        contexts: {
          include: { article: { select: { title: true } } },
          orderBy: { isPrimary: 'desc' },
        },
        tags: { include: { tag: true } },
      },
      orderBy: [
        { isLeech: 'desc' },
        { masteryStage: 'asc' },
        { nextReviewDate: 'asc' },
      ],
    });

    const cards = dueItems.map((item) => {
      const sm2State = {
        repetition: item.repetition,
        easinessFactor: item.easinessFactor,
        interval: item.interval,
        lapseCount: item.lapseCount,
        isLeech: item.isLeech,
      };

      const intervalPreview = previewNextIntervals(sm2State);

      const contexts = item.contexts.map((ctx) => {
        const cloze = generateClozeDeletion(
          ctx.sentenceText,
          ctx.surfaceForm,
          ctx.startOffset,
          ctx.endOffset
        );

        return {
          contextId: ctx.id,
          articleTitle: ctx.article?.title || 'Unknown Source Article',
          surfaceForm: ctx.surfaceForm,
          fullSentence: ctx.sentenceText,
          clozeSentence: cloze.clozeSentence,
          firstLetterHint: cloze.firstLetterHint,
          isPrimary: ctx.isPrimary,
        };
      });

      return {
        vocabItemId: item.id,
        lemma: item.lemma,
        displayTerm: item.displayTerm,
        partOfSpeech: item.partOfSpeech,
        phonetic: item.phonetic,
        definition: item.definition,
        personalNote: item.personalNote,
        tags: item.tags.map((t) => t.tag.name),
        sm2State: {
          ...sm2State,
          masteryStage: item.masteryStage,
        },
        intervalPreview,
        contexts: contexts.length > 0 ? contexts : [
          {
            contextId: 'fallback-ctx',
            articleTitle: 'Vocabulary Practice',
            surfaceForm: item.displayTerm,
            fullSentence: `The definition of ${item.displayTerm} is "${item.definition}".`,
            clozeSentence: `The definition of [ ............... ] is "${item.definition}".`,
            firstLetterHint: generateClozeDeletion(`Practice ${item.displayTerm}`, item.displayTerm).firstLetterHint,
            isPrimary: true,
          },
        ],
      };
    });

    return { totalDueCount: cards.length, cards };
  } else {
    const store = memoryStore.getData();
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000001';

    const dueItems = store.vocabItems.filter((v) => {
      const isOwner = v.userId === effectiveUserId || v.userId === '00000000-0000-0000-0000-000000000001';
      return isOwner && new Date(v.nextReviewDate).getTime() <= now.getTime();
    });

    dueItems.sort((a, b) => {
      if (a.isLeech !== b.isLeech) return a.isLeech ? -1 : 1;
      return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
    });

    const cards = dueItems.map((item) => {
      const sm2State = {
        repetition: item.repetition,
        easinessFactor: item.easinessFactor,
        interval: item.interval,
        lapseCount: item.lapseCount,
        isLeech: item.isLeech,
      };

      const intervalPreview = previewNextIntervals(sm2State);

      const ctxList = store.contexts
        .filter((c) => c.vocabItemId === item.id)
        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

      const tagIds = store.vocabTags.filter((vt) => vt.vocabItemId === item.id).map((vt) => vt.tagId);
      const tags = store.tags.filter((t) => tagIds.includes(t.id)).map((t) => t.name);

      const contexts = ctxList.map((ctx) => {
        const article = store.articles.find((a) => a.id === ctx.articleId);
        const cloze = generateClozeDeletion(
          ctx.sentenceText,
          ctx.surfaceForm,
          ctx.startOffset,
          ctx.endOffset
        );

        return {
          contextId: ctx.id,
          articleTitle: article?.title || 'Unknown Source Article',
          surfaceForm: ctx.surfaceForm,
          fullSentence: ctx.sentenceText,
          clozeSentence: cloze.clozeSentence,
          firstLetterHint: cloze.firstLetterHint,
          isPrimary: ctx.isPrimary,
        };
      });

      return {
        vocabItemId: item.id,
        lemma: item.lemma,
        displayTerm: item.displayTerm,
        partOfSpeech: item.partOfSpeech,
        phonetic: item.phonetic,
        definition: item.definition,
        personalNote: item.personalNote,
        tags,
        sm2State: {
          ...sm2State,
          masteryStage: item.masteryStage,
        },
        intervalPreview,
        contexts: contexts.length > 0 ? contexts : [
          {
            contextId: 'fallback-ctx',
            articleTitle: 'Vocabulary Practice',
            surfaceForm: item.displayTerm,
            fullSentence: `The definition of ${item.displayTerm} is "${item.definition}".`,
            clozeSentence: `The definition of [ ............... ] is "${item.definition}".`,
            firstLetterHint: generateClozeDeletion(`Practice ${item.displayTerm}`, item.displayTerm).firstLetterHint,
            isPrimary: true,
          },
        ],
      };
    });

    return { totalDueCount: cards.length, cards };
  }
}

export async function gradeReview(
  userId: string,
  vocabId: string,
  button: ReviewButton,
  responseTimeMs: number = 0
) {
  const dbConnected = await isDatabaseConnected();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (dbConnected) {
    const item = await prisma.vocabItem.findUnique({
      where: { id: vocabId },
    });
    if (!item) {
      throw new Error('Vocab item not found.');
    }

    const previousState = {
      repetition: item.repetition,
      easinessFactor: item.easinessFactor,
      interval: item.interval,
      lapseCount: item.lapseCount,
      isLeech: item.isLeech,
      masteryStage: item.masteryStage,
    };

    const sm2Result = calculateSM2(previousState, button, now);

    return await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.vocabItem.update({
        where: { id: vocabId },
        data: {
          repetition: sm2Result.repetition,
          easinessFactor: sm2Result.easinessFactor,
          interval: sm2Result.interval,
          lapseCount: sm2Result.lapseCount,
          isLeech: sm2Result.isLeech,
          masteryStage: sm2Result.masteryStage,
          nextReviewDate: sm2Result.nextReviewDate,
          lastReviewedAt: now,
        },
      });

      await tx.reviewLog.create({
        data: {
          userId,
          vocabItemId: vocabId,
          qualityGrade: sm2Result.qualityGrade,
          prevRepetition: previousState.repetition,
          newRepetition: sm2Result.repetition,
          prevEf: previousState.easinessFactor,
          newEf: sm2Result.easinessFactor,
          prevInterval: previousState.interval,
          newInterval: sm2Result.interval,
          responseTimeMs,
          reviewedAt: now,
        },
      });

      const daily = await tx.dailyActivity.upsert({
        where: {
          userId_activityDate: {
            userId,
            activityDate: now,
          },
        },
        create: {
          userId,
          activityDate: now,
          reviewsCompletedCount: 1,
          totalActivityScore: 1,
        },
        update: {
          reviewsCompletedCount: { increment: 1 },
          totalActivityScore: { increment: 1 },
        },
      });

      const user = await tx.user.findUnique({ where: { id: userId } });
      const currentStreak = user?.currentStreak || 1;

      return {
        vocabItemId: updatedItem.id,
        previousState,
        updatedState: {
          repetition: updatedItem.repetition,
          easinessFactor: updatedItem.easinessFactor,
          interval: updatedItem.interval,
          masteryStage: updatedItem.masteryStage,
          lapseCount: updatedItem.lapseCount,
          isLeech: updatedItem.isLeech,
          nextReviewDate: updatedItem.nextReviewDate,
        },
        streakUpdated: {
          currentStreak,
          todayReviewsCompleted: daily.reviewsCompletedCount,
        },
      };
    });
  } else {
    const store = memoryStore.getData();
    const item = store.vocabItems.find((v) => v.id === vocabId);
    if (!item) {
      throw new Error('Vocab item not found.');
    }

    const previousState = {
      repetition: item.repetition,
      easinessFactor: item.easinessFactor,
      interval: item.interval,
      lapseCount: item.lapseCount,
      isLeech: item.isLeech,
      masteryStage: item.masteryStage,
    };

    const sm2Result = calculateSM2(previousState, button, now);

    item.repetition = sm2Result.repetition;
    item.easinessFactor = sm2Result.easinessFactor;
    item.interval = sm2Result.interval;
    item.lapseCount = sm2Result.lapseCount;
    item.isLeech = sm2Result.isLeech;
    item.masteryStage = sm2Result.masteryStage;
    item.nextReviewDate = sm2Result.nextReviewDate.toISOString();
    item.lastReviewedAt = now.toISOString();

    const log: ReviewLogEntity = {
      id: randomUUID(),
      userId,
      vocabItemId: vocabId,
      qualityGrade: sm2Result.qualityGrade,
      prevRepetition: previousState.repetition,
      newRepetition: sm2Result.repetition,
      prevEf: previousState.easinessFactor,
      newEf: sm2Result.easinessFactor,
      prevInterval: previousState.interval,
      newInterval: sm2Result.interval,
      responseTimeMs,
      reviewedAt: now.toISOString(),
    };
    store.reviewLogs.push(log);

    let daily = store.dailyActivities.find(
      (d) => d.userId === userId && d.activityDate === todayStr
    );
    if (!daily) {
      daily = {
        id: `act-${todayStr}`,
        userId,
        activityDate: todayStr,
        wordsMinedCount: 0,
        reviewsCompletedCount: 1,
        articlesReadCount: 0,
        totalActivityScore: 1,
      };
      store.dailyActivities.push(daily);
    } else {
      daily.reviewsCompletedCount += 1;
      daily.totalActivityScore += 1;
    }

    const user = store.users.find((u) => u.id === userId) || store.users[0];
    const currentStreak = user?.currentStreak || 1;

    memoryStore.save();

    return {
      vocabItemId: item.id,
      previousState,
      updatedState: {
        repetition: item.repetition,
        easinessFactor: item.easinessFactor,
        interval: item.interval,
        masteryStage: item.masteryStage,
        lapseCount: item.lapseCount,
        isLeech: item.isLeech,
        nextReviewDate: item.nextReviewDate,
      },
      streakUpdated: {
        currentStreak,
        todayReviewsCompleted: daily.reviewsCompletedCount,
      },
    };
  }
}

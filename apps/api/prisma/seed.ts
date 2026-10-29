import { prisma } from '../src/config/db';
import { generateSeedData, memoryStore } from '../src/config/store';

async function main() {
  const seed = generateSeedData();

  try {
    console.log('Attempting to seed PostgreSQL via Prisma...');
    await prisma.$connect();

    for (const tag of seed.tags) {
      await prisma.tag.upsert({
        where: { id: tag.id },
        create: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          colorHex: tag.colorHex,
          isSystem: tag.isSystem,
        },
        update: {},
      });
    }

    const demoUser = seed.users[0];
    await prisma.user.upsert({
      where: { id: demoUser.id },
      create: {
        id: demoUser.id,
        email: demoUser.email,
        passwordHash: demoUser.passwordHash,
        fullName: demoUser.fullName,
        dailyReviewGoal: demoUser.dailyReviewGoal,
        currentStreak: demoUser.currentStreak,
        longestStreak: demoUser.longestStreak,
        lastActiveDate: demoUser.lastActiveDate ? new Date(demoUser.lastActiveDate) : null,
      },
      update: {},
    });

    for (const art of seed.articles) {
      await prisma.article.upsert({
        where: { id: art.id },
        create: {
          id: art.id,
          userId: art.userId,
          title: art.title,
          sourceType: art.sourceType,
          sourceUrl: art.sourceUrl,
          rawContent: art.rawContent,
          totalWordCount: art.totalWordCount,
          uniqueLemmaCount: art.uniqueLemmaCount,
          initialCoveragePct: art.initialCoveragePct,
          uniqueLemmasJson: art.uniqueLemmasJson,
          readingProgressPct: art.readingProgressPct,
          isCompleted: art.isCompleted,
        },
        update: {},
      });
    }

    for (const s of seed.sentences) {
      await prisma.articleSentence.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          articleId: s.articleId,
          paragraphIndex: s.paragraphIndex,
          sentenceIndex: s.sentenceIndex,
          sentenceText: s.sentenceText,
          tokensJson: s.tokensJson,
        },
        update: {},
      });
    }

    for (const v of seed.vocabItems) {
      await prisma.vocabItem.upsert({
        where: { id: v.id },
        create: {
          id: v.id,
          userId: v.userId,
          lemma: v.lemma,
          displayTerm: v.displayTerm,
          partOfSpeech: v.partOfSpeech,
          phonetic: v.phonetic,
          definition: v.definition,
          personalNote: v.personalNote,
          masteryStage: v.masteryStage,
          repetition: v.repetition,
          easinessFactor: v.easinessFactor,
          interval: v.interval,
          lapseCount: v.lapseCount,
          isLeech: v.isLeech,
          nextReviewDate: new Date(v.nextReviewDate),
          lastReviewedAt: v.lastReviewedAt ? new Date(v.lastReviewedAt) : null,
        },
        update: {},
      });
    }

    for (const ctx of seed.contexts) {
      await prisma.vocabContext.upsert({
        where: { id: ctx.id },
        create: {
          id: ctx.id,
          vocabItemId: ctx.vocabItemId,
          articleId: ctx.articleId,
          sentenceId: ctx.sentenceId,
          surfaceForm: ctx.surfaceForm,
          sentenceText: ctx.sentenceText,
          startOffset: ctx.startOffset,
          endOffset: ctx.endOffset,
          isPrimary: ctx.isPrimary,
        },
        update: {},
      });
    }

    for (const vt of seed.vocabTags) {
      await prisma.vocabTag.upsert({
        where: {
          vocabItemId_tagId: {
            vocabItemId: vt.vocabItemId,
            tagId: vt.tagId,
          },
        },
        create: {
          vocabItemId: vt.vocabItemId,
          tagId: vt.tagId,
        },
        update: {},
      });
    }

    for (const act of seed.dailyActivities) {
      await prisma.dailyActivity.upsert({
        where: { id: act.id },
        create: {
          id: act.id,
          userId: act.userId,
          activityDate: new Date(act.activityDate),
          wordsMinedCount: act.wordsMinedCount,
          reviewsCompletedCount: act.reviewsCompletedCount,
          articlesReadCount: act.articlesReadCount,
          totalActivityScore: act.totalActivityScore,
        },
        update: {},
      });
    }

    console.log('Seeded PostgreSQL database successfully.');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`PostgreSQL unreachable (${errorMsg}). Updating local fallback store...`);
    memoryStore.save(seed);
    console.log('Local store seeded successfully at .data/local-vault.json');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});

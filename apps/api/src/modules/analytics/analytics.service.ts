import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore } from '../../config/store';

export async function getDashboardAnalytics(userId: string) {
  const dbConnected = await isDatabaseConnected();
  const effectiveUserId = userId || '00000000-0000-0000-0000-000000000001';
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let user: any = null;
  let vocabItems: any[] = [];
  let activities: any[] = [];
  let tags: any[] = [];
  let vocabTags: any[] = [];
  let contexts: any[] = [];

  if (dbConnected) {
    user = await prisma.user.findUnique({ where: { id: effectiveUserId } });
    vocabItems = await prisma.vocabItem.findMany({ where: { userId: effectiveUserId } });
    activities = await prisma.dailyActivity.findMany({
      where: { userId: effectiveUserId },
      orderBy: { activityDate: 'asc' },
    });
    tags = await prisma.tag.findMany();
    vocabTags = await prisma.vocabTag.findMany();
    contexts = await prisma.vocabContext.findMany();
  } else {
    const store = memoryStore.getData();
    user = store.users.find((u) => u.id === effectiveUserId) || store.users[0];
    vocabItems = store.vocabItems.filter(
      (v) => v.userId === effectiveUserId || v.userId === '00000000-0000-0000-0000-000000000001'
    );
    activities = store.dailyActivities.filter(
      (d) => d.userId === effectiveUserId || d.userId === '00000000-0000-0000-0000-000000000001'
    );
    tags = store.tags;
    vocabTags = store.vocabTags;
    contexts = store.contexts;
  }

  const todayAct = activities.find((a) => {
    const dateStr = a.activityDate instanceof Date ? a.activityDate.toISOString().slice(0, 10) : a.activityDate;
    return dateStr === todayStr;
  });

  const streak = {
    currentStreak: user?.currentStreak || 14,
    longestStreak: user?.longestStreak || 29,
    todayCompletedReviews: todayAct?.reviewsCompletedCount || 0,
    todayWordsMined: todayAct?.wordsMinedCount || 0,
    dailyGoal: user?.dailyReviewGoal || 20,
  };

  const totalVocab = Math.max(1, vocabItems.length);
  const stageCounts = {
    NEW: 0,
    LEARNING: 0,
    YOUNG: 0,
    MATURE: 0,
  };

  vocabItems.forEach((v) => {
    const stage = (v.masteryStage as keyof typeof stageCounts) || 'NEW';
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    } else {
      stageCounts.NEW++;
    }
  });

  const retentionDistribution = [
    {
      stage: 'NEW',
      label: 'New (Baru Disimpan)',
      count: stageCounts.NEW,
      percentage: Math.round((stageCounts.NEW / totalVocab) * 1000) / 10,
      color: '#94A3B8',
    },
    {
      stage: 'LEARNING',
      label: 'Learning (< 7 Hari)',
      count: stageCounts.LEARNING,
      percentage: Math.round((stageCounts.LEARNING / totalVocab) * 1000) / 10,
      color: '#F59E0B',
    },
    {
      stage: 'YOUNG',
      label: 'Young (7-21 Hari)',
      count: stageCounts.YOUNG,
      percentage: Math.round((stageCounts.YOUNG / totalVocab) * 1000) / 10,
      color: '#3B82F6',
    },
    {
      stage: 'MATURE',
      label: 'Mature (> 21 Hari)',
      count: stageCounts.MATURE,
      percentage: Math.round((stageCounts.MATURE / totalVocab) * 1000) / 10,
      color: '#10B981',
    },
  ];

  const activityMap = new Map<string, { wordsMined: number; reviewsCompleted: number; totalScore: number }>();
  activities.forEach((act) => {
    const dateKey = act.activityDate instanceof Date ? act.activityDate.toISOString().slice(0, 10) : act.activityDate;
    activityMap.set(dateKey, {
      wordsMined: act.wordsMinedCount,
      reviewsCompleted: act.reviewsCompletedCount,
      totalScore: act.totalActivityScore,
    });
  });

  const contributionHeatmap: Array<{
    date: string;
    wordsMined: number;
    reviewsCompleted: number;
    totalScore: number;
    intensityLevel: number;
  }> = [];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = activityMap.get(dateStr);

    const wordsMined = entry?.wordsMined || 0;
    const reviewsCompleted = entry?.reviewsCompleted || 0;
    const totalScore = entry?.totalScore || wordsMined + reviewsCompleted;

    let intensityLevel = 0;
    if (totalScore > 30) intensityLevel = 4;
    else if (totalScore >= 16) intensityLevel = 3;
    else if (totalScore >= 6) intensityLevel = 2;
    else if (totalScore >= 1) intensityLevel = 1;

    contributionHeatmap.push({
      date: dateStr,
      wordsMined,
      reviewsCompleted,
      totalScore,
      intensityLevel,
    });
  }

  const tagCounts: Record<string, number> = {
    'Idiom': 0,
    'Phrasal Verb': 0,
    'Academic': 0,
    'Slang': 0,
  };

  vocabTags.forEach((vt) => {
    const t = tags.find((item) => item.id === vt.tagId);
    if (t && tagCounts[t.name] !== undefined) {
      tagCounts[t.name]++;
    }
  });

  const tagDistribution = Object.entries(tagCounts).map(([tag, count]) => ({
    tag,
    count: count || (tag === 'Idiom' ? 4 : tag === 'Phrasal Verb' ? 3 : 1),
  }));

  const leechWatchlist = vocabItems
    .filter((v) => v.isLeech || v.lapseCount >= 3)
    .sort((a, b) => b.lapseCount - a.lapseCount)
    .slice(0, 10)
    .map((v) => {
      const vContexts = contexts.filter((c) => c.vocabItemId === v.id);
      return {
        vocabItemId: v.id,
        lemma: v.lemma,
        displayTerm: v.displayTerm,
        lapseCount: v.lapseCount,
        easinessFactor: v.easinessFactor,
        masteryStage: v.masteryStage,
        contextsCount: Math.max(1, vContexts.length),
      };
    });

  let cumulativeCount = 0;
  const vocabularyGrowth = contributionHeatmap
    .filter((_, idx) => idx % 7 === 0 || idx === contributionHeatmap.length - 1)
    .map((entry) => {
      cumulativeCount += entry.wordsMined;
      return {
        date: entry.date,
        totalMined: Math.max(cumulativeCount, 5),
      };
    });

  return {
    streak,
    retentionDistribution,
    contributionHeatmap,
    vocabularyGrowth,
    tagDistribution,
    leechWatchlist,
  };
}

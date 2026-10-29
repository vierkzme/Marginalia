import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore } from '../../config/store';

export interface CoverageCalculationResult {
  percentage: number;
  knownLemmasCount: number;
  learningLemmasCount: number;
  leechLemmasCount: number;
  unknownLemmasCount: number;
  difficultyTier: 'OPTIMAL' | 'CHALLENGING' | 'HEAVY';
  summaryMessage: string;
}

export async function calculateArticleCoverage(
  userId: string,
  articleLemmas: string[]
): Promise<CoverageCalculationResult> {
  const dbConnected = await isDatabaseConnected();
  let userVaultItems: Array<{ lemma: string; masteryStage: string; isLeech: boolean }> = [];

  if (dbConnected) {
    userVaultItems = await prisma.vocabItem.findMany({
      where: { userId },
      select: { lemma: true, masteryStage: true, isLeech: true },
    });
  } else {
    const store = memoryStore.getData();
    userVaultItems = store.vocabItems
      .filter((v) => v.userId === userId || v.userId === '00000000-0000-0000-0000-000000000001')
      .map((v) => ({ lemma: v.lemma, masteryStage: v.masteryStage, isLeech: v.isLeech }));
  }

  const vaultMap = new Map<string, { masteryStage: string; isLeech: boolean }>();
  userVaultItems.forEach((v) => {
    vaultMap.set(v.lemma.toLowerCase(), {
      masteryStage: v.masteryStage,
      isLeech: v.isLeech,
    });
  });

  let knownCount = 0;
  let learningCount = 0;
  let leechCount = 0;
  let unknownCount = 0;

  const totalLemmas = Math.max(1, articleLemmas.length);

  for (const rawLemma of articleLemmas) {
    const lemma = rawLemma.toLowerCase();
    const entry = vaultMap.get(lemma);

    if (!entry) {
      unknownCount++;
    } else if (entry.isLeech) {
      leechCount++;
      learningCount++;
    } else if (entry.masteryStage === 'MATURE' || entry.masteryStage === 'KNOWN') {
      knownCount++;
    } else {
      learningCount++;
    }
  }

  // Base coverage assumes recognized / learning lemmas count towards cognitive familiarity
  const recognizedCount = knownCount + learningCount;
  const percentage = Math.min(
    100,
    Math.round(((recognizedCount + (totalLemmas - articleLemmas.length)) / totalLemmas) * 1000) / 10
  );

  let difficultyTier: 'OPTIMAL' | 'CHALLENGING' | 'HEAVY' = 'CHALLENGING';
  let summaryMessage = `${Math.round(percentage)}% kosakata di artikel ini sudah ada di Vault kamu`;

  if (percentage >= 95.0) {
    difficultyTier = 'OPTIMAL';
    summaryMessage = `${Math.round(percentage)}% kosakata di artikel ini sudah ada di Vault kamu: Sangat pas untuk dibaca!`;
  } else if (percentage >= 90.0) {
    difficultyTier = 'CHALLENGING';
    summaryMessage = `${Math.round(percentage)}% kosakata dikuasai: Bacaan menantang, siapkan Sentence Mining.`;
  } else {
    difficultyTier = 'HEAVY';
    summaryMessage = `${Math.round(percentage)}% kosakata dikuasai: Bacaan cukup berat, banyak istilah baru.`;
  }

  return {
    percentage,
    knownLemmasCount: knownCount,
    learningLemmasCount: learningCount,
    leechLemmasCount: leechCount,
    unknownLemmasCount: unknownCount,
    difficultyTier,
    summaryMessage,
  };
}

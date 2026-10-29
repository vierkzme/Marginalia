import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore } from '../../config/store';
import { annotateSentenceHighlights, VaultLookupEntry, TokenSpan } from './smart-highlighter';

export async function getArticleReaderView(userId: string, articleId: string) {
  const dbConnected = await isDatabaseConnected();

  let articleRecord: any = null;
  let sentenceRecords: any[] = [];
  let userVocab: any[] = [];

  if (dbConnected) {
    articleRecord = await prisma.article.findUnique({
      where: { id: articleId },
    });
    if (!articleRecord) {
      throw new Error('Article not found.');
    }

    sentenceRecords = await prisma.articleSentence.findMany({
      where: { articleId },
      orderBy: [{ paragraphIndex: 'asc' }, { sentenceIndex: 'asc' }],
    });

    userVocab = await prisma.vocabItem.findMany({
      where: { userId },
      include: {
        tags: { include: { tag: true } },
      },
    });
  } else {
    const store = memoryStore.getData();
    articleRecord = store.articles.find((a) => a.id === articleId);
    if (!articleRecord) {
      throw new Error('Article not found.');
    }

    sentenceRecords = store.sentences
      .filter((s) => s.articleId === articleId)
      .sort((a, b) => a.paragraphIndex - b.paragraphIndex || a.sentenceIndex - b.sentenceIndex);

    userVocab = store.vocabItems.filter(
      (v) => v.userId === userId || v.userId === '00000000-0000-0000-0000-000000000001'
    );
  }

  const vaultMap = new Map<string, VaultLookupEntry>();
  userVocab.forEach((v) => {
    let tagNames: string[] = [];
    if (v.tags && Array.isArray(v.tags)) {
      tagNames = v.tags.map((t: any) => t.tag?.name || t.name).filter(Boolean);
    } else {
      const store = memoryStore.getData();
      const linkedTagIds = store.vocabTags.filter((vt) => vt.vocabItemId === v.id).map((vt) => vt.tagId);
      tagNames = store.tags.filter((t) => linkedTagIds.includes(t.id)).map((t) => t.name);
    }

    vaultMap.set(v.lemma.toLowerCase(), {
      vocabItemId: v.id,
      lemma: v.lemma,
      masteryStage: v.masteryStage,
      isLeech: v.isLeech,
      definition: v.definition,
      tags: tagNames,
    });
  });

  const paragraphMap = new Map<number, any[]>();

  sentenceRecords.forEach((s) => {
    const tokens = (s.tokensJson as TokenSpan[]) || [];
    const highlights = annotateSentenceHighlights(s.sentenceText, tokens, vaultMap);

    if (!paragraphMap.has(s.paragraphIndex)) {
      paragraphMap.set(s.paragraphIndex, []);
    }

    paragraphMap.get(s.paragraphIndex)!.push({
      sentenceId: s.id,
      sentenceIndex: s.sentenceIndex,
      sentenceText: s.sentenceText,
      tokens,
      highlights,
    });
  });

  const paragraphs = Array.from(paragraphMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([paragraphIndex, sentences]) => ({
      paragraphIndex,
      sentences,
    }));

  return {
    article: {
      id: articleRecord.id,
      title: articleRecord.title,
      sourceType: articleRecord.sourceType,
      sourceUrl: articleRecord.sourceUrl,
      totalWordCount: articleRecord.totalWordCount,
      uniqueLemmaCount: articleRecord.uniqueLemmaCount,
      coveragePercentage: articleRecord.initialCoveragePct,
      summaryMessage: `${Math.round(articleRecord.initialCoveragePct)}% kosakata di artikel ini sudah ada di Vault kamu`,
      readingProgressPct: articleRecord.readingProgressPct,
      isCompleted: articleRecord.isCompleted,
    },
    paragraphs,
  };
}

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { randomUUID } from 'crypto';
import { ENV } from '../../config/env';
import { prisma, isDatabaseConnected } from '../../config/db';
import { memoryStore, ArticleEntity, ArticleSentenceEntity } from '../../config/store';
import { calculateArticleCoverage } from './coverage.service';

export interface ImportArticleInput {
  userId: string;
  sourceType: 'RAW_TEXT' | 'URL' | 'TXT_FILE' | 'SRT_FILE';
  title?: string;
  sourceUrl?: string;
  rawContent?: string;
  fileBuffer?: Buffer;
  fileName?: string;
}

export function cleanSrtContent(srtText: string): string {
  const timestampRegex = /^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}.*$/;
  const seqRegex = /^\d+\s*$/;
  const htmlRegex = /<[^>]+>/g;

  const lines = srtText.split(/\r?\n/);
  const cleaned: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || seqRegex.test(line) || timestampRegex.test(line)) {
      continue;
    }
    const noTags = line.replace(htmlRegex, '').trim();
    if (noTags) {
      cleaned.push(noTags);
    }
  }

  return cleaned.join(' ').replace(/\s+/g, ' ').trim();
}

export async function extractFromUrl(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article || !article.textContent.trim()) {
      throw new Error('Could not parse clean article content from this webpage.');
    }

    return {
      title: article.title || 'Imported Article',
      content: article.textContent.trim(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('403') || msg.includes('401')) {
      throw new Error(
        'This site restricts automated access (paywall or anti-scraping). Please copy and paste the article text directly into the "Paste Text" tab.'
      );
    }
    throw new Error(`Failed to extract article from URL: ${msg}`);
  }
}

export interface NlpSentence {
  paragraphIndex: number;
  sentenceIndex: number;
  sentenceText: string;
  tokens: Array<{
    text: string;
    lemma: string;
    pos: string;
    isStop: boolean;
    startChar: number;
    endChar: number;
  }>;
  detectedPhrasalVerbs?: Array<{
    surfaceForm: string;
    lemma: string;
    startChar: number;
    endChar: number;
  }>;
}

export interface NlpProcessResult {
  totalWordCount: number;
  uniqueContentLemmas: string[];
  sentences: NlpSentence[];
}

export async function processTextWithNlp(text: string): Promise<NlpProcessResult> {
  try {
    const resp = await axios.post(
      `${ENV.NLP_SERVICE_URL}/nlp/v1/process-document`,
      { rawText: text },
      { timeout: 5000 }
    );
    if (resp.data && resp.data.sentences) {
      return resp.data;
    }
  } catch {
    // Graceful fallback: built-in lightweight NLP tokenizer
  }

  const paragraphs = text.split(/\r?\n\r?\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0 && text.trim()) {
    paragraphs.push(text.trim());
  }

  const sentences: NlpSentence[] = [];
  const uniqueLemmas = new Set<string>();
  let totalWords = 0;
  let sentIdx = 0;

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'over', 'after', 'is', 'am', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'it', 'its', 'they', 'them',
    'their', 'he', 'him', 'his', 'she', 'her', 'we', 'us', 'our', 'you', 'your', 'this', 'that',
  ]);

  paragraphs.forEach((pText, pIdx) => {
    const rawSentences = pText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [pText];

    rawSentences.forEach((s) => {
      const cleanSent = s.trim();
      if (!cleanSent) return;

      const tokens: NlpSentence['tokens'] = [];
      const wordRegex = /[A-Za-z0-9'-]+|[.,!?;:"]/g;
      let match: RegExpExecArray | null;

      while ((match = wordRegex.exec(cleanSent)) !== null) {
        const wordText = match[0];
        const isWord = /[A-Za-z0-9]/.test(wordText);
        const lower = wordText.toLowerCase();
        const isStop = stopWords.has(lower);

        if (isWord) {
          totalWords++;
          if (!isStop) {
            uniqueLemmas.add(lower);
          }
        }

        tokens.push({
          text: wordText,
          lemma: lower,
          pos: isWord ? 'NOUN' : 'PUNCT',
          isStop,
          startChar: match.index,
          endChar: match.index + wordText.length,
        });
      }

      sentences.push({
        paragraphIndex: pIdx,
        sentenceIndex: sentIdx++,
        sentenceText: cleanSent,
        tokens,
      });
    });
  });

  return {
    totalWordCount: totalWords,
    uniqueContentLemmas: Array.from(uniqueLemmas).sort(),
    sentences,
  };
}

export async function importArticle(input: ImportArticleInput) {
  let resolvedTitle = input.title?.trim() || '';
  let resolvedContent = input.rawContent?.trim() || '';

  if (input.sourceType === 'URL') {
    if (!input.sourceUrl) {
      throw new Error('Source URL is required.');
    }
    const extracted = await extractFromUrl(input.sourceUrl);
    resolvedTitle = resolvedTitle || extracted.title;
    resolvedContent = extracted.content;
  } else if (input.sourceType === 'SRT_FILE') {
    if (!input.fileBuffer) {
      throw new Error('SRT file buffer is required.');
    }
    const rawSrt = input.fileBuffer.toString('utf-8');
    resolvedContent = cleanSrtContent(rawSrt);
    resolvedTitle = resolvedTitle || input.fileName?.replace(/\.srt$/i, '') || 'Imported Subtitle';
  } else if (input.sourceType === 'TXT_FILE') {
    if (!input.fileBuffer) {
      throw new Error('Text file buffer is required.');
    }
    resolvedContent = input.fileBuffer.toString('utf-8').trim();
    resolvedTitle = resolvedTitle || input.fileName?.replace(/\.txt$/i, '') || 'Imported Document';
  }

  if (!resolvedContent) {
    throw new Error('Article content cannot be empty.');
  }

  if (!resolvedTitle) {
    resolvedTitle = resolvedContent.slice(0, 50).trim() + '...';
  }

  const nlpResult = await processTextWithNlp(resolvedContent);
  const coverage = await calculateArticleCoverage(input.userId, nlpResult.uniqueContentLemmas);

  const dbConnected = await isDatabaseConnected();
  const articleId = randomUUID();

  if (dbConnected) {
    const article = await prisma.article.create({
      data: {
        id: articleId,
        userId: input.userId,
        title: resolvedTitle,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl || null,
        rawContent: resolvedContent,
        totalWordCount: nlpResult.totalWordCount,
        uniqueLemmaCount: nlpResult.uniqueContentLemmas.length,
        initialCoveragePct: coverage.percentage,
        uniqueLemmasJson: nlpResult.uniqueContentLemmas,
        readingProgressPct: 0.0,
        isCompleted: false,
        sentences: {
          create: nlpResult.sentences.map((s) => ({
            id: randomUUID(),
            paragraphIndex: s.paragraphIndex,
            sentenceIndex: s.sentenceIndex,
            sentenceText: s.sentenceText,
            tokensJson: s.tokens,
          })),
        },
      },
    });

    return {
      articleId: article.id,
      title: article.title,
      sourceType: article.sourceType,
      totalWordCount: article.totalWordCount,
      uniqueLemmaCount: article.uniqueLemmaCount,
      coverage,
    };
  } else {
    const store = memoryStore.getData();
    const newArticle: ArticleEntity = {
      id: articleId,
      userId: input.userId,
      title: resolvedTitle,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl || null,
      rawContent: resolvedContent,
      totalWordCount: nlpResult.totalWordCount,
      uniqueLemmaCount: nlpResult.uniqueContentLemmas.length,
      initialCoveragePct: coverage.percentage,
      uniqueLemmasJson: nlpResult.uniqueContentLemmas,
      readingProgressPct: 0.0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    store.articles.unshift(newArticle);

    nlpResult.sentences.forEach((s) => {
      const sentenceEntity: ArticleSentenceEntity = {
        id: randomUUID(),
        articleId,
        paragraphIndex: s.paragraphIndex,
        sentenceIndex: s.sentenceIndex,
        sentenceText: s.sentenceText,
        tokensJson: s.tokens,
      };
      store.sentences.push(sentenceEntity);
    });

    memoryStore.save();

    return {
      articleId: newArticle.id,
      title: newArticle.title,
      sourceType: newArticle.sourceType,
      totalWordCount: newArticle.totalWordCount,
      uniqueLemmaCount: newArticle.uniqueLemmaCount,
      coverage,
    };
  }
}

export async function listArticles(userId: string) {
  const dbConnected = await isDatabaseConnected();
  if (dbConnected) {
    return await prisma.article.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        totalWordCount: true,
        uniqueLemmaCount: true,
        initialCoveragePct: true,
        readingProgressPct: true,
        isCompleted: true,
        createdAt: true,
      },
    });
  } else {
    const store = memoryStore.getData();
    return store.articles
      .filter((a) => a.userId === userId || a.userId === '00000000-0000-0000-0000-000000000001')
      .map((a) => ({
        id: a.id,
        title: a.title,
        sourceType: a.sourceType,
        sourceUrl: a.sourceUrl,
        totalWordCount: a.totalWordCount,
        uniqueLemmaCount: a.uniqueLemmaCount,
        initialCoveragePct: a.initialCoveragePct,
        readingProgressPct: a.readingProgressPct,
        isCompleted: a.isCompleted,
        createdAt: a.createdAt,
      }));
  }
}

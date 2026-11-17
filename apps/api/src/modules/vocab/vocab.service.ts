import axios from 'axios';
import { randomUUID } from 'crypto';
import { ENV } from '../../config/env';
import { prisma, isDatabaseConnected } from '../../config/db';
import {
  memoryStore,
  VocabItemEntity,
  VocabContextEntity,
  formatLocalDateKey,
  toUtcDateOnly,
  refreshStoreUserStreak,
  syncPrismaUserStreak,
} from '../../config/store';

export interface PreviewSelectionInput {
  userId: string;
  articleId?: string;
  sentenceId?: string;
  paragraphText: string;
  selectedText: string;
  selectionStartInSentence?: number;
  selectionEndInSentence?: number;
}

export interface MineVocabInput {
  userId: string;
  articleId?: string;
  sentenceId?: string;
  surfaceForm: string;
  lemma: string;
  displayTerm?: string;
  partOfSpeech?: string;
  phonetic?: string;
  definition: string;
  personalNote?: string;
  sentenceText: string;
  startOffset: number;
  endOffset: number;
  tagNames?: string[];
}

const CURATED_IDIOM_DICTIONARY: Record<string, { definition: string; phonetic: string; tag: string }> = {
  'bite the bullet': {
    definition: 'To face a difficult or unpleasant situation with courage and get it over with.',
    phonetic: '/baɪt ðə ˈbʊlɪt/',
    tag: 'Idiom',
  },
  'run into': {
    definition: 'To encounter unexpected problems, bugs, or difficulties.',
    phonetic: '/rʌn ˈɪntuː/',
    tag: 'Phrasal Verb',
  },
  'sweep under the rug': {
    definition: 'To hide or ignore an embarrassing or difficult problem instead of dealing with it.',
    phonetic: '/swiːp ˈʌndər ðə rʌɡ/',
    tag: 'Idiom',
  },
  'brush up on': {
    definition: 'To refresh one\'s memory or knowledge of something previously learned.',
    phonetic: '/brʌʃ ʌp ɒn/',
    tag: 'Phrasal Verb',
  },
  'hit a wall': {
    definition: 'To reach a point where no more progress can be made due to barriers or exhaustion.',
    phonetic: '/hɪt ə wɔːl/',
    tag: 'Idiom',
  },
  'break new ground': {
    definition: 'To discover or innovate something new that has never been done before.',
    phonetic: '/breɪk njuː ɡraʊnd/',
    tag: 'Idiom',
  },
  'bottleneck': {
    definition: 'A point of congestion in a system that stops or slows down performance.',
    phonetic: '/ˈbɒtl.nek/',
    tag: 'Academic',
  },
  'scale up': {
    definition: 'To increase the capacity, size, or throughput of a system.',
    phonetic: '/skeɪl ʌp/',
    tag: 'Phrasal Verb',
  },
  'silver bullet': {
    definition: 'A simple, seemingly magical solution to a complex or difficult technical problem.',
    phonetic: '/ˈsɪlvər ˈbʊlɪt/',
    tag: 'Idiom',
  },
  'cut corners': {
    definition: 'To take shortcuts that sacrifice quality, safety, or thoroughness in order to save time or money.',
    phonetic: '/kʌt ˈkɔːrnərz/',
    tag: 'Phrasal Verb',
  },
  'ballpark': {
    definition: 'A rough numerical estimate or approximate range used before exact figures are known.',
    phonetic: '/ˈbɔːlpɑːrk/',
    tag: 'Slang',
  },
  'low-hanging fruit': {
    definition: 'Tasks or improvements that are easiest to achieve and deliver quick value with minimal effort.',
    phonetic: '/loʊ ˈhæŋɪŋ fruːt/',
    tag: 'Idiom',
  },
  'iron out': {
    definition: 'To resolve minor problems, bugs, or disagreements before a final release.',
    phonetic: '/ˈaɪərn aʊt/',
    tag: 'Phrasal Verb',
  },
  'ubiquitous': {
    definition: 'Present, appearing, or found everywhere across modern systems.',
    phonetic: '/juːˈbɪkwɪtəs/',
    tag: 'Academic',
  },
  'ephemeral': {
    definition: 'Lasting for a very short period of time, such as temporary containers or short-lived cache entries.',
    phonetic: '/ɪˈfɛmərəl/',
    tag: 'Academic',
  },
  'zero in on': {
    definition: 'To focus attention directly on a specific root cause, metric, or problem.',
    phonetic: '/ˈzɪroʊ ɪn ɒn/',
    tag: 'Phrasal Verb',
  },
  'caveat': {
    definition: 'An important warning, limitation, or condition to keep in mind when evaluating a claim.',
    phonetic: '/ˈkæviæt/',
    tag: 'Academic',
  },
  'ship fast': {
    definition: 'To release working software updates quickly and iterate based on real user feedback.',
    phonetic: '/ʃɪp fæst/',
    tag: 'Slang',
  },
  'deep dive': {
    definition: 'An intensive, thorough investigation or technical analysis of a specific subject.',
    phonetic: '/diːp daɪv/',
    tag: 'Slang',
  },
};

export async function lookupDefinition(lemma: string, contextSentence?: string) {
  const normalized = lemma.trim().toLowerCase();

  const curated = CURATED_IDIOM_DICTIONARY[normalized];
  if (curated) {
    return {
      source: 'CURATED_IDIOM_KNOWLEDGE_BASE',
      definition: curated.definition,
      phonetic: curated.phonetic,
      suggestedTags: [curated.tag],
    };
  }

  try {
    const singleWord = normalized.split(/\s+/)[0];
    const resp = await axios.get(`${ENV.FREE_DICTIONARY_API_URL}/${encodeURIComponent(singleWord)}`, {
      timeout: 3000,
    });
    if (resp.data && Array.isArray(resp.data) && resp.data[0]) {
      const entry = resp.data[0];
      const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || null;
      const meanings = entry.meanings || [];
      const firstMeaning = meanings[0];
      const definition = firstMeaning?.definitions?.[0]?.definition || 'Definition available.';
      const partOfSpeech = firstMeaning?.partOfSpeech?.toUpperCase() || 'NOUN';

      return {
        source: 'FREE_DICTIONARY_API',
        definition,
        phonetic,
        partOfSpeech,
        suggestedTags: [partOfSpeech === 'VERB' ? 'Phrasal Verb' : 'Academic'],
      };
    }
  } catch {
    // Ignore and proceed to fallback
  }

  const isMultiWord = normalized.includes(' ');
  return {
    source: 'CONTEXTUAL_FALLBACK',
    definition: `Meaning in context: "${lemma}".`,
    phonetic: null,
    suggestedTags: [isMultiWord ? 'Idiom' : 'Academic'],
  };
}

export async function previewSelection(input: PreviewSelectionInput) {
  const cleanSelected = input.selectedText.trim();
  let extractedSentence = input.paragraphText.trim();
  let surfaceForm = cleanSelected;
  let normalizedLemma = cleanSelected.toLowerCase();
  let partOfSpeech = cleanSelected.includes(' ') ? 'IDIOM' : 'VOCABULARY';
  let startOffset = input.selectionStartInSentence ?? 0;
  let endOffset = input.selectionEndInSentence ?? cleanSelected.length;

  try {
    const nlpResp = await axios.post(
      `${ENV.NLP_SERVICE_URL}/nlp/v1/extract-mining-context`,
      {
        paragraphText: input.paragraphText,
        selectedText: input.selectedText,
        selectionStartInParagraph: startOffset,
        selectionEndInParagraph: endOffset,
      },
      { timeout: 3000 }
    );
    if (nlpResp.data) {
      extractedSentence = nlpResp.data.extractedSentence || extractedSentence;
      surfaceForm = nlpResp.data.surfaceForm || surfaceForm;
      normalizedLemma = nlpResp.data.lemma || normalizedLemma;
      partOfSpeech = nlpResp.data.partOfSpeech || partOfSpeech;
      startOffset = nlpResp.data.startOffsetInSentence ?? startOffset;
      endOffset = nlpResp.data.endOffsetInSentence ?? endOffset;
    }
  } catch {
    // Built-in fallback
    const idx = extractedSentence.indexOf(cleanSelected);
    if (idx !== -1) {
      startOffset = idx;
      endOffset = idx + cleanSelected.length;
    }
  }

  const dictionary = await lookupDefinition(normalizedLemma, extractedSentence);

  const dbConnected = await isDatabaseConnected();
  let existingVaultItem: any = null;

  if (dbConnected) {
    const existing = await prisma.vocabItem.findUnique({
      where: {
        userId_lemma: {
          userId: input.userId,
          lemma: normalizedLemma,
        },
      },
      include: {
        contexts: true,
      },
    });
    if (existing) {
      existingVaultItem = {
        id: existing.id,
        lemma: existing.lemma,
        masteryStage: existing.masteryStage,
        totalContextsCount: existing.contexts.length,
      };
    }
  } else {
    const store = memoryStore.getData();
    const existing = store.vocabItems.find(
      (v) => v.userId === input.userId && v.lemma.toLowerCase() === normalizedLemma
    );
    if (existing) {
      const contextCount = store.contexts.filter((c) => c.vocabItemId === existing.id).length;
      existingVaultItem = {
        id: existing.id,
        lemma: existing.lemma,
        masteryStage: existing.masteryStage,
        totalContextsCount: contextCount,
      };
    }
  }

  return {
    surfaceForm,
    lemma: normalizedLemma,
    partOfSpeech,
    phonetic: dictionary.phonetic,
    extractedSentence,
    startOffset,
    endOffset,
    dictionary,
    existingVaultItem,
  };
}

export async function mineVocab(input: MineVocabInput) {
  const normalizedLemma = input.lemma.trim().toLowerCase();
  const dbConnected = await isDatabaseConnected();
  const today = new Date();
  const todayStr = formatLocalDateKey(today);
  const todayDate = toUtcDateOnly(todayStr);

  if (dbConnected) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.vocabItem.findUnique({
        where: {
          userId_lemma: {
            userId: input.userId,
            lemma: normalizedLemma,
          },
        },
        include: { contexts: true },
      });

      const vocabItem = await tx.vocabItem.upsert({
        where: {
          userId_lemma: {
            userId: input.userId,
            lemma: normalizedLemma,
          },
        },
        create: {
          userId: input.userId,
          lemma: normalizedLemma,
          displayTerm: input.displayTerm || input.surfaceForm,
          partOfSpeech: input.partOfSpeech || 'UNKNOWN',
          phonetic: input.phonetic || null,
          definition: input.definition,
          personalNote: input.personalNote || null,
          masteryStage: 'NEW',
          nextReviewDate: today,
        },
        update: {
          personalNote: input.personalNote ?? existing?.personalNote,
        },
      });

      await tx.vocabContext.upsert({
        where: {
          vocabItemId_sentenceText_startOffset: {
            vocabItemId: vocabItem.id,
            sentenceText: input.sentenceText,
            startOffset: input.startOffset,
          },
        },
        create: {
          vocabItemId: vocabItem.id,
          articleId: input.articleId || null,
          sentenceId: input.sentenceId || null,
          surfaceForm: input.surfaceForm,
          sentenceText: input.sentenceText,
          startOffset: input.startOffset,
          endOffset: input.endOffset,
          isPrimary: !existing || existing.contexts.length === 0,
        },
        update: {},
      });

      if (input.tagNames && input.tagNames.length > 0) {
        for (const tagName of input.tagNames) {
          const tag = await tx.tag.findFirst({
            where: {
              OR: [{ name: { equals: tagName, mode: 'insensitive' } }, { slug: tagName.toLowerCase() }],
            },
          });
          if (tag) {
            await tx.vocabTag.upsert({
              where: {
                vocabItemId_tagId: {
                  vocabItemId: vocabItem.id,
                  tagId: tag.id,
                },
              },
              create: {
                vocabItemId: vocabItem.id,
                tagId: tag.id,
              },
              update: {},
            });
          }
        }
      }

      await tx.dailyActivity.upsert({
        where: {
          userId_activityDate: {
            userId: input.userId,
            activityDate: todayDate,
          },
        },
        create: {
          userId: input.userId,
          activityDate: todayDate,
          wordsMinedCount: 1,
          totalActivityScore: 1,
        },
        update: {
          wordsMinedCount: { increment: 1 },
          totalActivityScore: { increment: 1 },
        },
      });

      await syncPrismaUserStreak(tx, input.userId, today);

      const totalContexts = await tx.vocabContext.count({ where: { vocabItemId: vocabItem.id } });

      return {
        vocabItemId: vocabItem.id,
        lemma: vocabItem.lemma,
        masteryStage: vocabItem.masteryStage,
        highlightColor: 'YELLOW',
        totalContextsCount: totalContexts,
        nextReviewDate: vocabItem.nextReviewDate,
      };
    });
  } else {
    const store = memoryStore.getData();
    let vocabItem = store.vocabItems.find(
      (v) => v.userId === input.userId && v.lemma.toLowerCase() === normalizedLemma
    );

    const isNew = !vocabItem;
    if (!vocabItem) {
      vocabItem = {
        id: randomUUID(),
        userId: input.userId,
        lemma: normalizedLemma,
        displayTerm: input.displayTerm || input.surfaceForm,
        partOfSpeech: input.partOfSpeech || 'UNKNOWN',
        phonetic: input.phonetic || null,
        definition: input.definition,
        personalNote: input.personalNote || null,
        masteryStage: 'NEW',
        repetition: 0,
        easinessFactor: 2.5,
        interval: 0,
        lapseCount: 0,
        isLeech: false,
        nextReviewDate: today.toISOString(),
        lastReviewedAt: null,
        createdAt: today.toISOString(),
      };
      store.vocabItems.push(vocabItem);
    } else if (input.personalNote) {
      vocabItem.personalNote = input.personalNote;
    }

    const existingContext = store.contexts.find(
      (c) =>
        c.vocabItemId === vocabItem!.id &&
        c.sentenceText === input.sentenceText &&
        c.startOffset === input.startOffset
    );

    if (!existingContext) {
      const hasPrimary = store.contexts.some((c) => c.vocabItemId === vocabItem!.id && c.isPrimary);
      const newCtx: VocabContextEntity = {
        id: randomUUID(),
        vocabItemId: vocabItem.id,
        articleId: input.articleId || null,
        sentenceId: input.sentenceId || null,
        surfaceForm: input.surfaceForm,
        sentenceText: input.sentenceText,
        startOffset: input.startOffset,
        endOffset: input.endOffset,
        isPrimary: !hasPrimary,
        createdAt: today.toISOString(),
      };
      store.contexts.push(newCtx);
    }

    if (input.tagNames && input.tagNames.length > 0) {
      input.tagNames.forEach((tName) => {
        const foundTag = store.tags.find(
          (t) => t.name.toLowerCase() === tName.toLowerCase() || t.slug === tName.toLowerCase()
        );
        if (foundTag) {
          const alreadyLinked = store.vocabTags.some(
            (vt) => vt.vocabItemId === vocabItem!.id && vt.tagId === foundTag.id
          );
          if (!alreadyLinked) {
            store.vocabTags.push({ vocabItemId: vocabItem!.id, tagId: foundTag.id });
          }
        }
      });
    }

    let dailyAct = store.dailyActivities.find(
      (d) => d.userId === input.userId && d.activityDate === todayStr
    );
    if (!dailyAct) {
      dailyAct = {
        id: `act-${todayStr}`,
        userId: input.userId,
        activityDate: todayStr,
        wordsMinedCount: 1,
        reviewsCompletedCount: 0,
        articlesReadCount: 0,
        totalActivityScore: 1,
      };
      store.dailyActivities.push(dailyAct);
    } else {
      dailyAct.wordsMinedCount += 1;
      dailyAct.totalActivityScore += 1;
    }

    refreshStoreUserStreak(store, input.userId, today);
    memoryStore.save();

    const totalContextsCount = store.contexts.filter((c) => c.vocabItemId === vocabItem!.id).length;

    return {
      vocabItemId: vocabItem.id,
      lemma: vocabItem.lemma,
      masteryStage: vocabItem.masteryStage,
      highlightColor: 'YELLOW',
      totalContextsCount,
      nextReviewDate: vocabItem.nextReviewDate,
    };
  }
}

export async function listUserVault(userId: string, filter?: { tagSlug?: string; stage?: string; query?: string }) {
  const dbConnected = await isDatabaseConnected();

  if (dbConnected) {
    const items = await prisma.vocabItem.findMany({
      where: {
        userId,
        ...(filter?.stage ? { masteryStage: filter.stage as any } : {}),
        ...(filter?.query
          ? {
              OR: [
                { lemma: { contains: filter.query, mode: 'insensitive' } },
                { definition: { contains: filter.query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        contexts: { orderBy: { isPrimary: 'desc' } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items;
  } else {
    const store = memoryStore.getData();
    let items = store.vocabItems.filter((v) => v.userId === userId);

    if (filter?.stage) {
      items = items.filter((v) => v.masteryStage === filter.stage);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      items = items.filter((v) => v.lemma.toLowerCase().includes(q) || v.definition.toLowerCase().includes(q));
    }

    return items.map((v) => {
      const contexts = store.contexts.filter((c) => c.vocabItemId === v.id);
      const tagIds = store.vocabTags.filter((vt) => vt.vocabItemId === v.id).map((vt) => vt.tagId);
      const tags = store.tags.filter((t) => tagIds.includes(t.id));

      return {
        ...v,
        contexts,
        tags: tags.map((t) => ({ tag: t })),
      };
    });
  }
}

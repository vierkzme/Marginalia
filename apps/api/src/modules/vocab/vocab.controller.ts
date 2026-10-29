import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { previewSelection, mineVocab, listUserVault } from './vocab.service';

const PreviewSchema = z.object({
  articleId: z.string().optional(),
  sentenceId: z.string().optional(),
  paragraphText: z.string().min(1),
  selectedText: z.string().min(1),
  selectionStartInSentence: z.number().optional(),
  selectionEndInSentence: z.number().optional(),
});

const MineSchema = z.object({
  articleId: z.string().optional(),
  sentenceId: z.string().optional(),
  surfaceForm: z.string().min(1),
  lemma: z.string().min(1),
  displayTerm: z.string().optional(),
  partOfSpeech: z.string().optional(),
  phonetic: z.string().optional().nullable(),
  definition: z.string().min(1),
  personalNote: z.string().optional().nullable(),
  sentenceText: z.string().min(1),
  startOffset: z.number(),
  endOffset: z.number(),
  tagNames: z.array(z.string()).optional(),
});

export async function handlePreviewSelection(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  const parse = PreviewSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid preview payload.' },
    });
    return;
  }

  try {
    const data = await previewSelection({
      userId,
      ...parse.data,
    });
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Preview lookup failed.';
    res.status(500).json({
      success: false,
      error: { code: 'PREVIEW_ERROR', message },
    });
  }
}

export async function handleMine(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  const parse = MineSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid sentence mining payload.' },
    });
    return;
  }

  try {
    const data = await mineVocab({
      userId,
      ...parse.data,
      personalNote: parse.data.personalNote ?? undefined,
      phonetic: parse.data.phonetic ?? undefined,
    });
    res.status(201).json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Mining save failed.';
    res.status(500).json({
      success: false,
      error: { code: 'MINE_ERROR', message },
    });
  }
}

export async function handleListVault(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  const { tag, stage, q } = req.query;

  try {
    const items = await listUserVault(userId, {
      tagSlug: typeof tag === 'string' ? tag : undefined,
      stage: typeof stage === 'string' ? stage : undefined,
      query: typeof q === 'string' ? q : undefined,
    });

    res.json({
      success: true,
      data: items,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve vault.';
    res.status(500).json({
      success: false,
      error: { code: 'VAULT_ERROR', message },
    });
  }
}

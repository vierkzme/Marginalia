import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { importArticle, listArticles } from './importer.service';
import { getArticleReaderView } from './reader-view.service';

const ImportBodySchema = z.object({
  sourceType: z.enum(['RAW_TEXT', 'URL', 'TXT_FILE', 'SRT_FILE']),
  title: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  rawContent: z.string().optional(),
});

export async function handleImport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

  try {
    const file = req.file;
    let sourceType = req.body.sourceType;
    let title = req.body.title;
    let sourceUrl = req.body.sourceUrl;
    let rawContent = req.body.rawContent;

    if (file) {
      const isSrt = file.originalname.endsWith('.srt');
      sourceType = isSrt ? 'SRT_FILE' : 'TXT_FILE';
      title = title || file.originalname.replace(/\.(srt|txt)$/i, '');
    } else {
      const parsed = ImportBodySchema.parse({ sourceType, title, sourceUrl, rawContent });
      sourceType = parsed.sourceType;
      title = parsed.title;
      sourceUrl = parsed.sourceUrl;
      rawContent = parsed.rawContent;
    }

    const result = await importArticle({
      userId,
      sourceType,
      title,
      sourceUrl,
      rawContent,
      fileBuffer: file?.buffer,
      fileName: file?.originalname,
    });

    res.status(201).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Article import failed.';
    res.status(400).json({
      success: false,
      error: { code: 'IMPORT_ERROR', message },
    });
  }
}

export async function handleGetArticles(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  try {
    const articles = await listArticles(userId);
    res.json({
      success: true,
      data: articles,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list articles.';
    res.status(500).json({
      success: false,
      error: { code: 'LIST_ERROR', message },
    });
  }
}

export async function handleGetReaderView(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  const articleId = req.params.articleId;

  try {
    const readerView = await getArticleReaderView(userId, articleId);
    res.json({
      success: true,
      data: readerView,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load reader view.';
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message },
    });
  }
}

import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { getDueReviews, gradeReview } from './reviews.service';

const GradeSchema = z.object({
  button: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
  qualityGrade: z.number().min(0).max(5).optional(),
  responseTimeMs: z.number().min(0).optional(),
});

export async function handleGetDue(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

  try {
    const data = await getDueReviews(userId);
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve due reviews.';
    res.status(500).json({
      success: false,
      error: { code: 'DUE_REVIEWS_ERROR', message },
    });
  }
}

export async function handleGrade(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
  const vocabId = req.params.vocabId;

  const parse = GradeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid grading response.' },
    });
    return;
  }

  try {
    const data = await gradeReview(
      userId,
      vocabId,
      parse.data.button,
      parse.data.responseTimeMs || 0
    );
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Grading failed.';
    res.status(500).json({
      success: false,
      error: { code: 'GRADE_ERROR', message },
    });
  }
}

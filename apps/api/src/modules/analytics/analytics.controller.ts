import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { getDashboardAnalytics } from './analytics.service';

export async function handleGetDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

  try {
    const data = await getDashboardAnalytics(userId);
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve analytics dashboard.';
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message },
    });
  }
}

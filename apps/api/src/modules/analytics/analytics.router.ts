import { Router } from 'express';
import { handleGetDashboard } from './analytics.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/dashboard', handleGetDashboard);

export default router;

import { Router } from 'express';
import { handlePreviewSelection, handleMine, handleListVault } from './vocab.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.post('/preview-selection', handlePreviewSelection);
router.post('/mine', handleMine);
router.get('/', handleListVault);

export default router;

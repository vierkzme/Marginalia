import { Router } from 'express';
import { handleGetDue, handleGrade } from './reviews.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/due', handleGetDue);
router.post('/:vocabId/grade', handleGrade);

export default router;

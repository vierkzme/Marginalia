import { Router } from 'express';
import {
  handleRegister,
  handleLogin,
  handleDemoLogin,
  handleGetMe,
  handleUpdateProfile,
} from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/demo', handleDemoLogin);
router.get('/me', requireAuth, handleGetMe);
router.put('/me', requireAuth, handleUpdateProfile);

export default router;

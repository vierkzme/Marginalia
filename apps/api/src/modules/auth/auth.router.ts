import { Router } from 'express';
import { handleRegister, handleLogin, handleGetMe } from './auth.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.get('/me', requireAuth, handleGetMe);

export default router;

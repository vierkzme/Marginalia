import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleGetArticles } from './articles.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

router.use(requireAuth);
router.post('/import', upload.single('file'), handleImport);
router.get('/', handleGetArticles);

export default router;

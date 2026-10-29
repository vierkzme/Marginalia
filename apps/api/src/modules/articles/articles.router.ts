import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleGetArticles, handleGetReaderView } from './articles.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth);
router.post('/import', upload.single('file'), handleImport);
router.get('/', handleGetArticles);
router.get('/:articleId/reader-view', handleGetReaderView);

export default router;

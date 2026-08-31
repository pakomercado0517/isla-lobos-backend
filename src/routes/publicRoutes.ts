import { Router, type Router as ExpressRouter } from 'express';
import PublicController from '../controllers/public.controller';
import { sanitizeInput } from '../middleware/validation';

const router: ExpressRouter = Router();

router.use(sanitizeInput);

router.get('/homepage-stats', PublicController.getHomepageStats);
router.get('/puerto-status', PublicController.getPuertoStatus);

export default router;

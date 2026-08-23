import { Router, type Router as ExpressRouter } from 'express';
import { rateLimit } from 'express-rate-limit';
import AvatarController from '../controllers/avatar.controller';
import {
  avatarUpload,
  validateUploadedFile,
  handleMulterError,
  validateCloudinaryConfig,
  uploadLimits,
} from '../middleware/uploadMiddleware';
import { generateDefaultAvatarValidation } from '../validators/avatarValidators';
import { authenticateToken, requireCONANP } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router: ExpressRouter = Router();

router.use(authenticateToken);

const avatarUploadLimit = rateLimit({
  windowMs: uploadLimits.windowMs,
  max: uploadLimits.max,
  message: uploadLimits.message,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/upload',
  validateCloudinaryConfig,
  avatarUploadLimit,
  avatarUpload.single('image'),
  handleMulterError,
  validateUploadedFile,
  AvatarController.uploadAvatar
);

router.delete('/', validateCloudinaryConfig, AvatarController.deleteAvatar);

router.post(
  '/generate-default',
  validateCloudinaryConfig,
  generateDefaultAvatarValidation,
  handleValidationErrors,
  AvatarController.generateDefaultAvatar
);

router.get('/info', AvatarController.getAvatarInfo);

router.get(
  '/stats',
  requireCONANP,
  validateCloudinaryConfig,
  AvatarController.getCloudinaryStats
);

export default router;

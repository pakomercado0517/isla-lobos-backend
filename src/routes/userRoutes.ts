import { Router, type Router as ExpressRouter } from 'express';
import UserController from '../controllers/user.controller';
import { authenticateToken, requireCONANP } from '../middleware/auth.middleware';
import { handleValidationErrors, sanitizeInput } from '../middleware/validation';
import {
  activateUserValidation,
  createUserValidation,
  deleteUserValidation,
  getAllUsersValidation,
  getUserByIdValidation,
  getUserStatsValidation,
  hardDeleteUserValidation,
  updateProfileValidation,
  updateUserValidation,
} from '../validators/userValidators';

const router: ExpressRouter = Router();

router.use(sanitizeInput);
router.use(authenticateToken);

router.get(
  '/',
  requireCONANP,
  getAllUsersValidation,
  handleValidationErrors,
  UserController.getAllUsers
);

router.get(
  '/stats',
  requireCONANP,
  getUserStatsValidation,
  handleValidationErrors,
  UserController.getUserStats
);

router.put(
  '/profile/update',
  updateProfileValidation,
  handleValidationErrors,
  UserController.updateProfile
);

router.get(
  '/:userId',
  requireCONANP,
  getUserByIdValidation,
  handleValidationErrors,
  UserController.getUserById
);

router.post(
  '/',
  requireCONANP,
  createUserValidation,
  handleValidationErrors,
  UserController.createUser
);

router.put(
  '/:userId',
  requireCONANP,
  updateUserValidation,
  handleValidationErrors,
  UserController.updateUser
);

router.delete(
  '/:userId',
  requireCONANP,
  deleteUserValidation,
  handleValidationErrors,
  UserController.deleteUser
);

router.patch(
  '/:userId/activate',
  requireCONANP,
  activateUserValidation,
  handleValidationErrors,
  UserController.activateUser
);

router.delete(
  '/:userId/permanent',
  requireCONANP,
  hardDeleteUserValidation,
  handleValidationErrors,
  UserController.hardDeleteUser
);

export default router;

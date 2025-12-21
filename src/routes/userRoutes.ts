import { Router, type Router as ExpressRouter } from "express";
import UserController from "../controllers/userController";
import {
  authenticateToken,
  requireCONANP,
  requireRole as _requireRole,
} from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  getAllUsersValidation,
  getUserByIdValidation,
  createUserValidation,
  updateUserValidation,
  deleteUserValidation,
  activateUserValidation,
  updateProfileValidation,
  getUserStatsValidation,
  hardDeleteUserValidation,
} from "../validators/userValidators";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Rutas para gestión de usuarios (solo CONANP)
router.get(
  "/",
  requireCONANP,
  getAllUsersValidation,
  handleValidationErrors,
  UserController.getAllUsers
);

router.get(
  "/stats",
  requireCONANP,
  getUserStatsValidation,
  handleValidationErrors,
  UserController.getUserStats
);

router.get(
  "/:userId",
  requireCONANP,
  getUserByIdValidation,
  handleValidationErrors,
  UserController.getUserById
);

router.post(
  "/",
  requireCONANP,
  createUserValidation,
  handleValidationErrors,
  UserController.createUser
);

router.put(
  "/:userId",
  requireCONANP,
  updateUserValidation,
  handleValidationErrors,
  UserController.updateUser
);

router.delete(
  "/:userId",
  requireCONANP,
  deleteUserValidation,
  handleValidationErrors,
  UserController.deleteUser
);

router.patch(
  "/:userId/activate",
  requireCONANP,
  activateUserValidation,
  handleValidationErrors,
  UserController.activateUser
);

router.delete(
  "/:userId/permanent",
  requireCONANP,
  hardDeleteUserValidation,
  handleValidationErrors,
  UserController.hardDeleteUser
);

// Rutas para perfil personal (todos los usuarios autenticados)
router.put(
  "/profile/update",
  updateProfileValidation,
  handleValidationErrors,
  UserController.updateProfile
);

export default router;

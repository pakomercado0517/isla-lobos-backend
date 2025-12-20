import { Router, type Router as ExpressRouter } from "express";
import AuthController from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";
import {
  handleValidationErrors,
  sanitizeInput,
} from "../middleware/validation";
import {
  loginValidation,
  registerValidation,
  changePasswordValidation,
  verifyTokenValidation,
  refreshTokenValidation,
  logoutValidation,
  getProfileValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "../validators/authValidators";

const router: ExpressRouter = Router();

/**
 * Rutas de autenticación para el sistema Isla Lobos
 *
 * @route /api/auth
 */

// Middleware global para sanitizar entrada
router.use(sanitizeInput);

// Rutas públicas (no requieren autenticación)
router.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  AuthController.login
);

router.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  AuthController.register
);

// Rutas de recuperación de contraseña (públicas)
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  handleValidationErrors,
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordValidation,
  handleValidationErrors,
  AuthController.resetPassword
);

// Ruta pública para renovar token (NO requiere authenticateToken porque el access token estará expirado)
router.post(
  "/refresh",
  refreshTokenValidation,
  handleValidationErrors,
  AuthController.refreshToken
);

// Rutas protegidas (requieren autenticación)
router.get(
  "/verify",
  authenticateToken,
  verifyTokenValidation,
  handleValidationErrors,
  AuthController.verifyToken
);

router.post(
  "/logout",
  authenticateToken,
  logoutValidation,
  handleValidationErrors,
  AuthController.logout
);

router.put(
  "/change-password",
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  AuthController.changePassword
);

router.get(
  "/profile",
  authenticateToken,
  getProfileValidation,
  handleValidationErrors,
  AuthController.getProfile
);

export default router;

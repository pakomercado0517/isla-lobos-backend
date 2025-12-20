import { Router, type Router as ExpressRouter } from "express";
import PublicController from "../controllers/publicController";
import { sanitizeInput } from "../middleware/validation";

const router: ExpressRouter = Router();

// Middleware global para sanitizar entrada
// Solo sanitización, NO autenticación ni autorización
router.use(sanitizeInput);

/**
 * Rutas públicas - Sin autenticación requerida
 * 
 * Estas rutas están diseñadas para ser consumidas por:
 * - Página principal (homepage) del sitio web
 * - Aplicaciones cliente que necesiten información básica
 * - APIs de terceros autorizados
 * 
 * IMPORTANTE: No exponer información sensible
 */

// GET /api/public/homepage-stats
// Estadísticas completas para homepage
router.get("/homepage-stats", PublicController.getHomepageStats);

// GET /api/public/puerto-status  
// Solo estado del puerto (endpoint ultra-ligero)
router.get("/puerto-status", PublicController.getPuertoStatus);

export default router;
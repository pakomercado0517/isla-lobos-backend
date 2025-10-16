import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import bloqueRoutes from "./bloqueRoutes";
import embarcacionRoutes from "./embarcacionRoutes";
import salidaRoutes from "./salidaRoutes";
import climaRoutes from "./climaRoutes";
import dashboardRoutes from "./dashboardRoutes";
import invitacionRoutes from "./invitacionRoutes";
import brazaleteRoutes from "./brazaleteRoutes";
import notificacionRoutes from "./notificacionRoutes";
import emailRoutes from "./emailRoutes";
import avatarRoutes from "./avatarRoutes";

const router = Router();

/**
 * Rutas principales del sistema Isla Lobos
 *
 * Todas las rutas de la API están bajo el prefijo /api
 */

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de usuarios
router.use("/usuarios", userRoutes);

// Rutas de bloques
router.use("/bloques", bloqueRoutes);

// Rutas de embarcaciones
router.use("/embarcaciones", embarcacionRoutes);

// Rutas de salidas
router.use("/salidas", salidaRoutes);

// Rutas de clima
router.use("/clima", climaRoutes);

// Rutas de dashboard
router.use("/dashboard", dashboardRoutes);

// Rutas de invitaciones
router.use("/invitaciones", invitacionRoutes);

// Rutas de brazaletes
router.use("/brazaletes", brazaleteRoutes);

// Rutas de notificaciones (WhatsApp)
router.use("/notificaciones", notificacionRoutes);

// Rutas de emails
router.use("/emails", emailRoutes);

// Rutas de avatares
router.use("/avatars", avatarRoutes);

export default router;

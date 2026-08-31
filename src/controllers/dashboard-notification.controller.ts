import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  getContadorNotificacionesService,
  getNotificacionesService,
  marcarNotificacionLeidaService,
} from '../services/dashboard-notification.service';

/**
 * Controlador para gestionar notificaciones del dashboard
 * Solo usuarios CONANP pueden acceder
 */
class DashboardNotificationController {
  static obtenerNotificaciones = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getNotificacionesService(req.user!.id);
    res.status(200).json(response);
  });

  static obtenerContador = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getContadorNotificacionesService(req.user!.id);
    res.status(200).json(response);
  });

  static marcarComoLeida = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await marcarNotificacionLeidaService(req.params['id'] as string, req.user!.id);
    res.status(200).json(response);
  });
}

export default DashboardNotificationController;

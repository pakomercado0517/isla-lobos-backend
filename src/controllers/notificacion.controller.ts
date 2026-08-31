import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  enviarAlertaClimaService,
  enviarAlertaPermisosService,
  enviarNotificacionMasivaService,
  enviarNotificacionService,
  enviarPruebaService,
  getEstadoWhatsappService,
  getPlantillasService,
  verificarEstadoMensajeService,
} from '../services/notificacion.service';
import {
  EnviarAlertaClimaWhatsappBody,
  EnviarAlertaPermisosWhatsappBody,
  EnviarNotificacionBody,
  EnviarNotificacionMasivaBody,
  EnviarPruebaWhatsappBody,
} from '../types/notificacion.types';

class NotificacionController {
  static verificarEstado = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadoWhatsappService();
    res.status(200).json(response);
  });

  static enviarNotificacion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarNotificacionService(req.body as EnviarNotificacionBody);
    res.status(200).json(response);
  });

  static enviarNotificacionMasiva = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarNotificacionMasivaService(
      req.body as EnviarNotificacionMasivaBody
    );
    res.status(200).json(response);
  });

  static enviarAlertaClima = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarAlertaClimaService(req.body as EnviarAlertaClimaWhatsappBody);
    res.status(200).json(response);
  });

  static enviarAlertaPermisos = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarAlertaPermisosService(
      req.body as EnviarAlertaPermisosWhatsappBody
    );
    res.status(200).json(response);
  });

  static obtenerPlantillas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getPlantillasService();
    res.status(200).json(response);
  });

  static verificarEstadoMensaje = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await verificarEstadoMensajeService(req.params['messageSid'] as string);
    res.status(200).json(response);
  });

  static enviarPrueba = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarPruebaService(req.body as EnviarPruebaWhatsappBody);
    res.status(200).json(response);
  });
}

export default NotificacionController;

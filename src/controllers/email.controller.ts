import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  enviarAlertaClimaService,
  enviarAlertaPermisosService,
  enviarEmailMasivoService,
  enviarEmailService,
  enviarPruebaEmailService,
  getEstadoEmailService,
  getPlantillasEmailService,
} from '../services/email.service';
import {
  EnviarAlertaClimaBody,
  EnviarAlertaPermisosBody,
  EnviarEmailBody,
  EnviarEmailMasivoBody,
  EnviarPruebaBody,
} from '../types/email.types';

/**
 * Controlador para gestionar el envío de correos electrónicos
 * Solo usuarios CONANP pueden enviar emails masivos
 */
class EmailController {
  static verificarEstado = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getEstadoEmailService();
    res.status(200).json(response);
  });

  static enviarEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarEmailService(req.body as EnviarEmailBody);
    res.status(200).json(response);
  });

  static enviarEmailMasivo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarEmailMasivoService(req.body as EnviarEmailMasivoBody);
    res.status(200).json(response);
  });

  static enviarAlertaClima = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarAlertaClimaService(req.body as EnviarAlertaClimaBody);
    res.status(200).json(response);
  });

  static enviarAlertaPermisos = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarAlertaPermisosService(req.body as EnviarAlertaPermisosBody);
    res.status(200).json(response);
  });

  static obtenerPlantillas = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getPlantillasEmailService();
    res.status(200).json(response);
  });

  static enviarPrueba = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await enviarPruebaEmailService(req.body as EnviarPruebaBody);
    res.status(200).json(response);
  });
}

export default EmailController;

import { Router, type Router as ExpressRouter } from 'express';
import EmailController from '../controllers/email.controller';
import { authenticateToken, requireCONANP } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validation';
import {
  enviarAlertaClimaValidation,
  enviarAlertaPermisosValidation,
  enviarEmailMasivoValidation,
  enviarEmailValidation,
  enviarPruebaValidation,
} from '../validators/emailValidators';

const router: ExpressRouter = Router();

router.use(authenticateToken);
router.use(requireCONANP);

router.get('/estado', EmailController.verificarEstado);

router.post('/enviar', enviarEmailValidation, handleValidationErrors, EmailController.enviarEmail);

router.post(
  '/enviar-masivo',
  enviarEmailMasivoValidation,
  handleValidationErrors,
  EmailController.enviarEmailMasivo
);

router.post(
  '/alerta-clima',
  enviarAlertaClimaValidation,
  handleValidationErrors,
  EmailController.enviarAlertaClima
);

router.post(
  '/alerta-permisos',
  enviarAlertaPermisosValidation,
  handleValidationErrors,
  EmailController.enviarAlertaPermisos
);

router.get('/plantillas', EmailController.obtenerPlantillas);

router.post('/test', enviarPruebaValidation, handleValidationErrors, EmailController.enviarPrueba);

export default router;

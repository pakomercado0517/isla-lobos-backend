import { body, param, query } from 'express-validator';
import { DESTINOS, EstadoSalida } from '../types';
import { ALIAS_EN_PROGRESO } from '../types/salida.types';
import { getTodayMexico } from '../utils/dateUtils';

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HH_MM = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DESTINO_VALUES = Object.values(DESTINOS);
const ESTADO_VALUES = Object.values(EstadoSalida);
const ESTADOS_CON_ALIAS = [...ESTADO_VALUES, ALIAS_EN_PROGRESO];

const idParam = () => param('id').isUUID().withMessage('El ID debe ser un UUID válido');

const pageQuery = () =>
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0')
    .toInt()
    .default(1);

const limitQuery = () =>
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt()
    .default(10);

const fechaQuery = (campo: string, mensaje: string) =>
  query(campo).optional().matches(DATE_YYYY_MM_DD).withMessage(mensaje);

const estadoQuery = () =>
  query('estado')
    .optional()
    .isIn(ESTADOS_CON_ALIAS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS_CON_ALIAS.join(', ')}`);

const uuidQuery = (campo: string, mensaje: string) =>
  query(campo).optional().isUUID().withMessage(mensaje);

const assertFechaNoPasada = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('Fecha inválida');
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    throw new Error('Fecha inválida');
  }
  if (value < getTodayMexico()) {
    throw new Error('La fecha no puede ser en el pasado');
  }
  return true;
};

const fechaBody = (optional = false) => {
  const chain = optional ? body('fecha').optional() : body('fecha');
  return chain
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha debe tener formato YYYY-MM-DD')
    .custom(assertFechaNoPasada);
};

const destinoBody = (optional = false) => {
  const chain = optional
    ? body('destino').optional()
    : body('destino').notEmpty().withMessage('El destino es requerido');
  return chain
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`);
};

const bloqueIdBody = () =>
  body('bloque_id')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('El ID del bloque debe ser un UUID válido o null');
      }
      return true;
    })
    .withMessage('El ID del bloque debe ser un UUID válido o null');

const horaBody = () =>
  body('hora')
    .optional()
    .matches(TIME_HH_MM)
    .withMessage('La hora debe estar en formato HH:MM (24 horas)');

const observacionesBody = () =>
  body('observaciones')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Las observaciones no pueden exceder 500 caracteres')
    .trim();

const numeroPasajerosBody = (optional = false) => {
  const chain = optional ? body('numero_pasajeros').optional() : body('numero_pasajeros');
  return chain
    .isInt({ min: 1, max: 150 })
    .withMessage('El número de pasajeros debe ser un número entre 1 y 150')
    .toInt();
};

export const getAllSalidasValidation = [
  pageQuery(),
  limitQuery(),
  fechaQuery('fecha', 'La fecha debe tener formato YYYY-MM-DD'),
  estadoQuery(),
  uuidQuery('prestador_id', 'El ID del prestador debe ser un UUID válido'),
  uuidQuery('embarcacion_id', 'El ID de la embarcación debe ser un UUID válido'),
  uuidQuery('bloque_id', 'El ID del bloque debe ser un UUID válido'),
  fechaQuery('fecha_inicio', 'La fecha de inicio debe tener formato YYYY-MM-DD'),
  fechaQuery('fecha_fin', 'La fecha de fin debe tener formato YYYY-MM-DD'),
];

export const getSalidaByIdValidation = [idParam()];

export const createSalidaValidation = [
  destinoBody(),
  body('embarcacion_id').isUUID().withMessage('El ID de la embarcación debe ser un UUID válido'),
  fechaBody(),
  numeroPasajerosBody(),
  bloqueIdBody(),
  horaBody(),
  observacionesBody(),
  body().custom((_, { req }) => {
    const { destino, bloque_id, hora } = req.body as {
      destino?: string;
      bloque_id?: string | null;
      hora?: string;
    };

    if (bloque_id && !hora) return true;
    if (hora && !bloque_id) return true;
    if (!bloque_id && !hora) {
      throw new Error(
        `Debe proporcionar 'bloque_id' (si ${destino} usa bloques) o 'hora' (si no usa bloques)`
      );
    }
    throw new Error(
      `No puede proporcionar tanto 'bloque_id' como 'hora'. Use solo uno según la configuración del destino.`
    );
  }),
];

export const updateSalidaValidation = [
  idParam(),
  destinoBody(true),
  body('embarcacion_id')
    .optional()
    .isUUID()
    .withMessage('El ID de la embarcación debe ser un UUID válido'),
  bloqueIdBody(),
  horaBody(),
  fechaBody(true),
  numeroPasajerosBody(true),
  observacionesBody(),
  body('estado')
    .optional()
    .isIn(ESTADOS_CON_ALIAS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS_CON_ALIAS.join(', ')}`),
];

export const cancelarSalidaValidation = [
  idParam(),
  body('motivo_cancelacion')
    .optional()
    .isLength({ max: 500 })
    .withMessage('El motivo de cancelación no puede exceder 500 caracteres')
    .trim(),
];

export const getMisSalidasValidation = [
  pageQuery(),
  limitQuery(),
  fechaQuery('fecha', 'La fecha debe tener formato YYYY-MM-DD'),
  estadoQuery(),
  fechaQuery('fecha_inicio', 'La fecha de inicio debe tener formato YYYY-MM-DD'),
  fechaQuery('fecha_fin', 'La fecha de fin debe tener formato YYYY-MM-DD'),
];

export const getSalidaStatsValidation = [
  uuidQuery('prestador_id', 'El ID del prestador debe ser un UUID válido'),
  fechaQuery('fecha_inicio', 'La fecha de inicio debe tener formato YYYY-MM-DD'),
  fechaQuery('fecha_fin', 'La fecha de fin debe tener formato YYYY-MM-DD'),
];

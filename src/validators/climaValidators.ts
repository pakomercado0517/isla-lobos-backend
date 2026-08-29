import { body, param, query } from 'express-validator';
import { EstadoPuerto } from '../types';
import { getCurrentMexicoTime } from '../utils/dateUtils';

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const VISIBILIDAD = ['Excelente', 'Buena', 'Regular', 'Mala', 'Muy Mala'];
const VIENTO_DIRECCION = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const FUENTES = ['CONAGUA', 'NOAA', 'Capitanía de Puerto', 'Manual'];
const ESTADO_PUERTO = Object.values(EstadoPuerto);

const assertFechaHoraVentana = (value: string) => {
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha inválida');
  const ahora = getCurrentMexicoTime();
  const unDiaAtras = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  if (fecha > ahora) throw new Error('La fecha no puede ser en el futuro');
  if (fecha < unDiaAtras) throw new Error('La fecha no puede ser más de 24 horas en el pasado');
};

export const getAllCondicionesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero mayor a 0')
    .toInt()
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100')
    .toInt()
    .default(10),

  query('fecha_inicio')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de inicio debe tener formato YYYY-MM-DD'),

  query('fecha_fin')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de fin debe tener formato YYYY-MM-DD'),

  query('estado_puerto')
    .optional()
    .isIn(ESTADO_PUERTO)
    .withMessage(`El estado del puerto debe ser uno de: ${ESTADO_PUERTO.join(', ')}`),

  query('fuente')
    .optional()
    .isIn(FUENTES)
    .withMessage(`La fuente debe ser una de: ${FUENTES.join(', ')}`),
];

export const getCondicionByIdValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const createCondicionValidation = [
  body('fecha_hora')
    .isISO8601()
    .withMessage('La fecha y hora deben estar en formato ISO 8601')
    .custom((value) => {
      assertFechaHoraVentana(value);
      return true;
    }),

  body('oleaje')
    .isFloat({ min: 0, max: 10 })
    .withMessage('El oleaje debe ser un número entre 0 y 10 metros'),

  body('viento_velocidad')
    .isFloat({ min: 0, max: 100 })
    .withMessage('La velocidad del viento debe ser un número entre 0 y 100 km/h'),

  body('viento_direccion')
    .isIn(VIENTO_DIRECCION)
    .withMessage(`La dirección del viento debe ser una de: ${VIENTO_DIRECCION.join(', ')}`),

  body('visibilidad')
    .isIn(VISIBILIDAD)
    .withMessage(`La visibilidad debe ser una de: ${VISIBILIDAD.join(', ')}`),

  body('estado_puerto')
    .isIn(ESTADO_PUERTO)
    .withMessage(`El estado del puerto debe ser uno de: ${ESTADO_PUERTO.join(', ')}`),

  body('prediccion_5_dias')
    .notEmpty()
    .withMessage('La predicción a 5 días es obligatoria')
    .isLength({ max: 1000 })
    .withMessage('La predicción no puede exceder 1000 caracteres')
    .trim(),

  body('fuente')
    .isIn(FUENTES)
    .withMessage(`La fuente debe ser una de: ${FUENTES.join(', ')}`),
];

export const updateCondicionValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),

  body('fecha_hora')
    .optional()
    .isISO8601()
    .withMessage('La fecha y hora deben estar en formato ISO 8601')
    .custom((value) => {
      if (value) assertFechaHoraVentana(value);
      return true;
    }),

  body('oleaje')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('El oleaje debe ser un número entre 0 y 10 metros'),

  body('viento_velocidad')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La velocidad del viento debe ser un número entre 0 y 100 km/h'),

  body('viento_direccion')
    .optional()
    .isIn(VIENTO_DIRECCION)
    .withMessage(`La dirección del viento debe ser una de: ${VIENTO_DIRECCION.join(', ')}`),

  body('visibilidad')
    .optional()
    .isIn(VISIBILIDAD)
    .withMessage(`La visibilidad debe ser una de: ${VISIBILIDAD.join(', ')}`),

  body('estado_puerto')
    .optional()
    .isIn(ESTADO_PUERTO)
    .withMessage(`El estado del puerto debe ser uno de: ${ESTADO_PUERTO.join(', ')}`),

  body('prediccion_5_dias')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La predicción no puede exceder 1000 caracteres')
    .trim(),

  body('fuente')
    .optional()
    .isIn(FUENTES)
    .withMessage(`La fuente debe ser una de: ${FUENTES.join(', ')}`),
];

export const deleteCondicionValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const getPrediccionValidation = [
  query('dias')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('El número de días debe ser un número entre 1 y 30')
    .toInt()
    .default(5),
];

export const getEstadisticasValidation = [
  query('fecha_inicio')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de inicio debe tener formato YYYY-MM-DD'),

  query('fecha_fin')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de fin debe tener formato YYYY-MM-DD')
    .custom((value, { req }) => {
      const fechaInicio = req.query?.['fecha_inicio'];
      if (fechaInicio && value && String(value) < String(fechaInicio)) {
        throw new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio');
      }
      return true;
    }),
];

export const sincronizarSMNValidation = [
  body('horas_limite')
    .optional()
    .isInt({ min: 1, max: 48 })
    .withMessage('El límite de horas debe ser un número entero entre 1 y 48')
    .toInt()
    .default(24),

  body('solo_isla_lobos')
    .optional()
    .isBoolean()
    .withMessage('solo_isla_lobos debe ser un valor booleano')
    .toBoolean()
    .default(true),
];

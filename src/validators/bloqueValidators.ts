import { body, param, query } from 'express-validator';
import { DESTINOS, EstadoBloque } from '../types';
import { getTodayMexico } from '../utils/dateUtils';

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HH_MM = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DESTINO_VALUES = Object.values(DESTINOS);

const assertFechaNoPasada = (value: string, message: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error('Fecha inválida');
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    throw new Error('Fecha inválida');
  }
  const hoy = getTodayMexico();
  if (value < hoy) {
    throw new Error(message);
  }
};

const horaFinPosterior = (horaFin: string, horaInicio: string) => {
  const [horaInicioH = 0, horaInicioM = 0] = horaInicio.split(':').map(Number);
  const [horaFinH = 0, horaFinM = 0] = horaFin.split(':').map(Number);
  return horaFinH * 60 + horaFinM > horaInicioH * 60 + horaInicioM;
};

const nombreRules = (optional = false) => {
  const chain = optional ? body('nombre').optional() : body('nombre');
  return chain
    .trim()
    .notEmpty()
    .withMessage(optional ? 'El nombre no puede estar vacío' : 'El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage(
      'El nombre solo puede contener letras, números, espacios, guiones y guiones bajos'
    );
};

export const getAllBloquesValidation = [
  query('fecha')
    .notEmpty()
    .withMessage('La fecha es requerida para obtener bloques')
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha debe tener formato YYYY-MM-DD')
    .custom((value) => {
      const hoy = getTodayMexico();
      if (value < hoy) {
        throw new Error('No se pueden consultar bloques para fechas pasadas');
      }
      const hoyDate = new Date(`${hoy}T12:00:00`);
      const fechaDate = new Date(`${value}T12:00:00`);
      const diferenciaDias = Math.ceil(
        (fechaDate.getTime() - hoyDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diferenciaDias > 7) {
        throw new Error('No se pueden consultar bloques para más de 7 días en el futuro');
      }
      return true;
    }),

  query('destino')
    .optional()
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),
];

export const getBloqueByIdValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const createBloqueValidation = [
  nombreRules(false),

  body('hora_inicio')
    .trim()
    .notEmpty()
    .withMessage('La hora de inicio es requerida')
    .matches(TIME_HH_MM)
    .withMessage('La hora de inicio debe tener formato HH:MM (24 horas)'),

  body('hora_fin')
    .trim()
    .notEmpty()
    .withMessage('La hora de fin es requerida')
    .matches(TIME_HH_MM)
    .withMessage('La hora de fin debe tener formato HH:MM (24 horas)')
    .custom((value, { req }) => {
      if (!horaFinPosterior(value, req.body.hora_inicio)) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),

  body('capacidad_total')
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad total debe ser un número entre 1 y 1000'),

  body('fecha')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha debe tener formato YYYY-MM-DD')
    .custom((value) => {
      if (value) assertFechaNoPasada(value, 'No se puede crear un bloque para una fecha pasada');
      return true;
    }),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoBloque))
    .withMessage(`El estado debe ser uno de: ${Object.values(EstadoBloque).join(', ')}`),

  body('destino')
    .notEmpty()
    .withMessage('El destino es requerido')
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),

  body('es_plantilla')
    .optional()
    .isBoolean()
    .withMessage('es_plantilla debe ser un valor booleano (true o false)'),

  body().custom((_, { req }) => {
    const { fecha, es_plantilla } = req.body;
    if (es_plantilla !== undefined) {
      if (!fecha && es_plantilla === false) {
        throw new Error('Los bloques sin fecha deben tener es_plantilla como true');
      }
      if (fecha && es_plantilla === true) {
        throw new Error('Los bloques con fecha deben tener es_plantilla como false');
      }
    }
    return true;
  }),
];

export const updateBloqueValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
  nombreRules(true),

  body('hora_inicio')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La hora de inicio no puede estar vacía')
    .matches(TIME_HH_MM)
    .withMessage('La hora de inicio debe tener formato HH:MM (24 horas)'),

  body('hora_fin')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La hora de fin no puede estar vacía')
    .matches(TIME_HH_MM)
    .withMessage('La hora de fin debe tener formato HH:MM (24 horas)')
    .custom((value, { req }) => {
      if (req.body.hora_inicio && !horaFinPosterior(value, req.body.hora_inicio)) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio');
      }
      return true;
    }),

  body('capacidad_total')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad total debe ser un número entre 1 y 1000'),

  body('fecha')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha debe tener formato YYYY-MM-DD')
    .custom((value) => {
      if (value) assertFechaNoPasada(value, 'No se puede cambiar un bloque a una fecha pasada');
      return true;
    }),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoBloque))
    .withMessage(`El estado debe ser uno de: ${Object.values(EstadoBloque).join(', ')}`),

  body('destino')
    .optional()
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),

  body('es_plantilla')
    .optional()
    .isBoolean()
    .withMessage('es_plantilla debe ser un valor booleano (true o false)'),
];

export const deleteBloqueValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const getBloqueStatsValidation = [
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
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
];

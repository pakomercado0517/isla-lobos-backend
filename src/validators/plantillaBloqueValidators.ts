import { body, param, query } from 'express-validator';
import { DESTINOS } from '../types';

const TIME_HH_MM = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const DESTINO_VALUES = Object.values(DESTINOS);

const horaFinPosterior = (horaFin: string, horaInicio: string): boolean => {
  const [horaInicioH = 0, horaInicioM = 0] = horaInicio.split(':').map(Number);
  const [horaFinH = 0, horaFinM = 0] = horaFin.split(':').map(Number);
  return horaFinH * 60 + horaFinM > horaInicioH * 60 + horaInicioM;
};

const idParam = () => param('id').isUUID().withMessage('El ID debe ser un UUID válido');

export const getAllPlantillasValidation = [
  query('destino')
    .optional()
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),

  query('activa')
    .optional()
    .isBoolean()
    .withMessage('El campo activa debe ser verdadero o falso')
    .toBoolean(),
];

export const getPlantillaByIdValidation = [idParam()];

export const getEstadisticasPlantillaValidation = [idParam()];

export const createPlantillaValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('hora_inicio')
    .notEmpty()
    .withMessage('La hora de inicio es obligatoria')
    .matches(TIME_HH_MM)
    .withMessage('La hora de inicio debe tener formato HH:MM'),

  body('hora_fin')
    .notEmpty()
    .withMessage('La hora de fin es obligatoria')
    .matches(TIME_HH_MM)
    .withMessage('La hora de fin debe tener formato HH:MM')
    .custom((value, { req }) => {
      if (!horaFinPosterior(value, req.body.hora_inicio)) {
        throw new Error('La hora de fin debe ser mayor que la hora de inicio');
      }
      return true;
    }),

  body('capacidad_total')
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad total debe ser un número entre 1 y 1000')
    .toInt(),

  body('destino')
    .trim()
    .notEmpty()
    .withMessage('El destino es obligatorio')
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),

  body('activa')
    .optional()
    .isBoolean()
    .withMessage('El campo activa debe ser verdadero o falso')
    .toBoolean(),
];

export const updatePlantillaValidation = [
  idParam(),

  body('nombre')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('hora_inicio')
    .optional()
    .matches(TIME_HH_MM)
    .withMessage('La hora de inicio debe tener formato HH:MM'),

  body('hora_fin')
    .optional()
    .matches(TIME_HH_MM)
    .withMessage('La hora de fin debe tener formato HH:MM')
    .custom((value, { req }) => {
      const horaInicio = req.body.hora_inicio;
      if (horaInicio && !horaFinPosterior(value, horaInicio)) {
        throw new Error('La hora de fin debe ser mayor que la hora de inicio');
      }
      return true;
    }),

  body('capacidad_total')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('La capacidad total debe ser un número entre 1 y 1000')
    .toInt(),

  body('destino')
    .optional()
    .trim()
    .isIn(DESTINO_VALUES)
    .withMessage(`El destino debe ser uno de: ${DESTINO_VALUES.join(', ')}`),

  body('activa')
    .optional()
    .isBoolean()
    .withMessage('El campo activa debe ser verdadero o falso')
    .toBoolean(),
];

export const deletePlantillaValidation = [idParam()];

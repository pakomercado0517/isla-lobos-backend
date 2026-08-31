import { body, param, query } from 'express-validator';
import { UserRole } from '../types';
import { getTodayMexico } from '../utils/dateUtils';

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const CODIGO_INVITACION = /^[A-Z0-9]+$/;

const isValidYmd = (value: string): boolean => {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
};

const assertFechaExpiracionFutura = (value: string) => {
  if (!isValidYmd(value)) throw new Error('Fecha inválida');
  if (value <= getTodayMexico()) {
    throw new Error('La fecha de expiración debe ser futura');
  }
};

const codigoChain = (ubicacion: 'body' | 'param') => {
  const campo = ubicacion === 'body' ? body('codigo') : param('codigo');
  return campo
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ min: 8, max: 20 })
    .withMessage('El código debe tener entre 8 y 20 caracteres')
    .matches(CODIGO_INVITACION)
    .withMessage('El código solo puede contener letras mayúsculas y números');
};

export const getAllInvitacionesValidation = [
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

  query('usada')
    .optional()
    .isBoolean()
    .withMessage("El parámetro 'usada' debe ser un valor booleano")
    .toBoolean(),

  query('creada_por').optional().isUUID().withMessage('El ID del creador debe ser un UUID válido'),
];

export const getInvitacionByIdValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const createInvitacionValidation = [
  codigoChain('body'),
  body('email').optional().isEmail().withMessage('Debe ser un email válido').normalizeEmail(),
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('rol')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`El rol debe ser uno de: ${Object.values(UserRole).join(', ')}`),
  body('fecha_expiracion')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de expiración debe tener formato YYYY-MM-DD')
    .custom(assertFechaExpiracionFutura),
];

export const updateInvitacionValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
  body('fecha_expiracion')
    .optional()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de expiración debe tener formato YYYY-MM-DD')
    .custom(assertFechaExpiracionFutura),
];

export const deleteInvitacionValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
];

export const validarCodigoValidation = [codigoChain('body')];

export const validarCodigoPorGetValidation = [codigoChain('param')];

export const usarInvitacionValidation = [
  param('id').isUUID().withMessage('El ID debe ser un UUID válido'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail()
    .withMessage('Formato de email inválido'),
];

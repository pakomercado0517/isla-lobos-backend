import { body, param, query } from 'express-validator';
import { UserRole } from '../types';

const ROL_VALUES = Object.values(UserRole);
const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;
const TELEFONO_MX = /^(\+52\s?)?[0-9]{10}$/;
const NOMBRE_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const PASSWORD_FUERTE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

const userIdParam = () =>
  param('userId').isUUID().withMessage('El ID del usuario debe ser un UUID válido');

const nombreBody = (optional = false) => {
  const chain = optional ? body('nombre').optional() : body('nombre');
  return chain
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(NOMBRE_LETRAS)
    .withMessage('El nombre solo puede contener letras y espacios');
};

const emailBody = (optional = false) => {
  const chain = optional ? body('email').optional() : body('email');
  return chain
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('El email no puede exceder 255 caracteres');
};

const telefonoBody = () =>
  body('telefono')
    .optional()
    .trim()
    .matches(TELEFONO_MX)
    .withMessage('El teléfono debe ser un número mexicano válido (10 dígitos)');

const rolBody = (optional = false) => {
  const chain = optional ? body('rol').optional() : body('rol');
  return chain.isIn(ROL_VALUES).withMessage(`El rol debe ser uno de: ${ROL_VALUES.join(', ')}`);
};

const activoBody = () =>
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false')
    .toBoolean();

const fechaVencimientoBody = () =>
  body('fechaVencimientoPermiso')
    .optional()
    .isString()
    .matches(DATE_YYYY_MM_DD)
    .withMessage('La fecha de vencimiento debe tener el formato YYYY-MM-DD');

const diasNotificacionBody = (withDefault = false) => {
  const chain = body('diasNotificacion')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Los días de notificación deben ser un número entre 1 y 365')
    .toInt();
  return withDefault ? chain.default(30) : chain;
};

export const getAllUsersValidation = [
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
  query('rol')
    .optional()
    .isIn(ROL_VALUES)
    .withMessage(`El rol debe ser uno de: ${ROL_VALUES.join(', ')}`),
  query('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser true o false')
    .toBoolean(),
];

export const getUserByIdValidation = [userIdParam()];

export const createUserValidation = [
  nombreBody(),
  emailBody(),
  telefonoBody(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
    .matches(PASSWORD_FUERTE)
    .withMessage(
      'La contraseña debe contener al menos una minúscula, una mayúscula, un número y un carácter especial'
    ),
  rolBody(),
  activoBody(),
  fechaVencimientoBody(),
  diasNotificacionBody(true),
];

export const updateUserValidation = [
  userIdParam(),
  nombreBody(true),
  emailBody(true),
  telefonoBody(),
  rolBody(true),
  activoBody(),
  fechaVencimientoBody(),
  diasNotificacionBody(),
];

export const deleteUserValidation = [userIdParam()];

export const activateUserValidation = [userIdParam()];

export const updateProfileValidation = [
  nombreBody(true),
  telefonoBody(),
  body('avatar_url')
    .optional()
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
    })
    .withMessage('La URL del avatar debe ser una URL válida con protocolo http o https')
    .isLength({ max: 500 })
    .withMessage('La URL del avatar no puede exceder 500 caracteres'),
];

export const getUserStatsValidation: [] = [];

export const hardDeleteUserValidation = [
  userIdParam(),
  body('confirmacion')
    .notEmpty()
    .withMessage('El campo confirmacion es requerido')
    .equals('ELIMINAR PERMANENTEMENTE')
    .withMessage(
      "Debe confirmar la eliminación permanente escribiendo 'ELIMINAR PERMANENTEMENTE'"
    ),
];

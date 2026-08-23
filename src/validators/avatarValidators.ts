import { body } from 'express-validator';

const SAFE_BACKGROUND_COLORS = [
  '4f46e5',
  '059669',
  'dc2626',
  '7c3aed',
  'ea580c',
  '0891b2',
  'be123c',
  '65a30d',
  'c2410c',
  '1e40af',
  '374151',
  '92400e',
];

const SAFE_TEXT_COLORS = ['ffffff', '000000', 'f3f4f6', '111827'];

const hexColorRules = (field: 'backgroundColor' | 'textColor', allowed: string[]) => [
  body(field)
    .optional()
    .customSanitizer((value) => (value ? String(value).replace('#', '').toLowerCase() : value))
    .matches(/^[0-9a-f]{6}$/)
    .withMessage(`El ${field} debe ser un color hexadecimal de 6 caracteres`)
    .custom((value) => {
      if (!value) return true;
      if (!allowed.includes(value)) {
        throw new Error(`Color no permitido. Valores válidos: ${allowed.join(', ')}`);
      }
      return true;
    }),
];

export const generateDefaultAvatarValidation = [
  ...hexColorRules('backgroundColor', SAFE_BACKGROUND_COLORS),
  ...hexColorRules('textColor', SAFE_TEXT_COLORS),
];

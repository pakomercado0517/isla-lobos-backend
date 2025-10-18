/**
 * Utilidades para manejo de fechas con zona horaria de México
 * 
 * ESTRATEGIA MEJORADA:
 * - Base de datos almacena en UTC
 * - Conversiones precisas usando date-fns
 * - API mantiene formato YYYY-MM-DD para compatibilidad
 * - Manejo automático de horario de verano
 */

import { parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

// Zona horaria de México
export const MEXICO_TIMEZONE = "America/Mexico_City";

/**
 * Obtiene la fecha y hora actual en zona horaria de México
 * MEJORADO: Usa date-fns para mayor precisión
 */
export const getCurrentMexicoTime = (): Date => {
  const now = new Date();
  return toZonedTime(now, MEXICO_TIMEZONE);
};

/**
 * Convierte una fecha a zona horaria de México
 * MEJORADO: Usa date-fns-tz para manejo preciso de zona horaria
 */
export const toMexicoTime = (date: Date): Date => {
  return toZonedTime(date, MEXICO_TIMEZONE);
};

/**
 * Crea una fecha en zona horaria de México
 */
export const createMexicoDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): Date => {
  const date = new Date();
  date.setFullYear(year, month - 1, day); // month es 0-indexado
  date.setHours(hour, minute, second, 0);
  return toMexicoTime(date);
};

/**
 * Formatea una fecha para mostrar en zona horaria de México
 */
export const formatMexicoDate = (
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: MEXICO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return date.toLocaleString("es-MX", { ...defaultOptions, ...options });
};

/**
 * Obtiene solo la fecha (sin hora) en zona horaria de México
 */
export const getMexicoDateOnly = (date: Date): string => {
  return formatMexicoDate(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Obtiene solo la hora en zona horaria de México
 */
export const getMexicoTimeOnly = (date: Date): string => {
  return formatMexicoDate(date, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

/**
 * Verifica si una fecha está en el rango de horario de operación (6:00 AM - 6:00 PM)
 */
export const isWithinOperatingHours = (date: Date): boolean => {
  const mexicoTime = toMexicoTime(date);
  const hour = mexicoTime.getHours();
  return hour >= 6 && hour < 18;
};

/**
 * Obtiene el inicio del día en zona horaria de México
 */
export const getStartOfDayMexico = (date: Date): Date => {
  const mexicoTime = toMexicoTime(date);
  return createMexicoDate(
    mexicoTime.getFullYear(),
    mexicoTime.getMonth() + 1,
    mexicoTime.getDate(),
    0,
    0,
    0
  );
};

/**
 * Obtiene el final del día en zona horaria de México
 */
export const getEndOfDayMexico = (date: Date): Date => {
  const mexicoTime = toMexicoTime(date);
  return createMexicoDate(
    mexicoTime.getFullYear(),
    mexicoTime.getMonth() + 1,
    mexicoTime.getDate(),
    23,
    59,
    59
  );
};

/**
 * Calcula la diferencia en horas entre dos fechas
 */
export const getHoursDifference = (date1: Date, date2: Date): number => {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60));
};

/**
 * Verifica si una fecha es hoy en zona horaria de México
 */
export const isTodayMexico = (date: Date): boolean => {
  const today = getCurrentMexicoTime();
  const mexicoDate = toMexicoTime(date);

  return (
    today.getFullYear() === mexicoDate.getFullYear() &&
    today.getMonth() === mexicoDate.getMonth() &&
    today.getDate() === mexicoDate.getDate()
  );
};

/**
 * Verifica si una fecha es mañana en zona horaria de México
 */
export const isTomorrowMexico = (date: Date): boolean => {
  const tomorrow = new Date(getCurrentMexicoTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const mexicoDate = toMexicoTime(date);

  return (
    tomorrow.getFullYear() === mexicoDate.getFullYear() &&
    tomorrow.getMonth() === mexicoDate.getMonth() &&
    tomorrow.getDate() === mexicoDate.getDate()
  );
};

/**
 * Obtiene el nombre del día de la semana en español
 */
export const getDayNameMexico = (date: Date): string => {
  const mexicoTime = toMexicoTime(date);
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[mexicoTime.getDay()] || "Día desconocido";
};

/**
 * Obtiene el nombre del mes en español
 */
export const getMonthNameMexico = (date: Date): string => {
  const mexicoTime = toMexicoTime(date);
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[mexicoTime.getMonth()] || "Mes desconocido";
};

// ============================================================================
// FUNCIONES PARA COMPATIBILIDAD CON CONTROLADORES EXISTENTES
// ============================================================================

/**
 * Extrae solo la fecha (YYYY-MM-DD) de cualquier input de fecha
 * CON CONVERSIÓN de zona horaria a México
 * Úsalo cuando necesites la fecha en zona horaria de México
 */
export const extraerSoloFecha = (fecha: Date | string | null | undefined): string | null | undefined => {
  if (!fecha) return fecha as null | undefined;
  
  try {
    let dateObj: Date;
    
    if (typeof fecha === 'string') {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      // Si es ISO string, parsearlo
      dateObj = parseISO(fecha);
    } else {
      dateObj = fecha;
    }
    
    // Convertir a zona horaria de México y extraer solo fecha
    return formatInTimeZone(dateObj, MEXICO_TIMEZONE, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error al extraer fecha:', error);
    return null;
  }
};

/**
 * Extrae solo la fecha (YYYY-MM-DD) SIN conversión de zona horaria
 * Úsalo para validaciones donde necesitas la fecha "cruda" como se almacenó
 * Ejemplo: 2025-10-18T00:00:00.000Z → "2025-10-18"
 */
export const extraerSoloFechaUTC = (fecha: Date | string | null | undefined): string | null | undefined => {
  if (!fecha) return fecha as null | undefined;
  
  try {
    let fechaString: string;
    
    if (typeof fecha === 'string') {
      // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
      if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return fecha;
      }
      fechaString = fecha;
    } else {
      fechaString = fecha.toISOString();
    }
    
    // Extraer solo la parte de fecha sin conversión de zona horaria
    const partes = fechaString.split("T");
    return partes[0] || fechaString.substring(0, 10);
  } catch (error) {
    console.error('Error al extraer fecha UTC:', error);
    return null;
  }
};

/**
 * Convierte fecha del frontend (YYYY-MM-DD) a UTC para almacenamiento
 * Asume que la fecha viene en zona horaria de México
 */
export const parseFromFrontend = (dateString: string): Date => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
  }
  
  // Crear fecha en medianoche de zona horaria de México
  const mexicoDate = new Date(`${dateString}T00:00:00`);
  return fromZonedTime(mexicoDate, MEXICO_TIMEZONE);
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD en zona horaria de México
 */
export const getTodayMexico = (): string => {
  const now = new Date();
  return formatInTimeZone(now, MEXICO_TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Valida si una fecha está en el rango permitido para operaciones
 */
export const isValidDateRange = (dateString: string, daysBack: number = 30, daysForward: number = 365): boolean => {
  try {
    const inputDate = parseFromFrontend(dateString);
    const now = new Date();
    const pastLimit = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    const futureLimit = new Date(now.getTime() + (daysForward * 24 * 60 * 60 * 1000));
    
    return inputDate >= pastLimit && inputDate <= futureLimit;
  } catch {
    return false;
  }
};

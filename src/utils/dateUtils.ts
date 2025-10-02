/**
 * Utilidades para manejo de fechas con zona horaria de México
 * Importante: La base de datos está en Virginia, USA, pero el proyecto es para Veracruz, México
 */

// Zona horaria de México
export const MEXICO_TIMEZONE = "America/Mexico_City";

/**
 * Obtiene la fecha y hora actual en zona horaria de México
 */
export const getCurrentMexicoTime = (): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: MEXICO_TIMEZONE })
  );
};

/**
 * Convierte una fecha a zona horaria de México
 */
export const toMexicoTime = (date: Date): Date => {
  return new Date(date.toLocaleString("en-US", { timeZone: MEXICO_TIMEZONE }));
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

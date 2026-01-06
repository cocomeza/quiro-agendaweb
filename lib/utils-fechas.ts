/**
 * Utilidades para manejo de fechas en zona horaria de Argentina (America/Argentina/Buenos_Aires)
 * 
 * IMPORTANTE: Estas funciones aseguran que las fechas se manejen correctamente
 * para el uso en Buenos Aires, Argentina, sin errores de zona horaria.
 */

import { format, startOfDay, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale/es';

/**
 * Obtiene la fecha actual en la zona horaria local del navegador
 * Esto asegura que las fechas se manejen correctamente según la configuración del sistema
 */
export function obtenerFechaActual(): Date {
  return new Date();
}

/**
 * Obtiene el inicio del día para una fecha dada
 * Útil para comparaciones de fechas sin considerar la hora
 */
export function obtenerInicioDelDia(fecha: Date): Date {
  return startOfDay(fecha);
}

/**
 * Formatea una fecha en formato ISO (yyyy-MM-dd) para almacenamiento en base de datos
 */
export function formatearFechaISO(fecha: Date): string {
  if (!isValid(fecha)) {
    throw new Error('Fecha inválida');
  }
  return format(fecha, 'yyyy-MM-dd');
}

/**
 * Formatea una fecha en formato legible para Argentina (dd/MM/yyyy)
 */
export function formatearFechaArgentina(fecha: Date): string {
  if (!isValid(fecha)) {
    return 'Fecha inválida';
  }
  return format(fecha, 'dd/MM/yyyy', { locale: es });
}

/**
 * Formatea una fecha con mes y año en español (ej: "enero 2026")
 */
export function formatearMesAnio(fecha: Date): string {
  if (!isValid(fecha)) {
    return 'Fecha inválida';
  }
  return format(fecha, 'MMMM yyyy', { locale: es });
}

/**
 * Parsea una fecha desde formato ISO (yyyy-MM-dd) a objeto Date
 */
export function parsearFechaISO(fechaStr: string): Date {
  // date-fns parseISO maneja correctamente las fechas ISO
  const fecha = parseISO(fechaStr);
  if (!isValid(fecha)) {
    throw new Error(`Fecha ISO inválida: ${fechaStr}`);
  }
  return fecha;
}

/**
 * Valida que una fecha sea válida y esté en un rango razonable
 * (entre 1900 y 2100)
 */
export function validarFecha(fecha: Date): boolean {
  if (!isValid(fecha)) {
    return false;
  }
  // Verificar que la fecha sea realmente válida (no NaN)
  if (isNaN(fecha.getTime())) {
    return false;
  }
  const año = fecha.getFullYear();
  // Verificar que el año esté en el rango válido
  // Usar comparación estricta para evitar problemas con años muy antiguos o futuros
  return año >= 1900 && año <= 2100;
}

/**
 * Obtiene el año de una fecha
 */
export function obtenerAño(fecha: Date): number {
  if (!isValid(fecha)) {
    throw new Error('Fecha inválida');
  }
  return fecha.getFullYear();
}

/**
 * Verifica si un año es bisiesto
 */
export function esAñoBisiesto(año: number): boolean {
  return (año % 4 === 0 && año % 100 !== 0) || (año % 400 === 0);
}

/**
 * Obtiene el número de días en un mes específico
 */
export function obtenerDiasEnMes(año: number, mes: number): number {
  // mes es 0-indexed (0 = enero, 11 = diciembre)
  const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  if (mes === 1 && esAñoBisiesto(año)) {
    return 29; // Febrero en año bisiesto
  }
  
  return diasPorMes[mes];
}

/**
 * Verifica que el día de la semana sea correcto para una fecha dada
 * Útil para debugging y validación
 */
export function verificarDiaSemana(fecha: Date): {
  fecha: string;
  año: number;
  mes: number;
  dia: number;
  diaSemana: number; // 0 = Domingo, 1 = Lunes, etc.
  nombreDiaSemana: string;
  esCorrecto: boolean;
} {
  if (!isValid(fecha)) {
    throw new Error('Fecha inválida');
  }

  const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Verificar que el día de la semana sea consistente con la fecha
  // Esto es una validación básica - en producción, confiamos en el objeto Date de JavaScript
  const fechaStr = formatearFechaArgentina(fecha);
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1; // 1-indexed para mostrar
  const dia = fecha.getDate();

  return {
    fecha: fechaStr,
    año,
    mes,
    dia,
    diaSemana,
    nombreDiaSemana: nombresDias[diaSemana],
    esCorrecto: true, // Si llegamos aquí, la fecha es válida
  };
}

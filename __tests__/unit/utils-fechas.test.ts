import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  obtenerFechaActual,
  obtenerInicioDelDia,
  formatearFechaISO,
  formatearFechaArgentina,
  formatearMesAnio,
  parsearFechaISO,
  validarFecha,
  obtenerAño,
  esAñoBisiesto,
  obtenerDiasEnMes,
  verificarDiaSemana,
} from '@/lib/utils-fechas';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';

describe('Utilidades de Fechas', () => {
  describe('obtenerFechaActual', () => {
    it('debe retornar una fecha válida', () => {
      const fecha = obtenerFechaActual();
      expect(fecha).toBeInstanceOf(Date);
      expect(fecha.getTime()).toBeGreaterThan(0);
    });

    it('debe retornar una fecha reciente', () => {
      const fecha = obtenerFechaActual();
      const ahora = new Date();
      const diferencia = Math.abs(ahora.getTime() - fecha.getTime());
      // Debe ser muy reciente (menos de 1 segundo de diferencia)
      expect(diferencia).toBeLessThan(1000);
    });
  });

  describe('obtenerInicioDelDia', () => {
    it('debe retornar el inicio del día para una fecha', () => {
      const fecha = new Date('2026-01-15T14:30:00');
      const inicio = obtenerInicioDelDia(fecha);
      
      expect(inicio.getHours()).toBe(0);
      expect(inicio.getMinutes()).toBe(0);
      expect(inicio.getSeconds()).toBe(0);
      expect(inicio.getMilliseconds()).toBe(0);
    });

    it('debe mantener la misma fecha pero a las 00:00:00', () => {
      const fecha = new Date('2026-01-15T23:59:59');
      const inicio = obtenerInicioDelDia(fecha);
      
      expect(inicio.getDate()).toBe(15);
      expect(inicio.getMonth()).toBe(0); // Enero es 0
      expect(inicio.getFullYear()).toBe(2026);
    });
  });

  describe('formatearFechaISO', () => {
    it('debe formatear fecha en formato ISO (yyyy-MM-dd)', () => {
      // Usar fecha local para evitar problemas de zona horaria
      const fecha = new Date(2026, 0, 15); // 15 de enero de 2026
      const resultado = formatearFechaISO(fecha);
      
      expect(resultado).toBe('2026-01-15');
      expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('debe manejar fechas de diferentes años', () => {
      expect(formatearFechaISO(new Date(2026, 0, 15))).toBe('2026-01-15');
      expect(formatearFechaISO(new Date(2027, 11, 31))).toBe('2027-12-31');
      expect(formatearFechaISO(new Date(2028, 1, 29))).toBe('2028-02-29');
    });

    it('debe lanzar error para fecha inválida', () => {
      const fechaInvalida = new Date('invalid');
      expect(() => formatearFechaISO(fechaInvalida)).toThrow();
    });
  });

  describe('formatearFechaArgentina', () => {
    it('debe formatear fecha en formato argentino (dd/MM/yyyy)', () => {
      // Usar fecha local para evitar problemas de zona horaria
      const fecha = new Date(2026, 0, 15); // 15 de enero de 2026
      const resultado = formatearFechaArgentina(fecha);
      
      expect(resultado).toBe('15/01/2026');
    });

    it('debe manejar diferentes meses y años', () => {
      expect(formatearFechaArgentina(new Date(2026, 0, 5))).toBe('05/01/2026');
      expect(formatearFechaArgentina(new Date(2026, 11, 31))).toBe('31/12/2026');
      expect(formatearFechaArgentina(new Date(2027, 5, 15))).toBe('15/06/2027');
    });

    it('debe retornar "Fecha inválida" para fecha inválida', () => {
      const fechaInvalida = new Date('invalid');
      expect(formatearFechaArgentina(fechaInvalida)).toBe('Fecha inválida');
    });
  });

  describe('formatearMesAnio', () => {
    it('debe formatear mes y año en español', () => {
      const fecha = new Date('2026-01-15');
      const resultado = formatearMesAnio(fecha);
      
      expect(resultado).toContain('enero');
      expect(resultado).toContain('2026');
    });

    it('debe manejar diferentes meses', () => {
      expect(formatearMesAnio(new Date('2026-01-15'))).toContain('enero');
      expect(formatearMesAnio(new Date('2026-06-15'))).toContain('junio');
      expect(formatearMesAnio(new Date('2026-12-15'))).toContain('diciembre');
    });

    it('debe mostrar el año correcto', () => {
      expect(formatearMesAnio(new Date('2026-01-15'))).toContain('2026');
      expect(formatearMesAnio(new Date('2027-01-15'))).toContain('2027');
      expect(formatearMesAnio(new Date('2028-01-15'))).toContain('2028');
    });
  });

  describe('parsearFechaISO', () => {
    it('debe parsear fecha ISO correctamente', () => {
      const fechaStr = '2026-01-15';
      const fecha = parsearFechaISO(fechaStr);
      
      expect(fecha.getFullYear()).toBe(2026);
      expect(fecha.getMonth()).toBe(0); // Enero es 0
      expect(fecha.getDate()).toBe(15);
    });

    it('debe manejar diferentes fechas', () => {
      const fecha1 = parsearFechaISO('2026-12-31');
      expect(fecha1.getFullYear()).toBe(2026);
      expect(fecha1.getMonth()).toBe(11); // Diciembre es 11
      expect(fecha1.getDate()).toBe(31);

      const fecha2 = parsearFechaISO('2027-06-15');
      expect(fecha2.getFullYear()).toBe(2027);
      expect(fecha2.getMonth()).toBe(5); // Junio es 5
      expect(fecha2.getDate()).toBe(15);
    });

    it('debe lanzar error para fecha ISO inválida', () => {
      expect(() => parsearFechaISO('invalid-date')).toThrow();
    });
  });

  describe('validarFecha', () => {
    it('debe retornar true para fechas válidas en rango', () => {
      expect(validarFecha(new Date(2026, 0, 15))).toBe(true);
      expect(validarFecha(new Date(2027, 5, 15))).toBe(true);
      expect(validarFecha(new Date(2028, 11, 31))).toBe(true);
    });

    it('debe retornar false para fechas fuera de rango', () => {
      // Crear fechas que definitivamente estén fuera del rango
      const fechaAntigua = new Date(1899, 0, 1);
      fechaAntigua.setFullYear(1899);
      expect(validarFecha(fechaAntigua)).toBe(false);
      
      const fechaFutura = new Date(2101, 0, 1);
      fechaFutura.setFullYear(2101);
      expect(validarFecha(fechaFutura)).toBe(false);
    });

    it('debe retornar false para fechas inválidas', () => {
      expect(validarFecha(new Date('invalid'))).toBe(false);
    });

    it('debe aceptar fechas en los límites del rango', () => {
      expect(validarFecha(new Date(1900, 0, 1))).toBe(true);
      expect(validarFecha(new Date(2100, 11, 31))).toBe(true);
    });
  });

  describe('obtenerAño', () => {
    it('debe retornar el año correcto', () => {
      expect(obtenerAño(new Date('2026-01-15'))).toBe(2026);
      expect(obtenerAño(new Date('2027-06-15'))).toBe(2027);
      expect(obtenerAño(new Date('2028-12-31'))).toBe(2028);
    });

    it('debe lanzar error para fecha inválida', () => {
      expect(() => obtenerAño(new Date('invalid'))).toThrow();
    });
  });

  describe('esAñoBisiesto', () => {
    it('debe identificar años bisiestos correctamente', () => {
      expect(esAñoBisiesto(2024)).toBe(true);
      expect(esAñoBisiesto(2028)).toBe(true);
      expect(esAñoBisiesto(2032)).toBe(true);
    });

    it('debe identificar años no bisiestos correctamente', () => {
      expect(esAñoBisiesto(2025)).toBe(false);
      expect(esAñoBisiesto(2026)).toBe(false);
      expect(esAñoBisiesto(2027)).toBe(false);
    });

    it('debe manejar años divisibles por 100 pero no por 400', () => {
      expect(esAñoBisiesto(1900)).toBe(false);
      expect(esAñoBisiesto(2100)).toBe(false);
    });

    it('debe manejar años divisibles por 400', () => {
      expect(esAñoBisiesto(2000)).toBe(true);
      expect(esAñoBisiesto(2400)).toBe(true);
    });
  });

  describe('obtenerDiasEnMes', () => {
    it('debe retornar días correctos para cada mes', () => {
      expect(obtenerDiasEnMes(2026, 0)).toBe(31); // Enero
      expect(obtenerDiasEnMes(2026, 1)).toBe(28); // Febrero (no bisiesto)
      expect(obtenerDiasEnMes(2026, 2)).toBe(31); // Marzo
      expect(obtenerDiasEnMes(2026, 3)).toBe(30); // Abril
      expect(obtenerDiasEnMes(2026, 4)).toBe(31); // Mayo
      expect(obtenerDiasEnMes(2026, 5)).toBe(30); // Junio
      expect(obtenerDiasEnMes(2026, 6)).toBe(31); // Julio
      expect(obtenerDiasEnMes(2026, 7)).toBe(31); // Agosto
      expect(obtenerDiasEnMes(2026, 8)).toBe(30); // Septiembre
      expect(obtenerDiasEnMes(2026, 9)).toBe(31); // Octubre
      expect(obtenerDiasEnMes(2026, 10)).toBe(30); // Noviembre
      expect(obtenerDiasEnMes(2026, 11)).toBe(31); // Diciembre
    });

    it('debe retornar 29 días para febrero en año bisiesto', () => {
      expect(obtenerDiasEnMes(2024, 1)).toBe(29); // Febrero 2024 (bisiesto)
      expect(obtenerDiasEnMes(2028, 1)).toBe(29); // Febrero 2028 (bisiesto)
    });

    it('debe retornar 28 días para febrero en año no bisiesto', () => {
      expect(obtenerDiasEnMes(2025, 1)).toBe(28); // Febrero 2025 (no bisiesto)
      expect(obtenerDiasEnMes(2026, 1)).toBe(28); // Febrero 2026 (no bisiesto)
      expect(obtenerDiasEnMes(2027, 1)).toBe(28); // Febrero 2027 (no bisiesto)
    });
  });

  describe('verificarDiaSemana', () => {
    it('debe verificar correctamente el día de la semana para fechas conocidas', () => {
      // Martes 6 de enero de 2026 (usar fecha local)
      const fecha = new Date(2026, 0, 6); // 6 de enero de 2026
      const resultado = verificarDiaSemana(fecha);
      
      expect(resultado.fecha).toBe('06/01/2026');
      expect(resultado.año).toBe(2026);
      expect(resultado.mes).toBe(1);
      expect(resultado.dia).toBe(6);
      expect(resultado.diaSemana).toBe(2); // Martes es 2 (0=Domingo, 1=Lunes, 2=Martes)
      expect(resultado.nombreDiaSemana).toBe('Martes');
      expect(resultado.esCorrecto).toBe(true);
    });

    it('debe identificar correctamente diferentes días de la semana', () => {
      // Domingo 4 de enero de 2026
      const domingo = new Date(2026, 0, 4); // Domingo
      expect(verificarDiaSemana(domingo).diaSemana).toBe(0);
      expect(verificarDiaSemana(domingo).nombreDiaSemana).toBe('Domingo');

      // Lunes 5 de enero de 2026
      const lunes = new Date(2026, 0, 5); // Lunes
      expect(verificarDiaSemana(lunes).diaSemana).toBe(1);
      expect(verificarDiaSemana(lunes).nombreDiaSemana).toBe('Lunes');

      // Martes 6 de enero de 2026
      const martes = new Date(2026, 0, 6); // Martes
      expect(verificarDiaSemana(martes).diaSemana).toBe(2);
      expect(verificarDiaSemana(martes).nombreDiaSemana).toBe('Martes');
    });

    it('debe lanzar error para fecha inválida', () => {
      expect(() => verificarDiaSemana(new Date('invalid'))).toThrow();
    });

    it('debe verificar fechas de diferentes años', () => {
      const fecha2026 = new Date('2026-06-15');
      const fecha2027 = new Date('2027-06-15');
      const fecha2028 = new Date('2028-06-15');

      expect(verificarDiaSemana(fecha2026).año).toBe(2026);
      expect(verificarDiaSemana(fecha2027).año).toBe(2027);
      expect(verificarDiaSemana(fecha2028).año).toBe(2028);
    });
  });

  describe('Casos específicos para 2026', () => {
    it('debe manejar correctamente enero 2026', () => {
      const fecha = new Date(2026, 0, 6); // Martes 6 de enero
      expect(obtenerAño(fecha)).toBe(2026);
      expect(formatearFechaISO(fecha)).toBe('2026-01-06');
      expect(formatearFechaArgentina(fecha)).toBe('06/01/2026');
      
      const verificacion = verificarDiaSemana(fecha);
      expect(verificacion.diaSemana).toBe(2); // Martes
      expect(verificacion.nombreDiaSemana).toBe('Martes');
    });

    it('debe manejar correctamente febrero 2026 (no bisiesto)', () => {
      expect(esAñoBisiesto(2026)).toBe(false);
      expect(obtenerDiasEnMes(2026, 1)).toBe(28); // Febrero tiene 28 días
    });

    it('debe manejar correctamente diciembre 2026', () => {
      const fecha = new Date(2026, 11, 31);
      expect(obtenerAño(fecha)).toBe(2026);
      expect(formatearFechaISO(fecha)).toBe('2026-12-31');
    });
  });

  describe('Casos específicos para años siguientes', () => {
    it('debe manejar correctamente 2027', () => {
      const fecha = new Date(2027, 5, 15);
      expect(obtenerAño(fecha)).toBe(2027);
      expect(validarFecha(fecha)).toBe(true);
    });

    it('debe manejar correctamente 2028 (año bisiesto)', () => {
      expect(esAñoBisiesto(2028)).toBe(true);
      expect(obtenerDiasEnMes(2028, 1)).toBe(29); // Febrero tiene 29 días
      
      const fecha = new Date(2028, 1, 29); // 29 de febrero de 2028
      expect(validarFecha(fecha)).toBe(true);
      expect(formatearFechaISO(fecha)).toBe('2028-02-29');
    });
  });
});

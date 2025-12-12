import { describe, it, expect } from 'vitest';
import {
  validarEmail,
  validarTelefono,
  normalizarTelefono,
  esErrorDeRed,
  obtenerMensajeError,
  validarFechaNoFutura,
  validarLongitud,
} from '@/lib/validaciones';

describe('validarEmail', () => {
  it('debe retornar true para email válido', () => {
    expect(validarEmail('test@example.com')).toBe(true);
  });

  it('debe retornar false para email inválido', () => {
    expect(validarEmail('invalid')).toBe(false);
  });

  it('debe retornar true para string vacío (opcional)', () => {
    expect(validarEmail('')).toBe(true);
  });
});

describe('validarTelefono', () => {
  it('debe retornar true para teléfono válido', () => {
    expect(validarTelefono('12345678')).toBe(true);
    expect(validarTelefono('(11) 1234-5678')).toBe(true);
  });

  it('debe retornar false para teléfono inválido', () => {
    expect(validarTelefono('1234567')).toBe(false);
  });

  it('debe retornar true para string vacío (opcional)', () => {
    expect(validarTelefono('')).toBe(true);
  });
});

describe('normalizarTelefono', () => {
  it('debe remover espacios, guiones y paréntesis', () => {
    expect(normalizarTelefono('(11) 1234-5678')).toBe('1112345678');
  });
});

describe('esErrorDeRed', () => {
  it('debe detectar errores de red', () => {
    expect(esErrorDeRed({ message: 'fetch failed' })).toBe(true);
  });

  it('debe retornar false para errores no relacionados con red', () => {
    expect(esErrorDeRed({ message: 'Invalid input' })).toBe(false);
  });
});

describe('obtenerMensajeError', () => {
  it('debe retornar mensaje para error de unique violation', () => {
    const error = { code: '23505' };
    const mensaje = obtenerMensajeError(error);
    expect(mensaje).toContain('Ya existe');
  });

  it('debe retornar mensaje genérico si no hay match', () => {
    const error = { message: 'Error desconocido' };
    const mensaje = obtenerMensajeError(error);
    expect(mensaje).toBe('Error desconocido');
  });
});

describe('validarFechaNoFutura', () => {
  it('debe retornar true para fecha pasada', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    expect(validarFechaNoFutura(ayer.toISOString().split('T')[0])).toBe(true);
  });

  it('debe retornar true para fecha de hoy', () => {
    const hoy = new Date().toISOString().split('T')[0];
    expect(validarFechaNoFutura(hoy)).toBe(true);
  });

  it('debe retornar false para fecha futura', () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(12, 0, 0, 0);
    const fechaString = mañana.toISOString().split('T')[0];
    // Ajustar para zona horaria
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    const fechaHoy = hoy.toISOString().split('T')[0];
    if (fechaString > fechaHoy) {
      expect(validarFechaNoFutura(fechaString)).toBe(false);
    }
  });
});

describe('validarLongitud', () => {
  it('debe retornar true si el texto está dentro del límite', () => {
    expect(validarLongitud('test', 10)).toBe(true);
  });

  it('debe retornar false si el texto excede el límite', () => {
    expect(validarLongitud('test', 3)).toBe(false);
  });
});


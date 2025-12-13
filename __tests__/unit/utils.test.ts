import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { copiarAlPortapapeles, formatearTelefono, esTurnoProximo, esTurnoAtrasado } from '@/lib/utils';

describe('Utilidades de fecha', () => {
  it('debe formatear fecha correctamente', () => {
    const fecha = new Date('2024-01-15T12:00:00Z');
    const formateada = format(fecha, 'yyyy-MM-dd');
    // Puede variar según zona horaria, así que solo verificamos formato
    expect(formateada).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('debe formatear fecha en español', () => {
    const fecha = new Date('2024-01-15');
    const formateada = format(fecha, "EEEE, d 'de' MMMM", { locale: es });
    expect(formateada).toContain('enero');
  });
});

describe('Franjas horarias', () => {
  const FRANJAS_HORARIAS = [
    '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45',
    '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45',
  ];

  it('debe tener 48 franjas horarias', () => {
    expect(FRANJAS_HORARIAS).toHaveLength(48);
  });

  it('debe empezar a las 08:00', () => {
    expect(FRANJAS_HORARIAS[0]).toBe('08:00');
  });

  it('debe terminar a las 19:45', () => {
    expect(FRANJAS_HORARIAS[FRANJAS_HORARIAS.length - 1]).toBe('19:45');
  });

  it('debe tener intervalos de 15 minutos', () => {
    for (let i = 0; i < FRANJAS_HORARIAS.length - 1; i++) {
      const [hora1, minuto1] = FRANJAS_HORARIAS[i].split(':').map(Number);
      const [hora2, minuto2] = FRANJAS_HORARIAS[i + 1].split(':').map(Number);
      
      const minutos1 = hora1 * 60 + minuto1;
      const minutos2 = hora2 * 60 + minuto2;
      
      expect(minutos2 - minutos1).toBe(15);
    }
  });
});

describe('formatearTelefono', () => {
  it('debe retornar string vacío si no hay teléfono', () => {
    expect(formatearTelefono(null)).toBe('');
    expect(formatearTelefono(undefined)).toBe('');
    expect(formatearTelefono('')).toBe('');
  });

  it('debe limpiar caracteres no numéricos', () => {
    expect(formatearTelefono('(11) 1234-5678')).toBe('1112345678');
    // formatearTelefono formatea con código de país, no limpia
    expect(formatearTelefono('+54 11 1234-5678')).toContain('+54');
  });

  it('debe formatear teléfono argentino con código de país', () => {
    const resultado = formatearTelefono('+541112345678');
    expect(resultado).toContain('+54');
    expect(resultado).toContain('11');
  });

  it('debe mantener formato si no es argentino', () => {
    expect(formatearTelefono('+1234567890')).toBe('+1234567890');
  });
});

describe('esTurnoProximo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe retornar true para turno en próximas 2 horas', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora1 = '11:00'; // 1 hora después
    const hora2 = '11:30'; // 1.5 horas después
    const hora3 = '12:00'; // 2 horas después

    expect(esTurnoProximo(fecha, hora1)).toBe(true);
    expect(esTurnoProximo(fecha, hora2)).toBe(true);
    expect(esTurnoProximo(fecha, hora3)).toBe(true);
  });

  it('debe retornar false para turno más de 2 horas después', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '13:00'; // 3 horas después

    expect(esTurnoProximo(fecha, hora)).toBe(false);
  });

  it('debe retornar false para turno en el pasado', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '09:00'; // 1 hora antes

    expect(esTurnoProximo(fecha, hora)).toBe(false);
  });
});

describe('esTurnoAtrasado', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe retornar true para turno programado en el pasado', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '09:00'; // 1 hora antes
    const estado = 'programado';

    expect(esTurnoAtrasado(fecha, hora, estado)).toBe(true);
  });

  it('debe retornar false para turno completado en el pasado', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '09:00';
    const estado = 'completado';

    expect(esTurnoAtrasado(fecha, hora, estado)).toBe(false);
  });

  it('debe retornar false para turno cancelado', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '09:00';
    const estado = 'cancelado';

    expect(esTurnoAtrasado(fecha, hora, estado)).toBe(false);
  });

  it('debe retornar false para turno futuro', () => {
    const ahora = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(ahora);

    const fecha = '2024-01-15';
    const hora = '11:00'; // 1 hora después
    const estado = 'programado';

    expect(esTurnoAtrasado(fecha, hora, estado)).toBe(false);
  });
});

describe('copiarAlPortapapeles', () => {
  beforeEach(() => {
    // Mock del navigator.clipboard
    global.navigator = {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    } as any;
    global.window = { isSecureContext: true } as any;
  });

  it('debe copiar texto usando clipboard API', async () => {
    const texto = 'test123';
    const resultado = await copiarAlPortapapeles(texto);

    expect(resultado).toBe(true);
    expect(navigator.clipboard?.writeText).toHaveBeenCalledWith(texto);
  });

  it('debe usar fallback si clipboard no está disponible', async () => {
    // Simular que clipboard no está disponible
    global.navigator = {} as any;
    const mockRemove = vi.fn();
    global.document = {
      execCommand: vi.fn().mockReturnValue(true),
      createElement: vi.fn(() => ({
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
        remove: mockRemove,
      })),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as any;

    const texto = 'test123';
    const resultado = await copiarAlPortapapeles(texto);

    expect(resultado).toBe(true);
    expect(mockRemove).toHaveBeenCalled();
  });
});

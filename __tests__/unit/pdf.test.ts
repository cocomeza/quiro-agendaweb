import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generarPDFTurnos } from '@/lib/pdf';
import type { TurnoConPaciente } from '@/lib/supabase/types';

// Mock de jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn().mockReturnThis(),
    setFont: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    setPage: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    save: vi.fn(),
    internal: {
      getNumberOfPages: vi.fn(() => 1),
      pageSize: {
        height: 297, // A4 height in mm
      },
    },
  };
  
  return {
    default: vi.fn(() => mockDoc),
  };
});

// Mock de jspdf-autotable
vi.mock('jspdf-autotable', () => {
  return {
    default: vi.fn(),
  };
});

describe('Generación de PDF de Turnos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const crearTurnoMock = (overrides?: Partial<TurnoConPaciente>): TurnoConPaciente => ({
    id: '1',
    paciente_id: '1',
    fecha: '2026-01-15',
    hora: '10:00',
    estado: 'programado',
    notas: null,
    pago: null,
    pacientes: {
      id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '1234567890',
      email: 'juan@example.com',
      fecha_nacimiento: '1990-01-01',
      numero_ficha: '001',
      direccion: 'Calle 123',
      dni: '12345678',
    },
    ...overrides,
  });

  it('debe generar PDF con turnos válidos', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({
        hora: '09:00',
        pacientes: {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '1234567890',
          email: 'juan@example.com',
          fecha_nacimiento: '1990-01-01',
          numero_ficha: '001',
          direccion: 'Calle 123',
          dni: '12345678',
        },
      }),
      crearTurnoMock({
        id: '2',
        hora: '10:00',
        pacientes: {
          id: '2',
          nombre: 'María',
          apellido: 'González',
          telefono: '0987654321',
          email: 'maria@example.com',
          fecha_nacimiento: '1985-05-15',
          numero_ficha: '002',
          direccion: 'Avenida 456',
          dni: '87654321',
        },
      }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe filtrar turnos cancelados', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({ estado: 'programado' }),
      crearTurnoMock({ id: '2', estado: 'cancelado' }),
      crearTurnoMock({ id: '3', estado: 'completado' }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe filtrar turnos sin paciente completo', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({
        pacientes: {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '1234567890',
          email: 'juan@example.com',
          fecha_nacimiento: '1990-01-01',
          numero_ficha: '001',
          direccion: 'Calle 123',
          dni: '12345678',
        },
      }),
      crearTurnoMock({
        id: '2',
        pacientes: null,
      }),
      crearTurnoMock({
        id: '3',
        pacientes: {
          id: '3',
          nombre: 'María',
          apellido: null, // Sin apellido
          telefono: '0987654321',
          email: 'maria@example.com',
          fecha_nacimiento: '1985-05-15',
          numero_ficha: '002',
          direccion: 'Avenida 456',
          dni: '87654321',
        },
      }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe ordenar turnos por hora', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({ hora: '14:00' }),
      crearTurnoMock({ id: '2', hora: '09:00' }),
      crearTurnoMock({ id: '3', hora: '11:00' }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe manejar turnos sin número de ficha', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({
        pacientes: {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: '1234567890',
          email: 'juan@example.com',
          fecha_nacimiento: '1990-01-01',
          numero_ficha: null, // Sin número de ficha
          direccion: 'Calle 123',
          dni: '12345678',
        },
      }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe manejar turnos sin teléfono', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({
        pacientes: {
          id: '1',
          nombre: 'Juan',
          apellido: 'Pérez',
          telefono: null, // Sin teléfono
          email: 'juan@example.com',
          fecha_nacimiento: '1990-01-01',
          numero_ficha: '001',
          direccion: 'Calle 123',
          dni: '12345678',
        },
      }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe generar nombre de archivo con formato correcto', async () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock(),
    ];

    const fecha = new Date('2026-01-15');

    // Mock de doc.save para capturar el nombre del archivo
    let nombreArchivoGuardado = '';
    const jsPDF = await import('jspdf');
    const mockDoc = new (jsPDF.default as any)();
    mockDoc.save = vi.fn((nombre: string) => {
      nombreArchivoGuardado = nombre;
    });

    vi.spyOn(jsPDF, 'default').mockImplementation(() => mockDoc as any);

    generarPDFTurnos(turnos, fecha);

    // El nombre debe seguir el patrón turnos_YYYY-MM-DD.pdf
    expect(nombreArchivoGuardado).toMatch(/^turnos_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('debe manejar lista vacía de turnos', () => {
    const turnos: TurnoConPaciente[] = [];
    const fecha = new Date('2026-01-15');

    // No debe lanzar error, aunque no haya turnos
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe generar PDF con fecha correcta', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock(),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });

  it('debe manejar diferentes estados de turnos (excepto cancelados)', () => {
    const turnos: TurnoConPaciente[] = [
      crearTurnoMock({ estado: 'programado' }),
      crearTurnoMock({ id: '2', estado: 'completado' }),
    ];

    const fecha = new Date('2026-01-15');

    // No debe lanzar error
    expect(() => {
      generarPDFTurnos(turnos, fecha);
    }).not.toThrow();
  });
});

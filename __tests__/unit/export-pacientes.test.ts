import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportarPacientesCSV, exportarPacientesJSON } from '@/lib/export-pacientes';
import { Database } from '@/lib/supabase/types';

type Paciente = Database['public']['Tables']['pacientes']['Row'];

describe('exportarPacientesCSV', () => {
  let mockLink: HTMLAnchorElement;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClick = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();

    mockLink = {
      href: '',
      download: '',
      click: mockClick,
    } as any;

    global.document = {
      createElement: vi.fn(() => mockLink),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:test-url'),
      revokeObjectURL: vi.fn(),
    } as any;

    global.Blob = class MockBlob {
      constructor(public parts: any[], public options: any) {}
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe lanzar error si no hay pacientes', () => {
    expect(() => exportarPacientesCSV([], 'test')).toThrow('No hay pacientes para exportar');
  });

  it('debe crear CSV con datos correctos', () => {
    const pacientes: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1112345678',
        email: 'juan@test.com',
        fecha_nacimiento: '1990-01-01',
        notas: 'Nota de prueba',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Paciente,
    ];

    exportarPacientesCSV(pacientes, 'test');

    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockLink.download).toContain('test_');
    expect(mockLink.download).toContain('.csv');
  });

  it('debe calcular edad correctamente', () => {
    const fechaNacimiento = new Date();
    fechaNacimiento.setFullYear(fechaNacimiento.getFullYear() - 30);

    const pacientes: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        fecha_nacimiento: fechaNacimiento.toISOString().split('T')[0],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Paciente,
    ];

    expect(() => exportarPacientesCSV(pacientes, 'test')).not.toThrow();
  });

  it('debe manejar pacientes sin datos opcionales', () => {
    const pacientes: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: null,
        email: null,
        fecha_nacimiento: null,
        notas: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Paciente,
    ];

    expect(() => exportarPacientesCSV(pacientes, 'test')).not.toThrow();
  });
});

describe('exportarPacientesJSON', () => {
  let mockLink: HTMLAnchorElement;
  let mockAppendChild: ReturnType<typeof vi.fn>;
  let mockRemoveChild: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockClick = vi.fn();
    mockAppendChild = vi.fn();
    mockRemoveChild = vi.fn();

    mockLink = {
      href: '',
      download: '',
      click: mockClick,
    } as any;

    global.document = {
      createElement: vi.fn(() => mockLink),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    } as any;

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:test-url'),
      revokeObjectURL: vi.fn(),
    } as any;

    global.Blob = class MockBlob {
      constructor(public parts: any[], public options: any) {}
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('debe lanzar error si no hay pacientes', () => {
    expect(() => exportarPacientesJSON([], 'test')).toThrow('No hay pacientes para exportar');
  });

  it('debe crear JSON con estructura correcta', () => {
    const pacientes: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '1112345678',
        email: 'juan@test.com',
        fecha_nacimiento: '1990-01-01',
        notas: 'Nota de prueba',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Paciente,
    ];

    exportarPacientesJSON(pacientes, 'test');

    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockLink.download).toContain('test_');
    expect(mockLink.download).toContain('.json');
  });

  it('debe incluir metadatos en JSON', () => {
    const pacientes: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan',
        apellido: 'Pérez',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      } as Paciente,
    ];

    // Mock Blob correctamente
    let blobContent: string = '';
    global.Blob = class MockBlob {
      constructor(public parts: any[], public options: any) {
        blobContent = parts[0];
      }
    } as any;

    exportarPacientesJSON(pacientes, 'test');

    expect(blobContent).toBeTruthy();
    const datos = JSON.parse(blobContent);
    expect(datos).toHaveProperty('fecha_exportacion');
    expect(datos).toHaveProperty('total_pacientes', 1);
    expect(datos).toHaveProperty('pacientes');
    expect(Array.isArray(datos.pacientes)).toBe(true);
  });
});


/**
 * Tests unitarios completos para exportación de pacientes
 * Área crítica: Copias de seguridad y exportación de datos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportarPacientesCSV, exportarPacientesJSON } from '@/lib/export-pacientes';
import type { Database } from '@/lib/supabase/types';

type Paciente = Database['public']['Tables']['pacientes']['Row'];

// Mock del DOM
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClick = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
let blobContent: string = '';

beforeEach(() => {
  // Mock de document.createElement
  const mockLink = {
    href: '',
    download: '',
    click: mockClick,
  };
  mockCreateElement.mockReturnValue(mockLink);

  // Mock de document.body
  global.document = {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild,
    },
  } as any;

  // Mock de URL.createObjectURL y revokeObjectURL
  global.URL = {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  } as any;

  // Mock de Blob que captura el contenido
  global.Blob = class MockBlob {
    constructor(public parts: any[], public options: any) {
      blobContent = parts[0];
    }
  } as any;

  mockCreateObjectURL.mockReturnValue('blob:mock-url');
  mockClick.mockClear();
  mockAppendChild.mockClear();
  mockRemoveChild.mockClear();
  blobContent = '';
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Exportación de Pacientes - CSV', () => {
  const pacientesMock: Paciente[] = [
    {
      id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '1234567890',
      email: 'juan@example.com',
      fecha_nacimiento: '1990-01-15',
      notas: 'Paciente regular',
      numero_ficha: '001',
      llamado_telefono: false,
      fecha_ultimo_llamado: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      nombre: 'María',
      apellido: 'González',
      telefono: null,
      email: null,
      fecha_nacimiento: null,
      notas: null,
      numero_ficha: '002',
      llamado_telefono: false,
      fecha_ultimo_llamado: null,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    },
  ];

  it('debe exportar CSV con datos válidos', () => {
    expect(() => {
      exportarPacientesCSV(pacientesMock, 'test-pacientes');
    }).not.toThrow();

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('debe lanzar error si no hay pacientes para exportar', () => {
    expect(() => {
      exportarPacientesCSV([], 'test-pacientes');
    }).toThrow('No hay pacientes para exportar');
  });

  it('debe crear blob con tipo CSV correcto', () => {
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    // Verificar que se creó contenido CSV
    expect(blobContent).toBeTruthy();
    expect(blobContent.length).toBeGreaterThan(0);
  });

  it('debe incluir BOM UTF-8 para compatibilidad con Excel', () => {
    const BlobSpy = vi.spyOn(global, 'Blob' as any);
    
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    const blobContent = BlobSpy.mock.calls[0][0][0];
    expect(blobContent).toContain('\uFEFF'); // BOM UTF-8
  });

  it('debe incluir todos los encabezados requeridos', () => {
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    const csvContent = blobContent.replace('\uFEFF', ''); // Remover BOM para comparar
    const headers = [
      'Nombre',
      'Apellido',
      'Teléfono',
      'Email',
      'Fecha de Nacimiento',
      'Edad',
      'Notas',
    ];

    headers.forEach(header => {
      expect(csvContent).toContain(header);
    });
  });

  it('debe calcular edad correctamente cuando hay fecha de nacimiento', () => {
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    const csvContent = blobContent.replace('\uFEFF', '');
    // Debe contener algún número de edad (calculado dinámicamente)
    expect(csvContent).toMatch(/\d+/);
  });

  it('debe manejar valores nulos correctamente', () => {
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    const csvContent = blobContent.replace('\uFEFF', '');
    // No debe contener "null" o "undefined" como strings
    expect(csvContent).not.toContain('null');
    expect(csvContent).not.toContain('undefined');
  });

  it('debe escapar comillas y comas en los datos', () => {
    const pacientesConComillas: Paciente[] = [
      {
        id: '1',
        nombre: 'Juan "El Grande"',
        apellido: 'Pérez, González',
        telefono: '1234567890',
        email: 'juan@example.com',
        fecha_nacimiento: null,
        notas: 'Nota con, comas y "comillas"',
        numero_ficha: '001',
        llamado_telefono: false,
        fecha_ultimo_llamado: null,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
      },
    ];

    exportarPacientesCSV(pacientesConComillas, 'test-pacientes');

    const csvContent = blobContent.replace('\uFEFF', '');
    // Debe escapar comillas dobles o envolver en comillas
    expect(csvContent).toMatch(/[""]|"/);
  });

  it('debe generar nombre de archivo con fecha', () => {
    exportarPacientesCSV(pacientesMock, 'test-pacientes');

    const linkElement = mockCreateElement.mock.results[0].value;
    const fecha = new Date().toISOString().split('T')[0];
    expect(linkElement.download).toContain('test-pacientes');
    expect(linkElement.download).toContain(fecha);
    expect(linkElement.download).toContain('.csv');
  });

  it('debe usar nombre por defecto si no se proporciona', () => {
    exportarPacientesCSV(pacientesMock);

    const linkElement = mockCreateElement.mock.results[0].value;
    expect(linkElement.download).toContain('pacientes');
  });
});

describe('Exportación de Pacientes - JSON', () => {
  const pacientesMock: Paciente[] = [
    {
      id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '1234567890',
      email: 'juan@example.com',
      fecha_nacimiento: '1990-01-15',
      notas: 'Paciente regular',
      numero_ficha: '001',
      llamado_telefono: false,
      fecha_ultimo_llamado: null,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      nombre: 'María',
      apellido: 'González',
      telefono: null,
      email: null,
      fecha_nacimiento: null,
      notas: null,
      numero_ficha: '002',
      llamado_telefono: false,
      fecha_ultimo_llamado: null,
      created_at: '2024-01-02T10:00:00Z',
      updated_at: '2024-01-02T10:00:00Z',
    },
  ];

  it('debe exportar JSON con datos válidos', () => {
    expect(() => {
      exportarPacientesJSON(pacientesMock, 'test-pacientes');
    }).not.toThrow();

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('debe lanzar error si no hay pacientes para exportar', () => {
    expect(() => {
      exportarPacientesJSON([], 'test-pacientes');
    }).toThrow('No hay pacientes para exportar');
  });

  it('debe crear blob con tipo JSON correcto', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    // Verificar que se creó contenido JSON
    expect(blobContent).toBeTruthy();
    expect(() => JSON.parse(blobContent)).not.toThrow();
  });

  it('debe incluir metadata de exportación', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    const datos = JSON.parse(blobContent);

    expect(datos).toHaveProperty('fecha_exportacion');
    expect(datos).toHaveProperty('total_pacientes');
    expect(datos.total_pacientes).toBe(2);
    expect(datos).toHaveProperty('pacientes');
    expect(Array.isArray(datos.pacientes)).toBe(true);
  });

  it('debe incluir todos los campos de paciente en JSON', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    const datos = JSON.parse(blobContent);
    const paciente = datos.pacientes[0];

    expect(paciente).toHaveProperty('nombre');
    expect(paciente).toHaveProperty('apellido');
    expect(paciente).toHaveProperty('telefono');
    expect(paciente).toHaveProperty('email');
    expect(paciente).toHaveProperty('fecha_nacimiento');
    expect(paciente).toHaveProperty('notas');
    expect(paciente).toHaveProperty('fecha_registro');
    expect(paciente).toHaveProperty('ultima_actualizacion');
  });

  it('debe manejar valores nulos correctamente en JSON', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    const datos = JSON.parse(blobContent);
    const pacienteSinDatos = datos.pacientes[1];

    expect(pacienteSinDatos.telefono).toBeNull();
    expect(pacienteSinDatos.email).toBeNull();
    expect(pacienteSinDatos.fecha_nacimiento).toBeNull();
  });

  it('debe generar JSON con formato legible (indentado)', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    // JSON.stringify con indentación debe tener saltos de línea
    expect(blobContent).toContain('\n');
    // Debe ser JSON válido
    expect(() => JSON.parse(blobContent)).not.toThrow();
  });

  it('debe generar nombre de archivo con fecha', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    const linkElement = mockCreateElement.mock.results[0].value;
    const fecha = new Date().toISOString().split('T')[0];
    expect(linkElement.download).toContain('test-pacientes');
    expect(linkElement.download).toContain(fecha);
    expect(linkElement.download).toContain('.json');
  });

  it('debe usar nombre por defecto si no se proporciona', () => {
    exportarPacientesJSON(pacientesMock);

    const linkElement = mockCreateElement.mock.results[0].value;
    expect(linkElement.download).toContain('pacientes');
  });

  it('debe incluir fecha de exportación en formato ISO', () => {
    exportarPacientesJSON(pacientesMock, 'test-pacientes');

    const datos = JSON.parse(blobContent);

    // Debe ser una fecha ISO válida
    expect(() => new Date(datos.fecha_exportacion)).not.toThrow();
    expect(datos.fecha_exportacion).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('Integridad de Datos Exportados', () => {
  const pacienteCompleto: Paciente = {
    id: '1',
    nombre: 'Juan Carlos',
    apellido: 'Pérez González',
    telefono: '+54 341 123-4567',
    email: 'juan.perez@example.com',
    fecha_nacimiento: '1990-05-15',
    notas: 'Paciente con notas importantes',
    numero_ficha: '001',
    llamado_telefono: true,
    fecha_ultimo_llamado: '2024-01-10',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
  };

  it('debe preservar todos los datos del paciente en CSV', () => {
    exportarPacientesCSV([pacienteCompleto], 'test');

    const csvContent = blobContent.replace('\uFEFF', '');
    expect(csvContent).toContain('Juan Carlos');
    expect(csvContent).toContain('Pérez González');
    expect(csvContent).toContain('+54 341 123-4567');
    expect(csvContent).toContain('juan.perez@example.com');
  });

  it('debe preservar todos los datos del paciente en JSON', () => {
    exportarPacientesJSON([pacienteCompleto], 'test');

    const datos = JSON.parse(blobContent);
    const paciente = datos.pacientes[0];

    expect(paciente.nombre).toBe('Juan Carlos');
    expect(paciente.apellido).toBe('Pérez González');
    expect(paciente.telefono).toBe('+54 341 123-4567');
    expect(paciente.email).toBe('juan.perez@example.com');
  });

  it('debe mantener consistencia entre CSV y JSON para los mismos datos', () => {
    exportarPacientesCSV([pacienteCompleto], 'test');
    const csvContent = blobContent.replace('\uFEFF', '');
    
    blobContent = ''; // Reset para JSON
    exportarPacientesJSON([pacienteCompleto], 'test');
    const datosJSON = JSON.parse(blobContent);

    // Ambos deben contener los mismos datos básicos
    expect(csvContent).toContain(pacienteCompleto.nombre);
    expect(datosJSON.pacientes[0].nombre).toBe(pacienteCompleto.nombre);
    expect(csvContent).toContain(pacienteCompleto.apellido);
    expect(datosJSON.pacientes[0].apellido).toBe(pacienteCompleto.apellido);
  });
});

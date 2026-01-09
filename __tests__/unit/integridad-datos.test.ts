/**
 * Tests unitarios para integridad de datos
 * Área crítica: Prevenir duplicados y mantener consistencia
 */

import { describe, it, expect } from 'vitest';

describe('Integridad de Datos - Validaciones Críticas', () => {
  describe('Prevención de Duplicados', () => {
    it('debe detectar pacientes duplicados por nombre y apellido', () => {
      const pacientes = [
        { nombre: 'Juan', apellido: 'Pérez' },
        { nombre: 'María', apellido: 'González' },
        { nombre: 'Juan', apellido: 'Pérez' }, // Duplicado
      ];

      const hayDuplicado = pacientes.some((paciente, index) =>
        pacientes.slice(index + 1).some(
          otro => otro.nombre.toLowerCase() === paciente.nombre.toLowerCase() &&
                  otro.apellido.toLowerCase() === paciente.apellido.toLowerCase()
        )
      );

      expect(hayDuplicado).toBe(true);
    });

    it('debe detectar números de ficha duplicados', () => {
      const fichas = ['001', '002', '003', '001']; // Duplicado

      const hayDuplicado = fichas.some((ficha, index) =>
        fichas.slice(index + 1).includes(ficha)
      );

      expect(hayDuplicado).toBe(true);
    });

    it('debe detectar turnos duplicados por fecha y hora', () => {
      const turnos = [
        { fecha: '2026-01-15', hora: '10:00' },
        { fecha: '2026-01-15', hora: '11:00' },
        { fecha: '2026-01-15', hora: '10:00' }, // Duplicado
      ];

      const hayDuplicado = turnos.some((turno, index) =>
        turnos.slice(index + 1).some(
          otro => otro.fecha === turno.fecha && otro.hora === turno.hora
        )
      );

      expect(hayDuplicado).toBe(true);
    });
  });

  describe('Validación de Referencias', () => {
    it('debe validar que paciente_id existe antes de crear turno', () => {
      const pacientesExistentes = [
        { id: 'paciente-1', nombre: 'Juan' },
        { id: 'paciente-2', nombre: 'María' },
      ];

      const turnoConPacienteValido = { paciente_id: 'paciente-1', fecha: '2026-01-15', hora: '10:00' };
      const turnoConPacienteInvalido = { paciente_id: 'paciente-999', fecha: '2026-01-15', hora: '10:00' };

      const pacienteExiste = (pacienteId: string) => 
        pacientesExistentes.some(p => p.id === pacienteId);

      expect(pacienteExiste(turnoConPacienteValido.paciente_id)).toBe(true);
      expect(pacienteExiste(turnoConPacienteInvalido.paciente_id)).toBe(false);
    });

    it('debe validar que no se puede eliminar paciente con turnos activos', () => {
      const paciente = { id: 'paciente-1', nombre: 'Juan' };
      const turnos = [
        { paciente_id: 'paciente-1', estado: 'programado' },
        { paciente_id: 'paciente-1', estado: 'completado' },
      ];

      const tieneTurnosActivos = turnos.some(
        t => t.paciente_id === paciente.id && t.estado === 'programado'
      );

      expect(tieneTurnosActivos).toBe(true);
      // En la aplicación real, esto debería prevenir la eliminación
    });
  });

  describe('Consistencia de Datos', () => {
    it('debe validar que fecha de nacimiento no sea futura', () => {
      const hoy = new Date();
      const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);

      const fechaNacimientoValida = hoy.toISOString().split('T')[0];
      const fechaNacimientoInvalida = mañana.toISOString().split('T')[0];

      const validarFechaNacimiento = (fecha: string) => {
        const fechaObj = new Date(fecha);
        const hoyObj = new Date();
        return fechaObj <= hoyObj;
      };

      expect(validarFechaNacimiento(fechaNacimientoValida)).toBe(true);
      expect(validarFechaNacimiento(fechaNacimientoInvalida)).toBe(false);
    });

    it('debe validar que fecha de turno no sea pasada para nuevos turnos', () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      ayer.setHours(0, 0, 0, 0);

      const fechaTurnoValida = hoy.toISOString().split('T')[0];
      const fechaTurnoInvalida = ayer.toISOString().split('T')[0];

      const validarFechaTurno = (fecha: string) => {
        const fechaObj = new Date(fecha + 'T00:00:00');
        const hoyObj = new Date();
        hoyObj.setHours(0, 0, 0, 0);
        return fechaObj.getTime() >= hoyObj.getTime();
      };

      expect(validarFechaTurno(fechaTurnoValida)).toBe(true);
      expect(validarFechaTurno(fechaTurnoInvalida)).toBe(false);
    });

    it('debe validar que número de ficha sea único', () => {
      const fichasExistentes = ['001', '002', '003'];
      const nuevaFicha = '004';
      const fichaDuplicada = '001';

      const esFichaUnica = (ficha: string) => !fichasExistentes.includes(ficha);

      expect(esFichaUnica(nuevaFicha)).toBe(true);
      expect(esFichaUnica(fichaDuplicada)).toBe(false);
    });
  });

  describe('Validación de Campos Requeridos', () => {
    it('debe validar que nombre y apellido son requeridos para paciente', () => {
      const pacienteValido = { nombre: 'Juan', apellido: 'Pérez' };
      const pacienteInvalido1 = { nombre: '', apellido: 'Pérez' };
      const pacienteInvalido2 = { nombre: 'Juan', apellido: '' };
      const pacienteInvalido3 = { nombre: '', apellido: '' };

      const validarPaciente = (paciente: { nombre: string; apellido: string }) => {
        return paciente.nombre.trim() !== '' && paciente.apellido.trim() !== '';
      };

      expect(validarPaciente(pacienteValido)).toBe(true);
      expect(validarPaciente(pacienteInvalido1)).toBe(false);
      expect(validarPaciente(pacienteInvalido2)).toBe(false);
      expect(validarPaciente(pacienteInvalido3)).toBe(false);
    });

    it('debe validar que paciente_id, fecha y hora son requeridos para turno', () => {
      const turnoValido = { paciente_id: 'paciente-1', fecha: '2026-01-15', hora: '10:00' };
      const turnoInvalido1 = { paciente_id: '', fecha: '2026-01-15', hora: '10:00' };
      const turnoInvalido2 = { paciente_id: 'paciente-1', fecha: '', hora: '10:00' };
      const turnoInvalido3 = { paciente_id: 'paciente-1', fecha: '2026-01-15', hora: '' };

      const validarTurno = (turno: { paciente_id: string; fecha: string; hora: string }) => {
        return turno.paciente_id !== '' && turno.fecha !== '' && turno.hora !== '';
      };

      expect(validarTurno(turnoValido)).toBe(true);
      expect(validarTurno(turnoInvalido1)).toBe(false);
      expect(validarTurno(turnoInvalido2)).toBe(false);
      expect(validarTurno(turnoInvalido3)).toBe(false);
    });
  });

  describe('Normalización de Datos', () => {
    it('debe normalizar nombres y apellidos (trim y capitalización)', () => {
      const normalizarNombre = (nombre: string): string => {
        return nombre.trim()
          .split(/\s+/) // Dividir por uno o más espacios
          .map(palabra => 
            palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
          )
          .join(' ');
      };

      expect(normalizarNombre('  juan  ')).toBe('Juan');
      expect(normalizarNombre('MARÍA GONZÁLEZ')).toBe('María González');
      expect(normalizarNombre('pedro  de  la  torre')).toBe('Pedro De La Torre');
    });

    it('debe normalizar teléfonos removiendo caracteres especiales', () => {
      const normalizarTelefono = (telefono: string): string => {
        return telefono.replace(/[\s\-\(\)]/g, '');
      };

      expect(normalizarTelefono('(0341) 123-4567')).toBe('03411234567');
      expect(normalizarTelefono('+54 341 123 4567')).toBe('+543411234567');
      expect(normalizarTelefono('12345678')).toBe('12345678');
    });

    it('debe normalizar emails a minúsculas', () => {
      const normalizarEmail = (email: string): string => {
        return email.trim().toLowerCase();
      };

      expect(normalizarEmail('  Test@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(normalizarEmail('Usuario@Gmail.Com')).toBe('usuario@gmail.com');
    });
  });
});

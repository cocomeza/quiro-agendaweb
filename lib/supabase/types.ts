// Tipos mejorados para evitar 'as any'
// Definimos tipos básicos basados en el schema de Supabase
export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
  observaciones: string | null;
  notas?: string | null;
  edad: number | null;
  genero: 'masculino' | 'femenino' | 'otro' | null;
  ultima_visita: string | null;
  llamado_telefono: boolean;
  fecha_ultimo_llamado: string | null;
  motivo_consulta?: string | null;
  antecedentes_medicos?: string | null;
  medicamentos_actuales?: string | null;
  alergias?: string | null;
  diagnostico?: string | null;
  plan_tratamiento?: string | null;
  observaciones_medicas?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'atendido' | 'cancelado';
  notas: string | null;
  payment_status?: 'pagado' | 'impago';
  created_at: string;
  updated_at: string;
}

// Tipo extendido para turnos con paciente
export type TurnoConPaciente = Turno & {
  pacientes: Paciente;
};

// Tipo para paciente con campos de ficha médica
export type PacienteConFichaMedica = Paciente & {
  motivo_consulta?: string | null;
  antecedentes_medicos?: string | null;
  medicamentos_actuales?: string | null;
  alergias?: string | null;
  diagnostico?: string | null;
  plan_tratamiento?: string | null;
  observaciones_medicas?: string | null;
};

// Tipo para turno con campo de pago
export type TurnoConPago = Turno & {
  pago?: 'pagado' | 'impago';
};

// Tipo Database para compatibilidad (opcional)
export type Database = {
  public: {
    Tables: {
      pacientes: { Row: Paciente };
      turnos: { Row: Turno };
    };
  };
};

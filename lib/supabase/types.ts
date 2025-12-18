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
  dni: string | null;
  observaciones: string | null;
  notas?: string | null;
  edad: number | null;
  genero: 'masculino' | 'femenino' | 'otro' | null;
  ultima_visita: string | null;
  llamado_telefono: boolean;
  fecha_ultimo_llamado: string | null;
  numero_ficha: string | null;
  motivo_consulta?: string | null;
  antecedentes_medicos?: string | null;
  medicamentos_actuales?: string | null;
  alergias?: string | null;
  diagnostico?: string | null;
  plan_tratamiento?: string | null;
  observaciones_medicas?: string | null;
  // Nuevos campos de información general
  estado_civil?: string | null;
  recomendado_por?: string | null;
  barrio?: string | null;
  ciudad?: string | null;
  provincia?: string | null;
  obra_social?: string | null;
  telefono_laboral?: string | null;
  ocupacion_actual?: string | null;
  ocupaciones_previas?: string | null;
  hobbies_deportes?: string | null;
  // Campos JSON para historia de salud y problemas médicos
  historia_salud?: any;
  problemas_medicos?: any;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id: string;
  paciente_id: string;
  fecha: string;
  hora: string;
  estado: 'programado' | 'completado' | 'cancelado';
  notas: string | null;
  pago: 'pagado' | 'impago';
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

// Tipo para turno con campo de pago (compatibilidad)
export type TurnoConPago = Turno;

// Tipo Database para compatibilidad (opcional)
export type Database = {
  public: {
    Tables: {
      pacientes: { Row: Paciente };
      turnos: { Row: Turno };
    };
  };
};
